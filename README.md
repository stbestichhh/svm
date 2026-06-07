# svm

Lightweight terminal-based sandbox environments powered by Docker.

`svm` lets you quickly create disposable or persistent development environments directly from your terminal without the overhead of full virtual machines or complex setup.

---

## Features

* Run isolated Node.js, Ubuntu, or Debian environments in seconds
* Disposable or persistent containers
* Optional current-directory mounting for development workflows
* Open, remove, start, and stop environments
* Manage Docker engine directly from CLI
* No Node.js or extra runtime dependencies required
* Works on Linux, macOS, and Windows (via WSL2 + Docker)

---

## Supported Environments

* Node.js (`node:22`)
* Ubuntu (`ubuntu`)
* Debian (`debian:latest`)

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

---

## Requirements

* Docker installed
* Docker engine running

---

## Installation

### 1. Via `curl`

```shell
curl -fsSL https://raw.githubusercontent.com/stbestichhh/svm/master/svm -o svm
chmod +x svm
sudo mv svm /usr/local/bin/
```

---

### 2. Via `wget`

```shell
wget https://raw.githubusercontent.com/stbestichhh/svm/master/svm
chmod +x svm
sudo mv svm /usr/local/bin/
```

---

### 3. One-line install

```shell
curl -fsSL https://raw.githubusercontent.com/stbestichhh/svm/master/install.sh | bash
```

---

## Examples

```shell
svm node
svm node -m
svm node -p backend
svm node -p backend -m

svm ls
svm open backend
svm stop backend
svm remove backend
```

---

## Why?

`svm` was built for developers who want:

* fast isolated environments
* reproducible CLI testing
* lightweight dev sandboxes
* terminal-first workflows
* minimal setup and tooling

Instead of managing full virtual machines, `svm` uses Docker containers to provide lightweight disposable environments with a simple CLI interface.

---

## License

MIT
