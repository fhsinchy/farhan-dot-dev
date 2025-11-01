# AI Nugget Generator Worker

Cloudflare Worker that automatically generates technical "nuggets" using OpenAI and creates GitHub PRs on a schedule.

## Quick Start

```bash
# Install dependencies (from project root)
npm install

# Create KV namespaces
wrangler kv:namespace create "NUGGET_STORE"
wrangler kv:namespace create "IDEA_QUEUE"
# Update wrangler.toml with the IDEA_QUEUE namespace ID

# Set secrets
wrangler secret put OPENAI_API_KEY --config workers/ai-generator/wrangler.toml
wrangler secret put GITHUB_TOKEN --config workers/ai-generator/wrangler.toml

# Test locally
npm run worker:dev

# Deploy
npm run worker:deploy
```

## Loading Ideas into Queue

Ideas are loaded directly into KV using wrangler CLI (no public API needed):

```bash
# Load a single idea
cd workers/ai-generator
npm run load-idea -- ../../ideas/example-idempotency-keys.json

# Load all ideas from ideas/ directory
npm run load-ideas

# Or manually using wrangler
wrangler kv:key put "idea:my-slug" '{"title":"...","status":"pending",...}' \
  --binding IDEA_QUEUE --namespace-id YOUR_NAMESPACE_ID
```

The cron scheduler will automatically process ideas from the queue (Mon/Wed/Fri at 09:00 UTC).

## Environment Setup

### Required Secrets

- `OPENAI_API_KEY` - OpenAI API key with GPT-4 access
- `GITHUB_TOKEN` - GitHub Personal Access Token with `repo` scope

### Required KV Namespaces

- `NUGGET_STORE` - For rate limiting and generation tracking
- `IDEA_QUEUE` - For storing ideas that will be processed by the cron scheduler

### Environment Variables (in wrangler.toml)

- `GITHUB_REPO` - Repository in format `owner/repo`
- `GITHUB_BRANCH_PREFIX` - Prefix for PR branches (e.g., `nuggets`)
- `RATE_LIMIT_PER_HOUR` - Max requests per hour per IP

## API Endpoints

### `GET /ai/health`

Health check endpoint (public).

**Response:**
```json
{
  "success": true,
  "message": "AI Worker is healthy"
}
```

### Cron Scheduler

The Worker runs automatically via cron trigger (Mon/Wed/Fri 09:00 UTC) to:
1. Pick the next pending idea from `IDEA_QUEUE`
2. Generate the nugget using OpenAI
3. Create a GitHub PR
4. Mark idea as `awaiting-review`

**Note:** There is no public API for generating nuggets. All ideas must be loaded into KV first, then processed by the scheduler.

## Development

```bash
# Watch mode with live reload
npm run worker:dev

# View logs
npm run worker:tail

# Type check
cd workers/ai-generator && npx tsc --noEmit
```

## Architecture

```
Idea JSON → wrangler CLI → KV (IDEA_QUEUE) → Cron Scheduler → OpenAI API → Generate Content
                                                              → GitHub API → Create PR
                                                              → KV Store → Log & Track
```

**Workflow:**
1. Create idea JSON file in `ideas/` directory
2. Load idea into KV queue using wrangler CLI
3. Cron scheduler picks up pending ideas automatically
4. Worker generates nugget and creates PR
5. You review and merge PR

## File Structure

```
workers/ai-generator/
├── src/
│   ├── index.ts      # Main Worker entry point
│   ├── types.ts      # TypeScript definitions
│   ├── utils.ts      # Helper functions
│   ├── openai.ts     # OpenAI integration
│   └── github.ts     # GitHub API client
├── wrangler.toml     # Worker configuration
└── README.md         # This file
```

## Testing

```bash
# Test health endpoint
curl http://localhost:8787/ai/health

# Test idea loading (local dev)
cd workers/ai-generator
./scripts/load-idea.sh ../../ideas/example-idempotency-keys.json

# View logs
wrangler tail
```

## Troubleshooting

See [AI Pipeline Documentation](../../docs/ai-pipeline.md#troubleshooting)

## License

MIT
