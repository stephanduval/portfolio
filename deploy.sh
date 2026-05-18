#!/usr/bin/env bash
set -uo pipefail

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

echo "🚀 Building resume..."
if command -v pdflatex &> /dev/null; then
    cd assets/Resume
    pdflatex -interaction=nonstopmode -output-directory=. "20230501 Stephan DuVal Resume.tex" > /dev/null 2>&1 || true
    pdflatex -interaction=nonstopmode -output-directory=. "20230501 Stephan DuVal Resume.tex" > /dev/null 2>&1 || true
    cd ../..
    if [ -f "assets/Resume/20230501 Stephan DuVal Resume.pdf" ]; then
        mv "assets/Resume/20230501 Stephan DuVal Resume.pdf" "assets/resume.pdf"
        echo "✅ Resume compiled to PDF"
    else
        echo "⚠️  Resume PDF not generated"
    fi
else
    echo "⚠️  pdflatex not found, skipping resume build"
fi

echo ""
echo "🚀 Deploying to portfolio.stephandouglasduval.com"
echo "Server: $REMOTE_HOST"
echo "Path: $REMOTE_PATH"
echo ""

rsync -avz --delete -e "ssh -i $SSH_KEY" "${EXCLUDES[@]}" ./ "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH"

echo ""
echo "✅ Deployment complete!"
echo "Visit: https://portfolio.stephandouglasduval.com"
