# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SDPortfolio** is a static portfolio website hosted at `portfolio.stephandouglasduval.com` on StormWeb CloudPanel. The site consists of HTML, CSS, and JavaScript assets deployed via rsync.

- **Architecture:** Static site (HTML/CSS/JS) with optional PHP backend for dynamic features
- **Server:** StormWeb CloudPanel (23.180.104.108)
- **Remote Path:** `/home/stephandouglasduval-portfolio/htdocs/portfolio.stephandouglasduval.com/`
- **SSH User:** `stephandouglasduval-portfolio`
- **SSH Key:** `~/.ssh/stormweb_sduval`

## Project Structure

```
SDPortfolio/
├── index.html              # Main entry point
├── assets/                 # CSS, JS, images
│   ├── styles.css
│   └── main.js
├── lib/                    # Backend utilities (optional, for PHP features)
├── api/                    # API endpoints (optional, for PHP features)
├── storage/                # User uploads, logs (excluded from deploy)
├── .env.example            # Environment template
├── deploy.sh               # Deployment script
└── SETUP.md               # Setup documentation
```

## Deployment & Configuration

### Deploy Script

The `deploy.sh` script in this directory handles rsync deployment to StormWeb. It excludes `.env`, `storage/`, `node_modules/`, and git history.

```bash
./deploy.sh
```

**Reference deploy scripts** are in `/home/sduval/Code/Wrioter/`:
- `deploy-stormweb-fixed.sh` — Complex Laravel/PHP deployment (reference for patterns)
- `setup-ssh-stormweb.sh` — SSH key setup (reference)

### Environment Variables

Create `.env` on the server only (never commit to git). See `SETUP.md` for the `.env.example` template.

**Key variables:**
- `ADMIN_PASSWORD` — Admin authentication
- `RESEND_API_KEY` — Email delivery via Resend
- `ADMIN_EMAIL` — Contact/admin email
- `APP_URL` — Public base URL (https://portfolio.stephandouglasduval.com)

## Local Development

For testing locally:
```bash
# Simple HTTP server (no PHP needed for static files)
python3 -m http.server 8000

# Or with PHP (if using PHP features)
php -S localhost:8000
```

Visit `http://localhost:8000` in your browser.

## Browser Cache & CSS/JS Changes

After modifying CSS or JS:
1. Clear browser cache: **Ctrl+Shift+R** (hard refresh) or **Cmd+Shift+R** on macOS
2. Deploy: `./deploy.sh`

## Important Notes

- **`.env` stays on server only** — Never sync to git
- **`storage/` excluded from deploy** — Manually manage uploads/logs on server if needed
- **rsync `--delete` flag** — Deleted files are removed remotely; be careful with local deletions
- **No build step** — Static assets are served as-is (unlike Wrioter's yarn build)

## Database (if needed)

If adding database features, follow the SQLite pattern from SETUP.md:
```php
// lib/db.php
$db = new PDO('sqlite:' . __DIR__ . '/../storage/data.sqlite');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
```

Create `lib/schema.sql` with your schema and run on first deployment.

## Before First Deployment

Contact StormWeb admin panel to:
1. Create cPanel account for `stephandouglasduval-portfolio`
2. Add addon domain pointing to `portfolio.stephandouglasduval.com`
3. Enable SSL certificate (auto via AutoSSL)
4. Ensure SSH key `~/.ssh/stormweb_sduval` has access
