#!/usr/bin/env bash
# wait_for_auth_and_push.sh
DEVICE_CODE="$1"
REPO_NAME="${2:-gomala-atlas}"

if [ -z "$DEVICE_CODE" ]; then
  echo "Usage: ./wait_for_auth_and_push.sh <device_code> [repo_name]"
  exit 1
fi

CLIENT_ID="178c6fc778ccc68e1d6a"
echo "Waiting for authorization on GitHub..."

while true; do
  RES=$(curl -s -X POST -H "Accept: application/json" \
    -d "client_id=${CLIENT_ID}&device_code=${DEVICE_CODE}&grant_type=urn:ietf:params:oauth:grant-type:device_code" \
    https://github.com/login/oauth/access_token)

  TOKEN=$(echo "$RES" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
  ERROR=$(echo "$RES" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)

  if [ -n "$TOKEN" ]; then
    echo "Authorization successful!"
    
    # Get authenticated username
    USER_JSON=$(curl -s -H "Authorization: token ${TOKEN}" https://api.github.com/user)
    GH_USER=$(echo "$USER_JSON" | grep -o '"login": "[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -z "$GH_USER" ]; then
      GH_USER=$(echo "$USER_JSON" | grep -o '"login":"[^"]*"' | head -1 | cut -d'"' -f4)
    fi
    
    echo "Authenticated as GitHub user: ${GH_USER}"
    
    # Create public repository if it does not exist
    echo "Creating public repository '${REPO_NAME}' on GitHub..."
    CREATE_RES=$(curl -s -X POST -H "Authorization: token ${TOKEN}" \
      -H "Accept: application/vnd.github.v3+json" \
      -d "{\"name\":\"${REPO_NAME}\",\"description\":\"A triage and documentation platform for village pasture land records in Karnataka\",\"private\":false}" \
      https://api.github.com/user/repos)
    
    # Configure git remote
    REMOTE_URL="https://${GH_USER}:${TOKEN}@github.com/${GH_USER}/${REPO_NAME}.git"
    git remote remove origin 2>/dev/null || true
    git remote add origin "${REMOTE_URL}"
    
    # Push to main
    echo "Pushing branch 'main' to GitHub..."
    git push -u origin main
    
    echo "SUCCESS: Pushed to https://github.com/${GH_USER}/${REPO_NAME}"
    exit 0
  fi

  if [ "$ERROR" = "authorization_pending" ]; then
    sleep 5
  elif [ "$ERROR" = "slow_down" ]; then
    sleep 10
  else
    echo "Authorization error: $ERROR"
    echo "$RES"
    exit 1
  fi
done
