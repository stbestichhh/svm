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
```shell
    
```
chmod +x sandbox
sudo mv sandbox /usr/local/bin/