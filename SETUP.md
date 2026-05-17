# SDPortfolio Setup Guide

Portfolio subdomain: **portfolio.stephandouglasduval.com**

## Project Structure

Based on 3DPrintQuote pattern for StormWeb CloudPanel deployment.

```
SDPortfolio/
├── index.html              # Main entry point
├── assets/                 # CSS, JS, images
│   ├── styles.css
│   ├── main.js
│   └── ...
├── lib/                    # Backend utilities (if needed)
│   ├── db.php             # Database functions
│   └── ...
├── api/                    # API endpoints (if needed)
│   └── projects.php
├── storage/               # User uploads, logs, data
├── .env.example           # Environment template
├── deploy.sh              # Deployment script
├── .gitignore
└── SETUP.md              # This file
```

## Deployment Configuration

### Server Details
- **Host:** StormWeb CloudPanel
- **IP:** 23.180.104.108
- **Remote User:** `stephandouglasduval-portfolio` (need to create/confirm on StormWeb)
- **Remote Path:** `/home/stephandouglasduval-portfolio/htdocs/portfolio.stephandouglasduval.com/`
- **SSH Key:** `~/.ssh/stormweb_sduval` (shared with 3DPrintQuote)

### Deploy Script Template
Create `deploy.sh` with:
```bash
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
  "--exclude=.DS_Store"
  "--exclude=node_modules/"
  "--exclude=.vscode/"
  "--exclude=.idea/"
  "--exclude=.well-known/"
  "--exclude=storage/"
  "--exclude=.env"
)

echo "Deploying to $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH"
rsync -avz --delete -e "ssh -i $SSH_KEY" "${EXCLUDES[@]}" ./ "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH"
echo "Done."
```

## Environment Variables

Create `.env` on the server (never commit to git). Template:

```env
# Admin authentication
ADMIN_PASSWORD=changeme

# Email delivery (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM=noreply@portfolio.stephandouglasduval.com
RESEND_FROM_NAME=SD Portfolio

# Contact/admin email
ADMIN_EMAIL=stephan@stephandouglasduval.com

# Public base URL (for links in emails/redirects)
APP_URL=https://portfolio.stephandouglasduval.com

# Cloudflare Turnstile (optional)
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET=
```

**Setup steps:**
1. SSH into StormWeb server
2. `cd /home/stephandouglasduval-portfolio/htdocs/portfolio.stephandouglasduval.com/`
3. `cp .env.example .env`
4. Edit `.env` with real credentials
5. Generate admin password: `openssl rand -hex 32`

## Database Setup (if needed)

If using a database, create `lib/schema.sql` with your schema and run on first deployment.

3DPrintQuote uses SQLite:
```php
// lib/db.php pattern
$db = new PDO('sqlite:' . __DIR__ . '/../storage/data.sqlite');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
```

## Deployment Workflow

From local machine:
```bash
cd /home/sduval/Code/SDPortfolio
./deploy.sh
```

This syncs all files except `.env`, `storage/`, `node_modules/`, and git history.

## StormWeb Admin Panel Tasks

Before first deployment, you may need to:

1. **Create new cPanel account** for `stephandouglasduval-portfolio`
2. **Addon domain** pointing to `portfolio.stephandouglasduval.com`
3. **SSL certificate** (auto via AutoSSL)
4. **SSH key** — ensure `~/.ssh/stormweb_sduval` has access
5. **Email routing** — if using Resend for outbound mail

## Local Development

For testing locally before deploy:
```bash
# Start a local PHP server (if using PHP)
php -S localhost:8000

# Or use your preferred local dev setup
```

## Important Notes

- `.env` is gitignored and stays on the server only
- `storage/` directory may contain uploads/logs — sync excludes it (populate manually)
- Hard refresh (`Ctrl+Shift+R`) in browser after CSS/JS changes to clear cache
- Deployment is via rsync — fast, incremental, only changed files transfer
- `--delete` flag syncs deletions too, so be careful with local deletions

## Reference Files

- **3DPrintQuote deploy script:** `/home/sduval/Code/3DPrintQuote/deploy.sh`
- **3DPrintQuote schema:** `/home/sduval/Code/3DPrintQuote/lib/schema.sql`
- **3DPrintQuote .env example:** `/home/sduval/Code/3DPrintQuote/.env.example`

## Next Steps

1. Create initial `index.html`
2. Set up `assets/styles.css` and `assets/main.js`
3. Create `.env.example`
4. Create `deploy.sh` (use template above)
5. Initialize git repository
6. Contact StormWeb to set up cPanel account for portfolio subdomain
7. Deploy with `./deploy.sh`
