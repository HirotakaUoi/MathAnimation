#!/bin/zsh
set -e

cd "$(dirname "$0")"

PORT="${1:-8100}"
echo "Serving Matrix Motion from: $PWD"
echo "Open: http://localhost:$PORT/"
python3 -m http.server "$PORT"
