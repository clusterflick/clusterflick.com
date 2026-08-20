#!/bin/bash

# Unauthenticated API calls share a per-IP rate limit that CI runners and
# repeated local runs exhaust quickly, so send a token whenever one is available
GH_API_TOKEN="${PAT:-${GH_TOKEN:-${GITHUB_TOKEN:-}}}"
if [ -z "$GH_API_TOKEN" ] && command -v gh &> /dev/null; then
    GH_API_TOKEN=$(gh auth token 2>/dev/null || true)
fi
CURL_HEADERS=(-sS -L -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28")
if [ -n "$GH_API_TOKEN" ]; then
    CURL_HEADERS+=(-H "Authorization: token $GH_API_TOKEN")
fi

REPO_URL='https://api.github.com/repos/clusterflick/data-combined/releases/latest'

COMBINED_LIST=$(curl "${CURL_HEADERS[@]}" "$REPO_URL")

rm -rf ./combined-data/
rm -rf ./matched-data/

for f in $(echo "$COMBINED_LIST" | grep browser_download | cut -d\" -f4);
do
    echo "Getting $f ..."
    wget "$f" --quiet -P ./combined-data/
done

REPO_URL='https://api.github.com/repos/clusterflick/data-matched/releases/latest'

MATCHED_LIST=$(curl "${CURL_HEADERS[@]}" "$REPO_URL")

for f in $(echo "$MATCHED_LIST" | grep browser_download | cut -d\" -f4);
do
    echo "Getting $f ..."
    wget "$f" --quiet -P ./matched-data/
done

npm run fetch-diffed-data
npm run fetch-calendar-data

rm -rf ./public/data
npm run process-combined-data
