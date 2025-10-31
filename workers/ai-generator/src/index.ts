import type { Env, NuggetRequest, APIResponse, IdeaSeed } from './types';
import { validateIdeaSeed, checkRateLimit, generateSlug } from './utils';
import { generateNugget } from './openai';
import { createPullRequest } from './github';
import { getNextPendingIdea, markIdeaStatus, addIdeaToQueue } from './queue';

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
		const url = new URL(request.url);

		// CORS headers
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		};

		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		// Route handling
		if (url.pathname === '/ai/generate-nugget' && request.method === 'POST') {
			return handleGenerateNugget(request, env, corsHeaders);
		}

		if (url.pathname === '/ai/load-idea' && request.method === 'POST') {
			return handleLoadIdea(request, env, corsHeaders);
		}

		if (url.pathname === '/ai/health' && request.method === 'GET') {
			return jsonResponse({ success: true, message: 'AI Worker is healthy' }, 200, corsHeaders);
		}

		return jsonResponse(
			{ success: false, error: 'Not Found' },
			404,
			corsHeaders
		);
	},
};

async function handleGenerateNugget(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		// Authentication check
		const authHeader = request.headers.get('Authorization');
		const expectedAuth = `Bearer ${env.WORKER_API_KEY}`;
		
		if (!authHeader || authHeader !== expectedAuth) {
			return jsonResponse(
				{ success: false, error: 'Unauthorized' },
				401,
				corsHeaders
			);
		}

		// Parse request body
		const body = await request.json() as NuggetRequest;

		// Validate idea seed
		const validationError = validateIdeaSeed(body.idea);
		if (validationError) {
			return jsonResponse(
				{ success: false, error: `Invalid idea seed: ${validationError}` },
				400,
				corsHeaders
			);
		}

		// Rate limiting (by IP or API key)
		const identifier = request.headers.get('CF-Connecting-IP') || 'anonymous';
		const rateLimit = await checkRateLimit(
			env.NUGGET_STORE,
			identifier,
			parseInt(env.RATE_LIMIT_PER_HOUR, 10)
		);

		if (!rateLimit.allowed) {
			return jsonResponse(
				{
					success: false,
					error: 'Rate limit exceeded. Try again later.',
				},
				429,
				corsHeaders
			);
		}

		// Generate nugget using OpenAI
		const nugget = await generateNugget(body.idea, env);

		// Create GitHub PR
		const pr = await createPullRequest(nugget, env);

		// Log to KV for tracking
		await env.NUGGET_STORE.put(
			`generation:${nugget.slug}`,
			JSON.stringify({
				slug: nugget.slug,
				title: nugget.frontmatter.title,
				createdAt: new Date().toISOString(),
				prUrl: pr.prUrl,
			}),
			{ expirationTtl: 86400 * 30 } // Keep for 30 days
		);

		return jsonResponse(
			{
				success: true,
				message: 'Nugget generated and PR created successfully',
				data: {
					nugget: {
						slug: nugget.slug,
						frontmatter: nugget.frontmatter,
						content: nugget.content.substring(0, 200) + '...', // Preview only
						fullMdx: '', // Don't send full content in response
					},
					pr,
				},
			},
			201,
			corsHeaders
		);
	} catch (error) {
		console.error('Error generating nugget:', error);
		return jsonResponse(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Internal server error',
			},
			500,
			corsHeaders
		);
	}
}

async function handleLoadIdea(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		// Authentication check
		const authHeader = request.headers.get('Authorization');
		const expectedAuth = `Bearer ${env.WORKER_API_KEY}`;
		
		if (!authHeader || authHeader !== expectedAuth) {
			return jsonResponse(
				{ success: false, error: 'Unauthorized' },
				401,
				corsHeaders
			);
		}

		// Parse request body (expects { idea: IdeaSeed } or just IdeaSeed)
		const body = await request.json();
		const idea: IdeaSeed = body.idea || body;

		// Validate idea seed
		const validationError = validateIdeaSeed(idea);
		if (validationError) {
			return jsonResponse(
				{ success: false, error: `Invalid idea seed: ${validationError}` },
				400,
				corsHeaders
			);
		}

		// Add to queue
		const slug = await addIdeaToQueue(env.IDEA_QUEUE, idea);

		return jsonResponse(
			{
				success: true,
				message: 'Idea added to queue successfully',
				data: {
					slug,
					idea: {
						title: idea.title,
						status: 'pending',
					},
				},
			},
			201,
			corsHeaders
		);
	} catch (error) {
		console.error('Error loading idea:', error);
		return jsonResponse(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Internal server error',
			},
			500,
			corsHeaders
		);
	}
}

function jsonResponse(
	data: APIResponse,
	status: number,
	headers: Record<string, string>
): Response {
	return new Response(JSON.stringify(data, null, 2), {
		status,
		headers: {
			'Content-Type': 'application/json',
			...headers,
		},
	});
}
