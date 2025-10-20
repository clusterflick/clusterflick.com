REPO_URL='https://api.github.com/repos/clusterflick/data-combined/releases/latest'

COMBINED_LIST=$(curl -sS -L -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28" $REPO_URL)

for f in $(echo "$COMBINED_LIST" | grep browser_download | cut -d\" -f4);
do
    echo "Getting $f ..."
    wget "$f" --quiet -P ./combined-data/
done

REPO_URL='https://api.github.com/repos/clusterflick/data-matched/releases/latest'

MATCHED_LIST=$(curl -sS -L -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28" $REPO_URL)

for f in $(echo "$MATCHED_LIST" | grep browser_download | cut -d\" -f4);
do
    echo "Getting $f ..."
    wget "$f" --quiet -P ./matched-data/
done

npm run process-combined-data
