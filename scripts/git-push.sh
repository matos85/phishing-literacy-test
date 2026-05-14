#!/usr/bin/env bash
# Отправка main на GitHub, используя git-push.credentials.env (не в Git).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
ENV_FILE="$ROOT/git-push.credentials.env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Создайте $ENV_FILE с GITHUB_USERNAME и GITHUB_TOKEN (PAT GitHub с доступом к repo)"
  exit 1
fi
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a
if [[ -z "${GITHUB_USERNAME:-}" || -z "${GITHUB_TOKEN:-}" ]]; then
  echo "В $ENV_FILE должны быть заданы GITHUB_USERNAME и GITHUB_TOKEN"
  exit 1
fi
REMOTE_PATH="matos85/phishing-literacy-test.git"
git push "https://${GITHUB_USERNAME}:${GITHUB_TOKEN}@github.com/${REMOTE_PATH}" main
