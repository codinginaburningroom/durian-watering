#!/usr/bin/env bash
# exit on error
set -o errexit

echo ">>> Building Frontend..."
cd frontend
npm install
npm run build

echo ">>> Installing Backend Dependencies..."
cd ..
pip install -r backend/requirements.txt
