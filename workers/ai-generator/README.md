# AI Nugget Generator Worker

Cloudflare Worker that generates technical "nuggets" using OpenAI and creates GitHub PRs for review.

## Quick Start

```bash
# Install dependencies (from project root)
npm install

# Create KV namespace
wrangler kv:namespace create "NUGGET_STORE"

# Set secrets
wrangler secret put OPENAI_API_KEY --config workers/ai-generator/wrangler.toml
wrangler secret put GITHUB_TOKEN --config workers/ai-generator/wrangler.toml

# Test locally
npm run worker:dev

# Deploy
npm run worker:deploy
```

## Environment Setup

### Required Secrets

- `OPENAI_API_KEY` - OpenAI API key with GPT-4 access
- `GITHUB_TOKEN` - GitHub Personal Access Token with `repo` scope

### Required KV Namespace

- `NUGGET_STORE` - For rate limiting and generation tracking

### Environment Variables (in wrangler.toml)

- `GITHUB_REPO` - Repository in format `owner/repo`
- `GITHUB_BRANCH_PREFIX` - Prefix for PR branches (e.g., `nuggets`)
- `RATE_LIMIT_PER_HOUR` - Max requests per hour per IP

## API Endpoints

### `GET /ai/health`

Health check endpoint.

**Response:**
```json
{
  "success": true,
  "message": "AI Worker is healthy"
}
```

### `POST /ai/generate-nugget`

Generate a nugget and create a PR.

**Request:**
```json
{
  "idea": {
    "title": "Your Nugget Title",
    "topic": "Technical topic to cover",
    "tags": ["tag1", "tag2"],
    "context": "Optional context",
    "codeExample": true
  }
}
```

**Response:** See [AI Pipeline Documentation](../../docs/ai-pipeline.md)

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
Request → Worker → OpenAI API → Generate Content
                 → GitHub API → Create PR
                 → KV Store → Log & Rate Limit
```

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
# Test generation
curl -X POST http://localhost:8787/ai/generate-nugget \
  -H "Content-Type: application/json" \
  -d '{
    "idea": {
      "title": "Test Nugget",
      "topic": "Testing",
      "tags": ["testing"]
    }
  }'
```

## Troubleshooting

See [AI Pipeline Documentation](../../docs/ai-pipeline.md#troubleshooting)

## License

MIT
