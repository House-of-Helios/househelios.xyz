#!/bin/bash
# Before anything goes to GitHub: every file and every commit on the branch that leaves (default
# `public`, built by tools/publish.sh; the local full history never leaves) must carry no private
# data. Usage: tools/check-publish.sh [ref]. Looks for home-directory paths, e-mail addresses,
# attribution lines and public IPv4 addresses (allowed: private and documentation ranges). Prints
# counts and where, never the matched text. Exit 1 on any finding.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
REF="${1:-public}"
git rev-parse -q --verify "$REF^{commit}" >/dev/null || { echo "no branch $REF"; exit 2; }
ME="$(id -un)"
fail=0
report() { # <label> <text>
  local label="$1" text="$2" n
  n=$(grep -cE "/Users/$ME|$HOME" <<<"$text" || true)
  [ "$n" -gt 0 ] && { echo "FOUND: $label: $n line(s) with this Mac's home path or user name"; fail=1; }
  n=$(grep -oiE '[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}' <<<"$text" | grep -viE '^git@|@example\.com$' | sort -u | wc -l | tr -d ' ')
  [ "$n" -gt 0 ] && { echo "FOUND: $label: $n e-mail address(es)"; fail=1; }
  # The pattern is split ("co-author"+"ed-by") so this file never matches itself.
  n=$(grep -ciE "co-author""ed-by|generated with \[?claude" <<<"$text" || true)
  [ "$n" -gt 0 ] && { echo "FOUND: $label: $n attribution line(s)"; fail=1; }
  n=$(grep -oE '\b([0-9]{1,3}\.){3}[0-9]{1,3}\b' <<<"$text" | grep -vE '^(127\.|0\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|255\.)' \
    | grep -vE '^(192\.0\.2\.|198\.51\.100\.|203\.0\.113\.)|^1\.2\.3\.4$' | sort -u | wc -l | tr -d ' ')
  # SVG path data is runs of dotted numbers, never addresses.
  [[ "$label" == *.svg ]] && n=0
  [ "$n" -gt 0 ] && { echo "FOUND: $label: $n public IPv4 address(es)"; fail=1; }
  return 0
}
while IFS= read -r f; do
  text="$(git show "$REF:$f")"
  grep -qI . <<<"$text" || continue   # binary or empty
  report "$f" "$text"
done < <(git ls-tree -r --name-only "$REF")
report "git history of $REF" "$(git log "$REF" -p --no-color -- . ':(exclude)*.svg')"
report "git history of $REF *.svg" "$(git log "$REF" -p --no-color -- '*.svg')"
report "commit authors" "$(git log "$REF" --format='%an <%ae> %cn <%ce>')"
[ $fail -eq 0 ] && echo "publish check: PASS ($REF: every file + its whole history)"
exit $fail
