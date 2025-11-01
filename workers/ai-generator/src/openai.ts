import type { Env, IdeaSeed, GeneratedNugget, NuggetFrontmatter } from './types';
import { generateSlug, buildMDXFile, getDateString } from './utils';

const SYSTEM_PROMPT = `
You are an expert technical writer specializing in backend and AI engineering.
Generate concise, high-signal technical insights ("nuggets") for an experienced engineering audience.

**Requirements**
- 150–300 words total.
- **Voice:** Direct, confident, peer-to-peer (senior IC to senior IC).
- **Structure:**
  1. *Context* — one-sentence setup.
  2. *Insight* — 3–5 short paragraphs or bullets (each with a clear engineering takeaway).
  3. *Optional:* code example (≤20 LOC, illustrative only).
  4. *Apply It* — 1–2 actionable bullets.
- Avoid fluff, buzzwords, vendor promotion, or speculative metrics.
- Base all insights on practical, real-world engineering experience.
- Use tags only from this list:
  [microservices, reliability, api-design, scaling, infra, ai-engineering, llm, rag, vector-search, evaluation, prompt-engineering, devops, databases, caching, observability, testing].
- Output only the **Markdown body** (no YAML frontmatter or metadata).
- Be precise, concrete, and high-signal.
`;


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
	const wordCount = content.split(/\s+/).length;
	const frontmatter: NuggetFrontmatter = {
		title: idea.title,
		summary: generateSummary(content),
		date: getDateString(),
		readTime: calculateReadTime(wordCount),
		tags: idea.tags,
		published: false, // Always false for PR workflow (set to true after review)
		generatedFrom: slug,
		reviewed: false,
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

function generateSummary(content: string): string {
	// Extract first meaningful sentence or paragraph as summary
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

/**
 * Calculate read time based on word count
 * Assumes average reading speed of ~200 words per minute
 */
function calculateReadTime(wordCount: number): string {
	const minutes = Math.max(1, Math.ceil(wordCount / 200));
	return `${minutes} min`;
}
