# GitHub Action Setup Guide

This guide explains how to configure the automated nugget generation workflow.

## Overview

The GitHub Action automatically triggers when you:
1. Add or modify YAML files in `/ideas/`
2. Manually dispatch the workflow from GitHub Actions tab

## Setup Steps

### 1. Set Worker API Key Secret

First, generate a secure API key and set it as a Worker secret:

```bash
# Generate a random API key (or use your own)
# On Linux/Mac:
API_KEY=$(openssl rand -hex 32)

# On Windows (PowerShell):
# $API_KEY = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})

# Set it as a Worker secret
wrangler secret put WORKER_API_KEY --config workers/ai-generator/wrangler.toml
# Paste the API key when prompted
```

**Important:** Save this API key - you'll need it for GitHub Secrets in step 3.

### 2. Redeploy Worker

After adding the secret, redeploy the Worker:

```bash
npm run worker:deploy
```

The Worker now requires authentication!

### 3. Configure GitHub Secrets

Go to your repository settings and add these secrets:

**GitHub Repository → Settings → Secrets and variables → Actions**

Add two items:

#### Variable: `WORKER_URL`
- Go to the **Variables** tab
- Click **New repository variable**
- **Name:** `WORKER_URL`
- **Value:** Your Worker URL (e.g., `https://ai-nugget-generator.your-subdomain.workers.dev`)
- **Important:** No trailing slash, no path (don't include `/ai/generate-nugget`)

#### Secret: `WORKER_API_KEY`
- Go to the **Secrets** tab
- Click **New repository secret**
- **Name:** `WORKER_API_KEY`
- **Value:** The API key you generated in step 1

### 4. Verify Workflow File

The workflow file should already exist at `.github/workflows/generate-nuggets.yml`.

If not, ensure it's committed to your repository.

### 5. Test the Workflow

**Option A: Automatic Trigger**

1. Create a new idea file:
   ```bash
   # Create ideas/test-github-action.json
   cat > ideas/test-github-action.json << 'EOF'
   {
     "title": "Testing GitHub Actions Integration",
     "topic": "Verifying automated nugget generation workflow",
     "tags": ["automation", "testing"],
     "codeExample": false
   }
   EOF
   ```

2. Commit and push:
   ```bash
   git add ideas/test-github-action.json
   git commit -m "test: add idea to trigger GitHub Action"
   git push
   ```

3. Check GitHub Actions tab - workflow should start automatically

**Option B: Manual Trigger**

1. Go to **Actions** tab in GitHub
2. Select **Generate Nuggets** workflow
3. Click **Run workflow**
4. (Optional) Specify a file path like `ideas/test-github-action.json`
5. Click **Run workflow** button

### 6. Verify Results

After the workflow runs:

1. Check the **Actions** tab for workflow status
2. Look for a new PR in your repository
3. The PR should contain the generated nugget MDX file

## Workflow Features

### Automatic Detection
- Triggers on any `.json` file added/modified in `/ideas/`
- Ignores `TEMPLATE.json`
- Processes multiple files if multiple ideas are committed at once

### Manual Dispatch
- Run workflow manually from Actions tab
- Optionally specify which idea file to process

### Security
- Worker endpoint secured with Bearer token authentication
- API key stored as GitHub secret
- No public access to generation endpoint

### Error Handling
- Workflow fails if Worker returns error
- Detailed logs in Actions tab
- Response codes and bodies printed for debugging

## Troubleshooting

### Workflow doesn't trigger
- Check that file is in `/ideas/` directory
- Ensure file has `.json` extension
- Verify file is not named `TEMPLATE.json`
- Verify you pushed to the correct branch (`main` or `master`)

### "401 Unauthorized" error
- Verify `WORKER_API_KEY` secret matches the Worker secret
- Check `WORKER_URL` is correct (no trailing slash)
- Ensure Worker was redeployed after setting `WORKER_API_KEY`

### "Failed to parse JSON"
- Check JSON syntax is valid
- Ensure required fields are present: `title`, `topic`, `tags`
- Use a JSON validator or `jq` to test the file

### Workflow succeeds but no PR created
- Check Worker logs: `npm run worker:tail`
- Verify GitHub token has `repo` scope
- Check repository name in `wrangler.toml` is correct

## Customization

### Change Trigger Branch

Edit `.github/workflows/generate-nuggets.yml`:

```yaml
on:
  push:
    paths:
      - 'ideas/**.yml'
    branches:
      - main  # Change to your preferred branch
```

### Add Scheduled Generation

Add a cron schedule to the workflow:

```yaml
on:
  schedule:
    - cron: '0 9 * * 0'  # Every Sunday at 9 AM UTC
  push:
    paths:
      - 'ideas/**.yml'
```

### Batch Processing

The workflow already supports processing multiple idea files in a single commit.

## Workflow Output

The Action provides a summary showing:
- Files processed
- PR URLs created
- Success/failure status

Check the **Summary** tab in the workflow run for details.

## Next Steps

1. Add your first real idea to `/ideas/`
2. Commit and watch the magic happen ✨
3. Review the auto-generated PR
4. Merge when satisfied
5. Repeat!

---

**You now have fully automated content generation!** 🚀
