#!/usr/bin/env node
/**
 * Script to batch-load all idea JSON files from ideas/ directory into KV queue
 * 
 * Usage:
 *   npx tsx scripts/load-ideas-batch.ts
 *   npx tsx scripts/load-ideas-batch.ts ../../ideas
 *   npm run load-ideas
 */

import { readFileSync, readdirSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { execSync } from 'child_process';
import { generateSlug } from '../src/utils';

const IDEA_DIR = process.argv[2] || join(process.cwd(), '../../ideas');

try {
	// Get KV namespace ID from wrangler.toml
	const wranglerTomlPath = join(process.cwd(), 'wrangler.toml');
	
	let wranglerContent: string;
	try {
		wranglerContent = readFileSync(wranglerTomlPath, 'utf-8');
	} catch (error) {
		throw new Error(
			'wrangler.toml not found. Please copy wrangler.toml.example to wrangler.toml and update with your KV namespace IDs.\n' +
			'Run: cp wrangler.toml.example wrangler.toml'
		);
	}
	
	const namespaceMatch = wranglerContent.match(/\[\[kv_namespaces\]\]\s+.*?binding = "IDEA_QUEUE"\s+.*?id = "([^"]+)"/s);
	
	if (!namespaceMatch) {
		throw new Error('IDEA_QUEUE namespace ID not found in wrangler.toml. Please create the namespace first.');
	}

	const namespaceId = namespaceMatch[1];

	if (!namespaceId || namespaceId.trim() === '' || namespaceId.includes('YOUR_')) {
		throw new Error(
			'IDEA_QUEUE namespace ID is not set in wrangler.toml. Please create the namespace and update the ID.\n' +
			'Run: wrangler kv:namespace create "IDEA_QUEUE"'
		);
	}

	console.log(`Loading ideas from: ${IDEA_DIR}`);
	console.log(`KV Namespace ID: ${namespaceId}`);
	console.log('');

	const files = readdirSync(IDEA_DIR).filter(file => 
		file.endsWith('.json') && file !== 'TEMPLATE.json'
	);

	if (files.length === 0) {
		console.log('No idea files found.');
		process.exit(0);
	}

	let successCount = 0;
	let failCount = 0;

	for (const file of files) {
		const filePath = join(IDEA_DIR, file);
		
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log(`📄 Processing: ${file}`);

		try {
			// Read and validate JSON
			const fileContent = readFileSync(filePath, 'utf-8');
			const idea = JSON.parse(fileContent);

			// Validate required fields
			if (!idea.title || typeof idea.title !== 'string') {
				console.log('❌ Missing "title" field');
				failCount++;
				continue;
			}

			// Generate slug
			const slug = generateSlug(idea.title);

			// Check if idea already exists
			const kvKey = `idea:${slug}`;
			const checkCommand = `wrangler kv:key get "${kvKey}" --namespace-id ${namespaceId}`;
			
			try {
				const existingValue = execSync(checkCommand, { 
					stdio: ['pipe', 'pipe', 'ignore'], // Suppress stderr for non-existent keys
					cwd: process.cwd(),
					encoding: 'utf-8'
				}).trim();
				
				if (existingValue) {
					console.log(`⏭️  Skipped: ${idea.title} (slug: ${slug}) - already exists`);
					continue;
				}
			} catch (error) {
				// Key doesn't exist, which is fine - continue
			}

			// Create idea with status metadata
			const ideaWithStatus = {
				...idea,
				risk: idea.risk || 'low',
				status: 'pending',
				createdAt: new Date().toISOString(),
			};

			const ideaJson = JSON.stringify(ideaWithStatus);

			// Load into KV using wrangler
			// Use temp file to avoid shell escaping issues (works on Windows/Unix)
			const tempFile = join(tmpdir(), `idea-${slug}-${Date.now()}.json`);
			
			try {
				// Write JSON to temp file
				writeFileSync(tempFile, ideaJson, 'utf-8');
				
				// Use wrangler - read value from file using --path
				const command = `wrangler kv:key put "${kvKey}" --path "${tempFile}" --namespace-id ${namespaceId}`;
				execSync(command, { 
					stdio: ['inherit', 'inherit', 'inherit'],
					cwd: process.cwd() 
				});
				
				// Clean up temp file
				unlinkSync(tempFile);
			} catch (tempError) {
				// Try to clean up temp file even on error
				try { unlinkSync(tempFile); } catch {}
				throw tempError;
			}
			
			console.log(`✅ Loaded: ${idea.title} (slug: ${slug})`);
			successCount++;
		} catch (error) {
			if (error instanceof Error) {
				if (error.message.includes('SyntaxError') || error.message.includes('Unexpected')) {
					console.log('❌ Invalid JSON');
				} else {
					console.log(`❌ Error: ${error.message}`);
				}
			} else {
				console.log('❌ Failed to load');
			}
			failCount++;
		}
	}

	console.log('');
	console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
	console.log(`Summary: ✅ ${successCount} successful, ❌ ${failCount} failed`);
	console.log('');
	console.log('⏰ Ideas will be processed by cron scheduler (Mon/Wed/Fri 09:00 UTC)');
} catch (error) {
	if (error instanceof Error) {
		console.error(`Error: ${error.message}`);
	} else {
		console.error('Error:', error);
	}
	process.exit(1);
}

