import type { NuggetFrontmatter } from './types';
import { isValidTag } from './constants';

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
	const lines = [
		`title: "${frontmatter.title.replace(/"/g, '\\"')}"`,
		`summary: "${frontmatter.summary.replace(/"/g, '\\"')}"`,
		`tags: [${frontmatter.tags.map(tag => `"${tag}"`).join(', ')}]`,
		`date: ${frontmatter.date}`,
		`readTime: "${frontmatter.readTime}"`,
		`published: ${frontmatter.published}`,
	];

	// Optional fields
	if (frontmatter.generatedFrom) {
		lines.push(`generatedFrom: "${frontmatter.generatedFrom}"`);
	}
	if (frontmatter.reviewed !== undefined) {
		lines.push(`reviewed: ${frontmatter.reviewed}`);
	}

	return `---\n${lines.join('\n')}\n---`;
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
	
	if (idea.title.length >= 80) {
		return 'Title must be less than 80 characters';
	}
	
	if (!idea.topic || typeof idea.topic !== 'string') {
		return 'Missing or invalid "topic" field';
	}
	
	if (!Array.isArray(idea.tags) || idea.tags.length === 0) {
		return 'Missing or invalid "tags" array';
	}
	
	// Validate tags against whitelist
	for (const tag of idea.tags) {
		if (typeof tag !== 'string') {
			return `Invalid tag: "${tag}" must be a string`;
		}
		if (!isValidTag(tag)) {
			return `Tag "${tag}" is not in the valid tag list`;
		}
	}
	
	// Validate risk field if present
	if (idea.risk !== undefined && idea.risk !== 'low' && idea.risk !== 'high') {
		return 'Risk field must be "low" or "high"';
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
 * Generate date string in YAML format (YYYY-MM-DD) for frontmatter
 */
export function getDateString(): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}
