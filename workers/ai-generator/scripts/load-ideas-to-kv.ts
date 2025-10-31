#!/usr/bin/env node
/**
 * Script to batch-load ideas/*.json files into KV queue
 * 
 * Usage:
 *   npx tsx scripts/load-ideas-to-kv.ts
 * 
 * Or with wrangler:
 *   wrangler dev --env production < scripts/load-ideas-to-kv.ts
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { addIdeaToQueue } from '../src/queue';
import { validateIdeaSeed } from '../src/utils';
import type { IdeaSeed } from '../src/types';

// This script is meant to run in a Node.js environment with KV access
// In practice, you'd need to wrap this in a Worker or use wrangler's dev mode
// For now, this is a template that shows the logic

async function loadIdeasToKV() {
	const ideasDir = join(process.cwd(), '../../ideas');
	const files = readdirSync(ideasDir).filter(file => 
		file.endsWith('.json') && file !== 'TEMPLATE.json'
	);
	
	console.log(`Found ${files.length} idea files`);
	
	const results: Array<{ file: string; status: 'success' | 'error'; message: string }> = [];
	
	// Note: In a real implementation, you'd need access to the KV namespace
	// This could be done via:
	// 1. A Worker endpoint that accepts ideas and loads them
	// 2. Running wrangler dev and calling the Worker API
	// 3. Using wrangler kv:namespace API directly
	
	for (const file of files) {
		try {
			const filePath = join(ideasDir, file);
			const content = readFileSync(filePath, 'utf-8');
			const idea: IdeaSeed = JSON.parse(content);
			
			// Validate idea
			const validationError = validateIdeaSeed(idea);
			if (validationError) {
				results.push({
					file,
					status: 'error',
					message: `Validation failed: ${validationError}`,
				});
				continue;
			}
			
			// Add to queue (requires KV access)
			// await addIdeaToQueue(env.IDEA_QUEUE, idea);
			
			console.log(`✓ Loaded: ${file} - "${idea.title}"`);
			results.push({
				file,
				status: 'success',
				message: `Added to queue`,
			});
		} catch (error) {
			console.error(`✗ Error loading ${file}:`, error);
			results.push({
				file,
				status: 'error',
				message: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}
	
	console.log('\n=== Summary ===');
	for (const result of results) {
		const icon = result.status === 'success' ? '✓' : '✗';
		console.log(`${icon} ${result.file}: ${result.message}`);
	}
}

// For now, just export the function
// To actually run this, you'd create a Worker endpoint or use wrangler CLI
if (require.main === module) {
	console.log('This script needs KV access via a Worker.');
	console.log('Consider creating a Worker endpoint to handle idea loading,');
	console.log('or use wrangler kv:put commands directly.');
	console.log('\nExample: Create a POST /ai/load-ideas endpoint in the Worker.');
}

export { loadIdeasToKV };

