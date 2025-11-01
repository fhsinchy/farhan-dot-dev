/**
 * Valid tags for nuggets
 * Based on the system prompt and site plan
 * Includes both lowercase (from prompt) and capitalized (from existing content) versions
 */
export const VALID_TAGS = [
	// From system prompt (lowercase)
	'microservices',
	'reliability',
	'api-design',
	'scaling',
	'infra',
	'ai-engineering',
	'llm',
	'rag',
	'vector-search',
	'evaluation',
	'prompt-engineering',
	'devops',
	'databases',
	'caching',
	'observability',
	'testing',
	// From existing content (capitalized)
	'Backend',
	'Payments',
	'API Design',
	'Distributed Systems',
	'Redis',
	// AI-related tags (capitalized versions)
	'AI',
	'LLM',
	'RAG',
] as const;

export const VALID_TAGS_SET = new Set(VALID_TAGS);
export const VALID_TAGS_LOWER_SET = new Set(VALID_TAGS.map(tag => tag.toLowerCase()));

/**
 * Validate if a tag is in the whitelist
 * Case-insensitive matching
 */
export function isValidTag(tag: string): boolean {
	// Check exact match first, then case-insensitive
	return VALID_TAGS_SET.has(tag) || VALID_TAGS_LOWER_SET.has(tag.toLowerCase());
}

