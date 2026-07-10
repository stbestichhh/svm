# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`svm` ("simple container sandbox manager") is a single self-contained Bash script (`svm`) that wraps two container backends behind one CLI: **Docker** and **Apple's `container` CLI** (provider id `osx`, macOS only). There is no build system, dependency manifest, or automated test suite — the entire program is the `svm` file.

## Commands

- Run locally: `./svm <command>` (e.g. `./svm ls`, `./svm node -p api`, `./svm status`)
- Lint: `shellcheck ./svm` (install with `brew install shellcheck`)
- Syntax check: `bash -n ./svm`
- Install to PATH: `./install.sh` downloads the latest `svm` from GitHub `master` into `/usr/local/bin/svm`. For local dev instead use `chmod +x svm && sudo cp svm /usr/local/bin/svm`.

There are no automated tests. Verify changes by exercising the CLI against a live provider (see Testing against providers).

## Architecture

Read the `svm` script top-to-bottom as three layers:

1. **Argument parser** — the `while [[ $# -gt 0 ]]` case block near the top only sets global state (`MODE`, `TARGET_NAME`, `PERSIST_NAME`, `HAS_MOUNT`, `PROVIDER`, `CMD_PROVIDER`, `CONTAINER_ACTION`). No work happens here.
2. **Functions** — provider helpers, container primitives, and `cmd_*` / `run_*` / `show_*` command implementations.
3. **Router** — the `case "$MODE"` block at the bottom dispatches to the command functions. Most commands run `check_provider_available` first.

### Provider abstraction (the central pattern)

Every provider-specific operation is a `case "$(get_current_provider)" in docker) … ;; osx) … ;; esac` block. The active provider is resolved by `get_current_provider`: the per-command `--provider` flag (`CMD_PROVIDER`) wins, otherwise the saved default in `$CONFIG_FILE` (`~/.config/svm/config`), otherwise `docker`.

**When adding or changing provider behavior, update every one of these `case` blocks.** The container primitives are `container_exists`, `create_container`, `attach_container`, `run_ephemeral`, `list_containers`, and `remove_container`, plus provider branches inside `cmd_system` and `show_status`.

The two providers have genuinely different semantics, not just different command names: Docker persistent containers use `docker create` + `docker start -ai`; the osx provider has no equivalent, so it uses `container run -d … sleep infinity` + `container exec -it`, and `attach_container` installs an EXIT trap to stop the container when the shell closes.

### svm-managed container marking

svm stamps the label `svm=true` (constant `SVM_LABEL`) on every container it creates, so it can list/count only its own containers and never touch others on the same host. `list_containers` and the `status` count both filter on this label:

- **docker**: native `--filter "label=svm=true"`.
- **osx**: Apple's `container ls` has **no** `--filter` flag, so `list_osx_svm` reads `container ls -a --format json` and filters with `jq` (path `.configuration.labels.svm`), falling back to an unfiltered list plus a warning if `jq` is absent.

Container labels are immutable after creation on both providers, so containers created before this marking (or by hand) will never appear in `svm ls`.

## Testing against providers

- **docker**: requires the Docker daemon running (`docker info` succeeds).
- **osx**: requires `container system start` before any container command, only works on macOS, and needs `jq` for filtered `ls` / `status`.

## Conventions

- `VERSION` is a variable at the top of `svm`; `show_version` and `show_status` echo it. Bump it when releasing user-visible changes.
- Git history follows Conventional Commits (`feat:`, `fix:`, `docs:`) with work done on `feature/*` branches merged to `master` via PR.
