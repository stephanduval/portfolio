#!/usr/bin/env bash
set -euo pipefail

REMOTE_USER="stephandouglasduval-portfolio"
REMOTE_HOST="23.180.104.108"
REMOTE_PATH="/home/stephandouglasduval-portfolio/htdocs/portfolio.stephandouglasduval.com/"
SSH_KEY="$HOME/.ssh/stormweb_sduval"

EXCLUDES=(
  "--exclude=.git/"
  "--exclude=.gitignore"
  "--exclude=README.md"
  "--exclude=deploy.sh"
  "--exclude=SETUP.md"
  "--exclude=CLAUDE.md"
  "--exclude=.DS_Store"
  "--exclude=node_modules/"
  "--exclude=.vscode/"
  "--exclude=.idea/"
  "--exclude=.well-known/"
  "--exclude=storage/"
  "--exclude=.env"
)

echo "🚀 Deploying to portfolio.stephandouglasduval.com"
echo "Server: $REMOTE_HOST"
echo "Path: $REMOTE_PATH"
echo ""

rsync -avz --delete -e "ssh -i $SSH_KEY" "${EXCLUDES[@]}" ./ "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH"

echo ""
echo "✅ Deployment complete!"
echo "Visit: https://portfolio.stephandouglasduval.com"
