import { defineCollection, z } from 'astro:content';

const nuggets = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    tags: z.array(z.string()),
    date: z.coerce.date(),
    readTime: z.string(),
    published: z.boolean().default(true),
  }),
});

export const collections = { nuggets };
