// SEO keyword mappings for different topics
export const topicKeywords: Record<string, string[]> = {
  'AI': [
    'Artificial Intelligence',
    'Machine Learning',
    'AI Engineering',
    'Large Language Models',
    'LLM',
    'RAG',
    'Retrieval Augmented Generation',
    'Neural Networks',
    'Deep Learning'
  ],
  'Backend': [
    'Backend Engineering',
    'Backend Development',
    'Server-Side Programming',
    'API Development',
    'Microservices',
    'Distributed Systems',
    'System Design',
    'Software Architecture'
  ],
  'Database': [
    'Database Design',
    'Database Optimization',
    'SQL',
    'NoSQL',
    'Database Management',
    'Data Modeling',
    'Database Performance',
    'Query Optimization'
  ],
  'Redis': [
    'Redis',
    'In-Memory Database',
    'Caching',
    'Key-Value Store',
    'Distributed Locks',
    'Redis Clustering'
  ],
  'Payments': [
    'Payment Processing',
    'Payment APIs',
    'Payment Integration',
    'Financial Technology',
    'FinTech',
    'Payment Gateway',
    'Transaction Processing'
  ],
  'API Design': [
    'API Design',
    'REST API',
    'API Development',
    'Web Services',
    'API Best Practices',
    'API Architecture',
    'RESTful Services'
  ],
  'DevOps': [
    'DevOps',
    'CI/CD',
    'Continuous Integration',
    'Continuous Deployment',
    'Infrastructure as Code',
    'Cloud Infrastructure',
    'Container Orchestration'
  ],
  'Security': [
    'Application Security',
    'Web Security',
    'Security Best Practices',
    'Secure Coding',
    'Authentication',
    'Authorization',
    'Data Protection'
  ],
  'Performance': [
    'Performance Optimization',
    'Application Performance',
    'Code Optimization',
    'System Performance',
    'Scalability',
    'Load Balancing'
  ]
};

// Base keywords that apply to all technical content
export const baseKeywords = [
  'Software Development',
  'Software Engineering',
  'Technical Tutorial',
  'Programming',
  'Code Examples',
  'Best Practices'
];

/**
 * Get SEO keywords for a list of tags
 * @param tags - Array of tags from content frontmatter
 * @returns Combined array of relevant keywords
 */
export function getKeywordsForTags(tags: string[]): string[] {
  const keywords = new Set<string>([...baseKeywords]);
  
  // Add keywords for each tag
  tags.forEach(tag => {
    const tagKeywords = topicKeywords[tag];
    if (tagKeywords) {
      tagKeywords.forEach(keyword => keywords.add(keyword));
    } else {
      // If no mapping exists, add the tag itself
      keywords.add(tag);
    }
  });
  
  return Array.from(keywords);
}
