import type { Env } from './types';
import { generateSlug } from './utils';
import { getNextPendingIdea, markIdeaStatus } from './queue';
import { generateNugget } from './openai';
import { createPullRequest } from './github';

// Cron handler (Stage 1: scheduled generation)
export const scheduled = async (event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> => {
	console.log('Cron triggered:', event.cron);
	
	try {
		// Get next pending idea
		const idea = await getNextPendingIdea(env.IDEA_QUEUE);
		
		if (!idea) {
			console.log('No pending ideas in queue');
			return;
		}
		
		console.log(`Processing idea: ${idea.title} (slug: ${generateSlug(idea.title)})`);
		
		// Mark as in-progress
		const slug = generateSlug(idea.title);
		await markIdeaStatus(env.IDEA_QUEUE, slug, 'in-progress');
		
		// Generate nugget
		const nugget = await generateNugget(idea, env);
		
		// Create PR with scheduled date info
		const scheduledDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
		const pr = await createPullRequest(nugget, env, scheduledDate);
		
		// Mark as awaiting-review with PR metadata
		await markIdeaStatus(env.IDEA_QUEUE, slug, 'awaiting-review', {
			prUrl: pr.prUrl,
			prNumber: pr.prNumber,
		});
		
		console.log(`Successfully generated nugget and created PR #${pr.prNumber}: ${pr.prUrl}`);
		
		// Log to NUGGET_STORE for tracking
		await env.NUGGET_STORE.put(
			`generation:${nugget.slug}`,
			JSON.stringify({
				slug: nugget.slug,
				title: nugget.frontmatter.title,
				createdAt: new Date().toISOString(),
				prUrl: pr.prUrl,
				prNumber: pr.prNumber,
				source: 'cron-scheduler',
			}),
			{ expirationTtl: 86400 * 30 } // Keep for 30 days
		);
	} catch (error) {
		console.error('Error in scheduled handler:', error);
		// Re-throw to mark the cron execution as failed in Cloudflare
		throw error;
	}
};

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		// No public API endpoints - Worker only runs via cron scheduler
		// All idea loading is done via wrangler CLI
		return new Response('Not Found', { status: 404 });
	},
};
