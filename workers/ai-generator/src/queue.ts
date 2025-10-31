import type { Env, IdeaSeed, IdeaWithStatus, IdeaStatus } from './types';
import { generateSlug } from './utils';

const IDEA_KEY_PREFIX = 'idea:';

/**
 * Get the KV key for an idea
 */
function getIdeaKey(slug: string): string {
	return `${IDEA_KEY_PREFIX}${slug}`;
}

/**
 * Extract slug from idea key
 */
function extractSlugFromKey(key: string): string {
	return key.replace(IDEA_KEY_PREFIX, '');
}

/**
 * Get next pending idea from the queue (FIFO)
 */
export async function getNextPendingIdea(kv: KVNamespace<string>): Promise<IdeaWithStatus | null> {
	// List all idea keys
	const listResult = await kv.list({ prefix: IDEA_KEY_PREFIX });
	
	if (!listResult.keys || listResult.keys.length === 0) {
		return null;
	}
	
	// Find the first pending idea
	for (const keyInfo of listResult.keys) {
		const ideaData = await kv.get(keyInfo.name);
		if (!ideaData) continue;
		
		const idea: IdeaWithStatus = JSON.parse(ideaData);
		if (idea.status === 'pending') {
			return idea;
		}
	}
	
	return null;
}

/**
 * Mark idea status in KV
 */
export async function markIdeaStatus(
	kv: KVNamespace<string>,
	slug: string,
	status: IdeaStatus,
	metadata?: { prUrl?: string; prNumber?: number }
): Promise<void> {
	const key = getIdeaKey(slug);
	const existing = await kv.get(key);
	
	if (!existing) {
		throw new Error(`Idea with slug "${slug}" not found in queue`);
	}
	
	const idea: IdeaWithStatus = JSON.parse(existing);
	idea.status = status;
	
	// Update timestamps
	if (status === 'in-progress' && !idea.generatedAt) {
		idea.generatedAt = new Date().toISOString();
	}
	
	// Add PR metadata if provided
	if (metadata?.prUrl) {
		idea.prUrl = metadata.prUrl;
	}
	if (metadata?.prNumber !== undefined) {
		idea.prNumber = metadata.prNumber;
	}
	
	await kv.put(key, JSON.stringify(idea));
}

/**
 * Add idea to queue
 */
export async function addIdeaToQueue(kv: KVNamespace<string>, idea: IdeaSeed): Promise<string> {
	const slug = generateSlug(idea.title);
	const key = getIdeaKey(slug);
	
	// Check if idea already exists
	const existing = await kv.get(key);
	if (existing) {
		const existingIdea: IdeaWithStatus = JSON.parse(existing);
		// If it's already published or skipped, don't re-add
		if (existingIdea.status === 'published' || existingIdea.status === 'skipped') {
			throw new Error(`Idea "${slug}" already exists with status "${existingIdea.status}"`);
		}
	}
	
	const ideaWithStatus: IdeaWithStatus = {
		...idea,
		risk: idea.risk || 'low', // Default to 'low' if not specified
		status: 'pending',
		createdAt: new Date().toISOString(),
	};
	
	await kv.put(key, JSON.stringify(ideaWithStatus));
	return slug;
}

/**
 * Get idea by slug
 */
export async function getIdeaBySlug(kv: KVNamespace<string>, slug: string): Promise<IdeaWithStatus | null> {
	const key = getIdeaKey(slug);
	const data = await kv.get(key);
	
	if (!data) {
		return null;
	}
	
	return JSON.parse(data) as IdeaWithStatus;
}

/**
 * List all ideas in queue (for debugging/admin)
 */
export async function listAllIdeas(kv: KVNamespace<string>): Promise<IdeaWithStatus[]> {
	const listResult = await kv.list({ prefix: IDEA_KEY_PREFIX });
	const ideas: IdeaWithStatus[] = [];
	
	if (!listResult.keys || listResult.keys.length === 0) {
		return ideas;
	}
	
	for (const keyInfo of listResult.keys) {
		const data = await kv.get(keyInfo.name);
		if (data) {
			ideas.push(JSON.parse(data) as IdeaWithStatus);
		}
	}
	
	return ideas;
}

