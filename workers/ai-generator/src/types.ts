/// <reference types="@cloudflare/workers-types" />

export interface Env {
	OPENAI_API_KEY: string;
	GITHUB_TOKEN: string;
	WORKER_API_KEY: string;
	NUGGET_STORE: KVNamespace<string>;
	IDEA_QUEUE: KVNamespace<string>; // Stage 1: Scheduler queue
	GITHUB_REPO: string;
	GITHUB_BRANCH_PREFIX: string;
	RATE_LIMIT_PER_HOUR: string;
}

export interface IdeaSeed {
	title: string;
	topic: string;
	tags: string[];
	context?: string;
	targetAudience?: string;
	codeExample?: boolean;
	risk?: 'low' | 'high'; // Defaults to 'low' if not specified
}

export interface NuggetRequest {
	idea: IdeaSeed;
	mode?: 'draft' | 'final'; // draft for PR, final for direct commit
}

export interface NuggetFrontmatter {
	title: string;
	summary: string;
	date: string; // YAML date format: YYYY-MM-DD
	readTime: string;
	tags: string[];
	published: boolean;
	generatedFrom?: string; // Idea slug for tracking
	reviewed?: boolean; // Whether human reviewed (for Stage 2)
}

export interface GeneratedNugget {
	slug: string;
	frontmatter: NuggetFrontmatter;
	content: string;
	fullMdx: string;
}

export interface GitHubPRResponse {
	prUrl: string;
	prNumber: number;
	branchName: string;
}

export interface APIResponse {
	success: boolean;
	message?: string;
	data?: {
		nugget?: GeneratedNugget;
		pr?: GitHubPRResponse;
	};
	error?: string;
}

// Stage 1: Queue management types
export type IdeaStatus = 'pending' | 'in-progress' | 'awaiting-review' | 'published' | 'skipped';

export interface IdeaWithStatus extends IdeaSeed {
	status: IdeaStatus;
	createdAt?: string; // ISO timestamp
	prUrl?: string; // If status is 'awaiting-review'
	prNumber?: number;
	generatedAt?: string; // ISO timestamp when nugget was generated
}
