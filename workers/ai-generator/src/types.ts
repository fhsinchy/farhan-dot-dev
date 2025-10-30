/// <reference types="@cloudflare/workers-types" />

export interface Env {
	OPENAI_API_KEY: string;
	GITHUB_TOKEN: string;
	NUGGET_STORE: KVNamespace<string>;
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
}

export interface NuggetRequest {
	idea: IdeaSeed;
	mode?: 'draft' | 'final'; // draft for PR, final for direct commit
}

export interface NuggetFrontmatter {
	title: string;
	description: string;
	pubDate: string;
	tags: string[];
	draft: boolean;
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
