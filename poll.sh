#!/usr/bin/env bash
# Reproduce DIFF-48: move the base branch ahead, rebase the head branch onto it, force push,
# then poll GitHub's view of the PR's commit list, base oid and updatedAt for ~90 seconds.
set -euo pipefail
cd /tmp/diff48-repro
REPO=Maciek-s-Test-Org/test
PR=62

git checkout -q diff48-base
for i in 1 2 3 4 5 6 7 8; do
  echo "base change $i" > "diff48-base-$i.txt"
  git add . && git commit -q -m "diff48: base commit $i"
done
git push -q origin diff48-base
echo "base pushed at $(date -u +%H:%M:%S.%N | cut -c1-12), base tip $(git rev-parse --short HEAD)"
sleep 8
echo "pre-rebase PR state: $(gh api graphql -f query='{ repository(owner:"Maciek-s-Test-Org", name:"test") { pullRequest(number:'"$PR"') { baseRefOid headRefOid updatedAt commits(first:50){ totalCount } } } }' --jq '.data.repository.pullRequest | "base=\(.baseRefOid[0:7]) head=\(.headRefOid[0:7]) commits=\(.commits.totalCount) updatedAt=\(.updatedAt)"')"

git checkout -q diff48-head
git rebase -q diff48-base
NEW_HEAD=$(git rev-parse --short HEAD)
git push -q --force-with-lease origin diff48-head
T0=$(date +%s.%N)
echo "force-pushed at $(date -u +%H:%M:%S.%N | cut -c1-12), new head $NEW_HEAD (parent $(git rev-parse --short HEAD~1))"

for n in $(seq 1 120); do
  now=$(date +%s.%N)
  elapsed=$(printf "%5.1f" "$(echo "$now - $T0" | bc)")
  gql=$(gh api graphql -f query='{ repository(owner:"Maciek-s-Test-Org", name:"test") { pullRequest(number:'"$PR"') { baseRefOid headRefOid updatedAt commits(first:50){ totalCount nodes { commit { oid } } } } } }' --jq '.data.repository.pullRequest | "gql: base=\(.baseRefOid[0:7]) head=\(.headRefOid[0:7]) commits=\(.commits.totalCount) first=\(.commits.nodes[0].commit.oid[0:7]) updatedAt=\(.updatedAt)"' 2>&1 || echo "gql: error")
  rest=$(gh api "repos/$REPO/pulls/$PR" --jq '"rest: base=\(.base.sha[0:7]) head=\(.head.sha[0:7]) commits=\(.commits)"' 2>&1 || echo "rest: error")
  echo "t+${elapsed}s | $gql | $rest"
  if [ "$n" -gt 40 ]; then sleep 2; fi
done
