import type { Env, IdeaSeed, GeneratedNugget, NuggetFrontmatter } from './types';
import { generateSlug, buildMDXFile, getISODate } from './utils';

const SYSTEM_PROMPT = `You are an expert technical writer specializing in backend and AI engineering.
Generate concise, high-signal engineering insights called "nuggets" for an experienced engineering audience.

Requirements:
- 150-300 words total
- Voice: Direct, confident, peer-to-peer (senior IC talking to other senior ICs)
- Structure:
  1. Context (1 sentence setup)
  2. Insight (3-5 bullets or short paragraphs)
  3. Optional code example (≤20 LOC, illustrative, not production-ready)
  4. "Apply It" section (1-2 actionable bullets)
- No fluff, no vendor pitches, no invented metrics
- Grounded in real engineering experience
- Tags: Use from [microservices, reliability, api-design, scaling, infra, ai-engineering, llm, rag, vector-search, evaluation, prompt-engineering, devops, databases, caching, observability, testing]

Output only the markdown content body (no frontmatter). Be technical and precise.`;

export async function generateNugget(idea: IdeaSeed, env: Env): Promise<GeneratedNugget> {
	const userPrompt = buildUserPrompt(idea);

	// Call OpenAI API
	const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${env.OPENAI_API_KEY}`,
		},
		body: JSON.stringify({
			model: 'gpt-4o-mini',
			messages: [
				{ role: 'system', content: SYSTEM_PROMPT },
				{ role: 'user', content: userPrompt },
			],
			temperature: 0.7,
			max_tokens: 1000,
		}),
	});

	if (!openaiResponse.ok) {
		const errorText = await openaiResponse.text();
		throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
	}

	const openaiData = await openaiResponse.json();
	const content = openaiData.choices?.[0]?.message?.content;

	if (!content) {
		throw new Error('No content generated from OpenAI');
	}

	// Build frontmatter
	const slug = generateSlug(idea.title);
	const frontmatter: NuggetFrontmatter = {
		title: idea.title,
		description: generateDescription(content),
		pubDate: getISODate(),
		tags: idea.tags,
		draft: true, // Always draft for PR workflow
	};

	const fullMdx = buildMDXFile(frontmatter, content);

	return {
		slug,
		frontmatter,
		content,
		fullMdx,
	};
}

function buildUserPrompt(idea: IdeaSeed): string {
	let prompt = `Write a technical nugget about: ${idea.topic}\n\n`;
	prompt += `Title: ${idea.title}\n`;
	prompt += `Tags: ${idea.tags.join(', ')}\n`;

	if (idea.context) {
		prompt += `\nContext: ${idea.context}\n`;
	}

	if (idea.targetAudience) {
		prompt += `Target audience: ${idea.targetAudience}\n`;
	}

	if (idea.codeExample) {
		prompt += `\nInclude a concise code example (≤20 lines).`;
	}

	return prompt;
}

function generateDescription(content: string): string {
	// Extract first meaningful sentence or paragraph as description
	const lines = content.trim().split('\n').filter(line => line.trim().length > 0);
	
	for (const line of lines) {
		// Skip markdown headers
		if (line.startsWith('#')) continue;
		
		// Get first sentence
		const cleanLine = line.trim();
		if (cleanLine.length > 50) {
			const firstSentence = cleanLine.split(/[.!?]/)[0];
			return firstSentence.substring(0, 160) + (firstSentence.length > 160 ? '...' : '');
		}
	}

	return content.substring(0, 160).trim() + '...';
}
