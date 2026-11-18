#!/bin/sh
set -eu

root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
profile=${1:-all}
base=${TAPMELO_TEST_ORIGIN:-http://127.0.0.1:4173}
session="tapmelo-qa-$$"
work=$(mktemp -d)
cd "$work"

browser() {
  if [ -n "${PLAYWRIGHT_CLI:-}" ]; then
    "$PLAYWRIGHT_CLI" "-s=$session" "$@"
  else
    npx --yes --package @playwright/cli playwright-cli "-s=$session" "$@"
  fi
}

trap 'browser close >/dev/null 2>&1 || true; rm -rf "$work"' EXIT
browser open "$base/?locales=$profile" --browser=chrome
browser run-code --filename "$root/site/scripts/browser-locales.js"
