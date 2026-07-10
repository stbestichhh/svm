# svm

Lightweight terminal-based sandbox environments powered by containers.

`svm` lets you quickly create disposable or persistent development environments directly from your terminal without the overhead of full virtual machines or complex setup.

#### Quick install

Via npm (installs the `svm` command globally):

```shell
npm i -g svmbox
```

Or with a one-line script:

```shell
curl -fsSL https://raw.githubusercontent.com/stbestichhh/svm/master/install.sh | bash
```

---

## Features

* Run isolated Node.js, Ubuntu, or Debian environments in seconds
* Disposable or persistent containers
* Optional current-directory mounting for development workflows
* Open, remove, start, and stop environments
* **Multiple container providers** — Docker and Apple Container (macOS)
* Switch providers globally or override per-command
* No Node.js or extra runtime dependencies required
* Works on Linux, macOS, and Windows (via WSL2 + Docker)

---

## Supported Environments

* Node.js (`node:22`)
* Ubuntu (`ubuntu`)
* Debian (`debian:latest`)

---

## Container Providers

`svm` supports multiple container backends through a provider system:

| Provider        | ID       | Platform                     | Description                                                           |
|-----------------|----------|------------------------------|-----------------------------------------------------------------------|
| Docker          | `docker` | Linux, macOS, Windows (WSL2) | Default provider. Uses the Docker CLI and daemon.                     |
| Apple Container | `osx`    | macOS only                   | Uses Apple's native `container` CLI for lightweight macOS containers. |

### Set default provider

```shell
svm provider docker
svm provider osx
```

The chosen provider is saved to `~/.config/svm/config` and used for all subsequent commands.

### Override provider per-command

Use the `--provider` flag to override the default provider for a single command:

```shell
svm node --provider osx
svm ubuntu -p dev --provider docker
```

---

## Usage

### Run disposable environment

```shell
svm node
svm ubuntu
svm debian
```

---

### Mount current project directory

```shell
svm node --mount
svm ubuntu -m
```

---

### Persistent environments

Create persistent environment:

```shell
svm node -p api
```

Reopen environment:

```shell
svm open api
```

Remove environment:

```shell
svm remove api
```

List environments:

```shell
svm ls
```

`svm ls` (and the count shown by `svm status`) lists **only containers created by `svm`** — other containers running on the same provider are ignored. This works by stamping an `svm=true` label on every container `svm` creates and filtering on it.

---

### System management

Control the container provider service (currently applicable to the `osx` provider):

```shell
svm system start
svm system stop
```

---

### Status

Show general information about `svm`, including the current provider, whether it is running, and available environments:

```shell
svm status
```

Example output:

```
svm v1.18

Provider:  docker
Status:    running
Config:    /home/user/.config/svm/config

Available environments:
  node     node:22
  ubuntu   ubuntu
  debian   debian:latest

Persistent containers:
  3 container(s)
```

---

## Requirements

You need at least one container provider installed:

* **Docker** — Docker installed and the Docker engine running
* **Apple Container (osx)** — Apple `container` CLI available in PATH (macOS only). `jq` is also recommended so `svm ls`/`svm status` can filter to svm-managed containers; it ships with recent macOS and is otherwise available via `brew install jq`.

---

## Installation

### 1. Via `npm`

Installs the `svm` command globally. Requires Node.js/npm; the package is published as [`svmbox`](https://www.npmjs.com/package/svmbox), while the installed command is `svm`.

```shell
npm i -g svmbox
```

---

### 2. Via `curl`

```shell
curl -fsSL https://raw.githubusercontent.com/stbestichhh/svm/master/svm -o svm
chmod +x svm
sudo mv svm /usr/local/bin/
```

---

### 3. Via `wget`

```shell
wget https://raw.githubusercontent.com/stbestichhh/svm/master/svm
chmod +x svm
sudo mv svm /usr/local/bin/
```

---

### 4. One-line install script

```shell
curl -fsSL https://raw.githubusercontent.com/stbestichhh/svm/master/install.sh | bash
```

---

## Examples

```shell
# Run environments
svm node
svm node -m
svm node -p backend
svm node -p backend -m

# Manage environments
svm ls
svm open backend
svm remove backend

# Provider management
svm provider osx
svm provider docker
svm node --provider osx

# System control (osx provider)
svm system start
svm system stop

# Status
svm status
```

---

## Why?

`svm` was built for developers who want:

* fast isolated environments
* reproducible CLI testing
* lightweight dev sandboxes
* terminal-first workflows
* minimal setup and tooling

Instead of managing full virtual machines, `svm` uses containers to provide lightweight disposable environments with a simple CLI interface. With multi-provider support, you can use Docker on any platform or Apple's native container runtime on macOS.

---

## License

MIT
