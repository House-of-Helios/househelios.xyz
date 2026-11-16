#!/bin/bash
# Put the site on GitHub (House-of-Helios/househelios.xyz), and only what is ours to share. Bookkeeper's protocol.
#
# The full history stays on this Mac. GitHub gets its own line of history on the local branch
# `public`: each run adds one commit holding this commit's files minus the private paths below,
# and pushes `public` to GitHub's `main`. Nothing from the private history, and nothing under a
# private path, ever enters `public`: it is built from a filtered tree, never from a merge.
#
# Usage:  tools/publish.sh ["what changed"]
set -euo pipefail
cd "$(dirname "$0")/.."

REPO="House-of-Helios/househelios.xyz"
# Working notes, retired code, the raw art (site/ holds the published copies), the agent's instructions.
PRIVATE=(_Plans _Research _Workflows _Archive _Past _Assets _Screenshots CLAUDE.md)

[ -z "$(git status --porcelain)" ] || { echo "❌ uncommitted changes — commit first"; exit 1; }
git remote get-url origin >/dev/null 2>&1 || git remote add origin "https://github.com/$REPO.git"

INDEX=$(mktemp); trap 'rm -f "$INDEX"' EXIT
export GIT_INDEX_FILE="$INDEX"
git read-tree HEAD
for p in "${PRIVATE[@]}"; do git rm -r -q --cached --ignore-unmatch -- "$p"; done
TREE=$(git write-tree)
unset GIT_INDEX_FILE

PARENT=$(git rev-parse -q --verify refs/heads/public || true)
if [ -n "$PARENT" ] && [ "$(git rev-parse "$PARENT^{tree}")" = "$TREE" ]; then
  echo "🐙 nothing new for GitHub"
else
  MSG="${1:-$(git log -1 --format=%s)}"
  COMMIT=$(git commit-tree "$TREE" ${PARENT:+-p "$PARENT"} -m "$MSG")
  git update-ref refs/heads/public "$COMMIT"
  echo "🐙 public ← $(git rev-parse --short "$COMMIT") ($MSG)"
fi

# The guard that matters most: no private path in what is about to leave.
for p in "${PRIVATE[@]}"; do
  if git ls-tree -r --name-only public | grep -q -e "^$p\$" -e "^$p/"; then echo "❌ $p is in public"; exit 1; fi
done
tools/check-publish.sh public || { echo "❌ privacy check failed — nothing pushed"; exit 1; }

git push -q origin public:main
echo "✅ https://github.com/$REPO"
