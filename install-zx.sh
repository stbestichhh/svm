#!/usr/bin/env bash

set -e

REPO_URL="https://raw.githubusercontent.com/stbestichhh/svm/refs/heads/master/svm.mjs"
INSTALL_PATH="/usr/local/bin/svm"

if ! command -v zx &>/dev/null; then
  echo "Error: 'zx' is not installed or not in PATH." >&2
  echo "Install it first: npm i -g zx" >&2
  exit 1
fi

echo "Installing svm (zx build)..."

curl -fsSL "$REPO_URL" -o svm.mjs

chmod +x svm.mjs
sudo mv svm.mjs "$INSTALL_PATH"

echo "✔ svm installed successfully!"
echo "Run: svm help"
