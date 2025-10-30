# ⚠️ Before Deployment

## Install Worker Dependencies

The Worker requires `@cloudflare/workers-types` and `wrangler` to be installed.

Run this from the worker directory:

```bash
cd workers/ai-generator
npm install
```

This will install:
- `@cloudflare/workers-types` - TypeScript definitions for Cloudflare Workers
- `wrangler` - Cloudflare Workers CLI tool

After installation, the TypeScript errors for `KVNamespace` will be resolved.

## Alternative: Install Globally

If you prefer, you can install wrangler globally:

```bash
npm install -g wrangler
```

Then just install the types in the worker directory:

```bash
cd workers/ai-generator
npm install --save-dev @cloudflare/workers-types
```

## Next Steps

After installing dependencies, proceed with the setup in `/docs/ai-worker-setup.md`.
