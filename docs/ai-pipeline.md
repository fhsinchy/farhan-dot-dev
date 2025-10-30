# 🤖 AI Pipeline Documentation

**farhan.dev AI-Assisted Nugget Generation System**

---

## Overview

The AI pipeline automates the creation of technical "nuggets" (150-300 word engineering insights) using a **Cloudflare Worker** that:
1. Accepts idea seeds (YAML files)
2. Generates content via OpenAI API
3. Creates GitHub PRs for review
4. Maintains quality through human oversight

**Architecture:** Cloudflare Worker → OpenAI API → GitHub API → Pull Request

---

## Setup Instructions

### 1. Create KV Namespace

```bash
# Create KV namespace for rate limiting and tracking
wrangler kv:namespace create "NUGGET_STORE"

# Note the ID returned and update wrangler.toml
```

Update `workers/ai-generator/wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "NUGGET_STORE"
id = "YOUR_KV_NAMESPACE_ID"  # Replace with actual ID
```

### 2. Set Secrets

```bash
# Set OpenAI API key
wrangler secret put OPENAI_API_KEY --config workers/ai-generator/wrangler.toml

# Set GitHub Personal Access Token (with repo scope)
wrangler secret put GITHUB_TOKEN --config workers/ai-generator/wrangler.toml
```

**GitHub Token Scopes Required:**
- `repo` (full control)
- `workflow` (if using GitHub Actions)

### 3. Deploy Worker

```bash
# Test locally first
npm run worker:dev

# Deploy to production
npm run worker:deploy
```

### 4. Test the Endpoint

```bash
# Health check
curl https://ai-nugget-generator.YOUR_SUBDOMAIN.workers.dev/ai/health

# Generate nugget
curl -X POST https://ai-nugget-generator.YOUR_SUBDOMAIN.workers.dev/ai/generate-nugget \
  -H "Content-Type: application/json" \
  -d '{
    "idea": {
      "title": "Why Idempotency Keys Matter in Payment APIs",
      "topic": "Building reliable payment systems",
      "tags": ["api-design", "reliability"],
      "codeExample": true
    }
  }'
```

---

## Workflow

### Step 1: Create Idea Seed

Add a YAML file to `/ideas/`:

```yaml
# ideas/redis-distributed-locks.yml
title: "Redis Distributed Locks Without Regrets"
topic: "Building reliable distributed locks with Redis and handling edge cases"
tags:
  - redis
  - distributed-systems
  - reliability
context: "Distributed locks are easy to implement but hard to get right. Common pitfalls include lock leaks, clock drift, and split-brain scenarios"
targetAudience: "Backend engineers working with distributed systems"
codeExample: true
```

### Step 2: Trigger Generation

**Option A: API Call**
```bash
curl -X POST https://your-worker.workers.dev/ai/generate-nugget \
  -H "Content-Type: application/json" \
  -d @ideas/redis-distributed-locks.yml
```

**Option B: GitHub Action** (coming soon)
- Commit YAML to `/ideas/`
- Action automatically triggers Worker
- PR created within seconds

### Step 3: Review PR

1. Worker creates PR with generated nugget
2. Review checklist appears in PR description
3. Check technical accuracy, tone, and formatting
4. Edit directly in GitHub UI if needed
5. Merge when satisfied

### Step 4: Auto-Deployment

- Cloudflare Pages detects merge to `main`
- Site rebuilds automatically
- New nugget goes live at `farhan.dev/nuggets/[slug]`

---

## API Reference

### `POST /ai/generate-nugget`

Generate a new nugget and create a PR.

**Request Body:**
```json
{
  "idea": {
    "title": "String (required)",
    "topic": "String (required)",
    "tags": ["string", "array", "required"],
    "context": "String (optional)",
    "targetAudience": "String (optional)",
    "codeExample": true/false
  },
  "mode": "draft" // or "final" (future feature)
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Nugget generated and PR created successfully",
  "data": {
    "nugget": {
      "slug": "redis-distributed-locks-without-regrets",
      "frontmatter": {
        "title": "...",
        "description": "...",
        "pubDate": "2025-10-30T12:34:56.789Z",
        "tags": ["redis", "distributed-systems"],
        "draft": true
      },
      "content": "Preview..."
    },
    "pr": {
      "prUrl": "https://github.com/fhsinchy/farhan-dot-dev/pull/123",
      "prNumber": 123,
      "branchName": "nuggets/redis-distributed-locks-1234567890"
    }
  }
}
```

**Rate Limits:**
- 10 requests per hour per IP
- Tracked via KV storage
- Returns `429 Too Many Requests` when exceeded

---

## System Prompt

The Worker uses this system prompt for consistent output:

```
You are an expert technical writer specializing in backend and AI engineering.
Generate concise, high-signal engineering insights called "nuggets" for an experienced engineering audience.

Requirements:
- 150-300 words total
- Voice: Direct, confident, peer-to-peer (senior IC talking to other senior ICs)
- Structure:
  1. Context (1 sentence setup)
  2. Insight (3-5 bullets or short paragraphs)
  3. Optional code example (≤20 LOC, illustrative)
  4. "Apply It" section (1-2 actionable bullets)
- No fluff, no vendor pitches, no invented metrics
- Grounded in real engineering experience
```

---

## Quality Gates

### Automated Checks (in Worker)
- ✅ Idea seed validation (required fields)
- ✅ Rate limiting (10/hour)
- ✅ Frontmatter schema validation
- ✅ Word count target (150-300)

### Human Review (in PR)
- Technical accuracy
- Tone consistency
- No vendor claims or invented stats
- Code examples are illustrative and concise
- Tags are appropriate

---

## Monitoring

### View Logs
```bash
npm run worker:tail
```

### Check Generation History
Query KV namespace for recent generations:
```bash
wrangler kv:key list --namespace-id=YOUR_KV_ID --prefix="generation:"
```

### Metrics to Track
- Generation success rate
- Average PR review time
- Nugget publish cadence (target: 3/week)

---

## Troubleshooting

### Worker Returns 500
- Check OpenAI API key is set correctly
- Verify GitHub token has `repo` scope
- Check Worker logs: `npm run worker:tail`

### PR Creation Fails
- Ensure GitHub token is valid
- Check base branch exists (`main`)
- Verify repo name in `wrangler.toml` is correct

### Rate Limit Issues
- Increase `RATE_LIMIT_PER_HOUR` in `wrangler.toml`
- Use authentication headers for higher limits (future feature)

---

## Future Enhancements

- [ ] GitHub Action trigger on YAML commit
- [ ] Critic pass for automated quality review
- [ ] Batch generation (multiple nuggets per PR)
- [ ] LinkedIn/Newsletter auto-posting
- [ ] Analytics dashboard for generation stats
- [ ] A/B testing different system prompts

---

## Security Notes

- All secrets stored in Wrangler's encrypted secret storage
- Rate limiting prevents abuse
- CORS restricted to trusted origins in production
- KV data auto-expires (30-day TTL)

---

**Questions?** Open an issue or check Worker logs.
