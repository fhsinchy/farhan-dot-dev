import type { Env } from './types';
import { generateSlug } from './utils';
import { getNextPendingIdea, markIdeaStatus, listAllIdeas } from './queue';
import { generateNugget } from './openai';
import { createPullRequest, checkPRStatus } from './github';

// Cron handler (Stage 1: scheduled generation and PR status checks)
export const scheduled = async (event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> => {
	console.log('Cron triggered:', event.cron);
	
	try {
		// Determine which cron schedule triggered this
		// "0 9 * * 1,3,5" = Mon/Wed/Fri (content generation)
		// "0 9 * * 2,4" = Tue/Thu (PR status check)
		const cronExpression = event.cron;
		const isGenerationDay = cronExpression.includes('1,3,5'); // Mon/Wed/Fri
		const isCheckDay = cronExpression.includes('2,4'); // Tue/Thu
		
		if (isCheckDay) {
			// Tuesday, Thursday: Check PR merge status
			console.log('Running PR status check...');
			await checkPublishedIdeas(env);
			return;
		}
		
		if (isGenerationDay) {
			// Monday, Wednesday, Friday: Generate new content
			console.log('Running content generation...');
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
		}
	} catch (error) {
		console.error('Error in scheduled handler:', error);
		// Re-throw to mark the cron execution as failed in Cloudflare
		throw error;
	}
};

/**
 * Check awaiting-review ideas and update to published if their PRs were merged
 */
async function checkPublishedIdeas(env: Env): Promise<void> {
	const allIdeas = await listAllIdeas(env.IDEA_QUEUE);
	const awaitingReview = allIdeas.filter(idea => idea.status === 'awaiting-review' && idea.prNumber);
	
	if (awaitingReview.length === 0) {
		console.log('No ideas awaiting review to check');
		return;
	}
	
	console.log(`Checking ${awaitingReview.length} idea(s) awaiting review...`);
	
	for (const idea of awaitingReview) {
		if (!idea.prNumber) continue;
		
		try {
			const isMerged = await checkPRStatus(idea.prNumber, env);
			
			if (isMerged) {
				const slug = generateSlug(idea.title);
				await markIdeaStatus(env.IDEA_QUEUE, slug, 'published');
				console.log(`✅ Idea "${idea.title}" (PR #${idea.prNumber}) marked as published`);
			}
		} catch (error) {
			console.error(`Error checking PR #${idea.prNumber} for "${idea.title}":`, error);
			// Continue checking other ideas even if one fails
		}
	}
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		// No public API endpoints - Worker only runs via cron scheduler
		// All idea loading is done via wrangler CLI
		// PR merge status is checked automatically by cron job
		return new Response('Not Found', { status: 404 });
	},
};
