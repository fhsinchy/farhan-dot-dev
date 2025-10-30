# 🚀 Quick Start: Automated Nugget Generation

**You've successfully set up the AI pipeline!** Here's how to use it:

## The Simplest Workflow

### 1. Create an Idea

Create a YAML file in `/ideas/`:

```yaml
# ideas/my-awesome-topic.yml
title: "Your Nugget Title Here"
topic: "Brief description of what this nugget covers"
tags:
  - tag1
  - tag2
  - tag3
context: "Optional: Additional context to help the AI understand the topic"
codeExample: true  # or false
```

### 2. Commit and Push

```bash
git add ideas/my-awesome-topic.yml
git commit -m "feat: add idea for [topic]"
git push
```

### 3. Wait for the Magic ✨

- GitHub Action runs automatically
- Worker generates the nugget
- PR appears in your repository (usually within 30 seconds)

### 4. Review and Merge

- Open the PR in GitHub
- Review the generated content
- Edit if needed (directly in GitHub UI)
- Merge when satisfied

### 5. Auto-Deploy

- Cloudflare Pages detects the merge
- Site rebuilds automatically
- Your new nugget is live!

---

## Authentication Setup (One-time)

If you haven't already, you need to:

1. **Generate and set Worker API key:**
   ```bash
   # Generate random key
   openssl rand -hex 32
   
   # Set as Worker secret
   wrangler secret put WORKER_API_KEY --config workers/ai-generator/wrangler.toml
   
   # Redeploy
   npm run worker:deploy
   ```

2. **Add GitHub Secrets:**
   - Go to: **Repository Settings → Secrets → Actions**
   - Add `WORKER_URL` (your Worker URL)
   - Add `WORKER_API_KEY` (same key from step 1)

See [GitHub Action Setup Guide](./github-action-setup.md) for detailed instructions.

---

## Example Ideas

Check `/ideas/` directory for examples:
- `example-idempotency-keys.yml`
- `example-vector-search-rag.yml`

---

## Manual Testing (Optional)

Want to test without committing?

```bash
curl -X POST https://your-worker.workers.dev/ai/generate-nugget \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_WORKER_API_KEY" \
  -d '{
    "idea": {
      "title": "Test Nugget",
      "topic": "Testing the pipeline",
      "tags": ["testing"]
    }
  }'
```

---

## Troubleshooting

### No PR created after push
- Check **Actions** tab for workflow status
- Look for error messages in workflow logs
- Verify file is in `/ideas/` with `.yml` extension

### "401 Unauthorized"
- Check GitHub secrets are set correctly
- Verify Worker was redeployed after setting API key

### Need Help?
- [Full Documentation](./ai-pipeline.md)
- [GitHub Action Setup](./github-action-setup.md)
- [Worker Setup](./ai-worker-setup.md)

---

**That's it!** You now have a fully automated content creation pipeline. 🎉

Just add YAML files, commit, and watch your content library grow!
