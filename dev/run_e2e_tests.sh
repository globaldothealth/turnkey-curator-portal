#!/bin/bash

set -eou pipefail

echo "Setting up localstack"
python3 setup_localstack.py

echo "Running end-to-end tests"
python3 -m pytest -rs -v .
echo "Tests complete"