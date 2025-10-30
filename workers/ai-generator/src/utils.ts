import type { NuggetFrontmatter } from './types';

/**
 * Generate a URL-friendly slug from a title
 */
export function generateSlug(title: string): string {
	return title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

/**
 * Format frontmatter as YAML
 */
export function formatFrontmatter(frontmatter: NuggetFrontmatter): string {
	return `---
title: "${frontmatter.title.replace(/"/g, '\\"')}"
description: "${frontmatter.description.replace(/"/g, '\\"')}"
pubDate: ${frontmatter.pubDate}
tags: [${frontmatter.tags.map(tag => `"${tag}"`).join(', ')}]
draft: ${frontmatter.draft}
---`;
}

/**
 * Build complete MDX file content
 */
export function buildMDXFile(frontmatter: NuggetFrontmatter, content: string): string {
	return `${formatFrontmatter(frontmatter)}\n\n${content.trim()}\n`;
}

/**
 * Validate idea seed structure
 */
export function validateIdeaSeed(idea: any): string | null {
	if (!idea.title || typeof idea.title !== 'string') {
		return 'Missing or invalid "title" field';
	}
	if (!idea.topic || typeof idea.topic !== 'string') {
		return 'Missing or invalid "topic" field';
	}
	if (!Array.isArray(idea.tags) || idea.tags.length === 0) {
		return 'Missing or invalid "tags" array';
	}
	return null;
}

/**
 * Rate limiting check using KV
 */
export async function checkRateLimit(
	kv: KVNamespace<string>,
	identifier: string,
	limitPerHour: number
): Promise<{ allowed: boolean; remaining: number }> {
	const key = `rate_limit:${identifier}:${getCurrentHour()}`;
	const current = await kv.get(key);
	const count = current ? parseInt(current, 10) : 0;

	if (count >= limitPerHour) {
		return { allowed: false, remaining: 0 };
	}

	await kv.put(key, (count + 1).toString(), { expirationTtl: 3600 });
	return { allowed: true, remaining: limitPerHour - count - 1 };
}

/**
 * Get current hour as string for rate limiting
 */
function getCurrentHour(): string {
	const now = new Date();
	return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}-${String(now.getUTCHours()).padStart(2, '0')}`;
}

/**
 * Generate ISO date string for frontmatter
 */
export function getISODate(): string {
	return new Date().toISOString();
}
