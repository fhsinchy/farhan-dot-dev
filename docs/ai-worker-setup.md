# 🚀 AI Worker Setup Guide

Quick start guide to get the AI Nugget Generator Worker up and running.

## Prerequisites

- Cloudflare account (free tier works)
- OpenAI API key
- GitHub Personal Access Token
- Node.js 18+ and npm

## Step-by-Step Setup

### 1. Install Wrangler

```bash
npm install -g wrangler

# Login to Cloudflare
wrangler login
```

### 2. Create KV Namespace

```bash
# From project root
wrangler kv:namespace create "NUGGET_STORE"
```

You'll get output like:
```
🌀 Creating namespace with title "ai-nugget-generator-NUGGET_STORE"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "NUGGET_STORE", id = "abc123xyz" }
```

### 3. Update Configuration

Edit `workers/ai-generator/wrangler.toml` and replace the KV namespace ID:

```toml
[[kv_namespaces]]
binding = "NUGGET_STORE"
id = "abc123xyz"  # ← Your actual ID here
```

### 4. Set Secrets

```bash
# OpenAI API Key
wrangler secret put OPENAI_API_KEY --config workers/ai-generator/wrangler.toml
# Paste your key when prompted

# GitHub Token (needs 'repo' scope)
wrangler secret put GITHUB_TOKEN --config workers/ai-generator/wrangler.toml
# Paste your token when prompted
```

**GitHub Token Setup:**
1. Go to https://github.com/settings/tokens
2. Generate new token (classic)
3. Select scope: `repo` (full control of private repositories)
4. Copy token and paste when running command above

### 5. Test Locally

```bash
# From project root
npm run worker:dev
```

Visit `http://localhost:8787/ai/health` - you should see:
```json
{
  "success": true,
  "message": "AI Worker is healthy"
}
```

### 6. Deploy to Production

```bash
npm run worker:deploy
```

You'll get a URL like:
```
https://ai-nugget-generator.YOUR_SUBDOMAIN.workers.dev
```

### 7. Test Generation

```bash
curl -X POST https://ai-nugget-generator.YOUR_SUBDOMAIN.workers.dev/ai/generate-nugget \
  -H "Content-Type: application/json" \
  -d '{
    "idea": {
      "title": "Test Nugget Generation",
      "topic": "Testing the AI pipeline",
      "tags": ["testing", "automation"]
    }
  }'
```

If successful, check your GitHub repo for a new PR!

## Verification Checklist

- [ ] Wrangler installed and logged in
- [ ] KV namespace created and ID updated in `wrangler.toml`
- [ ] OpenAI API key set as secret
- [ ] GitHub token set as secret (with `repo` scope)
- [ ] Worker deploys without errors
- [ ] Health endpoint returns 200 OK
- [ ] Test generation creates a PR in GitHub

## Troubleshooting

### "Error: No namespace with ID found"
→ Update the KV namespace ID in `wrangler.toml`

### "OpenAI API error: 401"
→ Check your OpenAI API key is valid and has credits

### "GitHub API error: 401"
→ Ensure GitHub token has `repo` scope and is not expired

### "Rate limit exceeded"
→ Wait an hour or increase `RATE_LIMIT_PER_HOUR` in `wrangler.toml`

## Next Steps

1. Read full documentation: `/docs/ai-pipeline.md`
2. Create idea seeds in `/ideas/`
3. Set up GitHub Actions for automated triggers (coming soon)
4. Monitor Worker logs: `npm run worker:tail`

## Cost Estimate

- Cloudflare Workers: Free tier (100k requests/day)
- KV Storage: Free tier (100k reads, 1k writes/day)
- OpenAI API: ~$0.01-0.03 per nugget (GPT-4 mini)
- GitHub API: Free

**Estimated cost:** < $5/month for 100 nuggets

---

**Ready to generate your first nugget?** 🚀
