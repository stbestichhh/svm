# svm

This tool is designed for developers who want a fast, disposable, terminal-only sandbox environment without the overhead of full VMs or complex setup.

### Features
* Run isolated Node.js or Ubuntu environments in seconds
* Optional current-directory mounting for real development workflows
* No Node.js or extra dependencies required
* Works on Linux, macOS. Also works on Windows (via WSL2 + Docker)

### Usage
```shell
svm node
svm ubuntu
```

With mounted project directory:
```shell
svm node --mount
svm ubuntu -m
```

### Requirements
* Docker installed and running

### Installation

#### 1. Via `curl`
```shell
curl -fsSL https://raw.githubusercontent.com/stbestichhh/svm/refs/heads/master/svm -o svm
chmod +x svm
sudo mv svm /usr/local/bin/
```

#### 2. Via `wget`
```shell
wget https://raw.githubusercontent.com/stbestichhh/svm/refs/heads/master/svm
chmod +x svm
sudo mv svm /usr/local/bin/
```

#### 3. One line install
```shell
curl -fsSL https://raw.githubusercontent.com/stbestichhh/svm/refs/heads/master/install.sh | bash
```