#!/usr/bin/env bash

set -e

REPO_URL="https://raw.githubusercontent.com/stbestichhh/svm/refs/heads/master/svm"
INSTALL_PATH="/usr/local/bin/svm"

echo "Installing svm..."

curl -fsSL "$REPO_URL" -o svm

chmod +x svm
sudo mv svm "$INSTALL_PATH"

echo "✔ svm installed successfully!"
echo "Run: svm help"