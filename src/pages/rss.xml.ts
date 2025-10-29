import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const nuggets = await getCollection('nuggets', ({ data }) => {
    return data.published !== false;
  });

  const sortedNuggets = nuggets.sort((a, b) => {
    return b.data.date.getTime() - a.data.date.getTime();
  });

  const siteUrl = import.meta.env.PUBLIC_SITE_URL || context.site?.toString() || 'https://farhan.dev';
  const authorName = import.meta.env.PUBLIC_AUTHOR_NAME || 'Farhan Hasin Chowdhury';

  return rss({
    title: `${authorName} - Engineering Nuggets`,
    description: 'Short, high-signal insights on backend and AI engineering. One core idea, code snippet, and takeaway.',
    site: siteUrl,
    items: sortedNuggets.map((nugget) => ({
      title: nugget.data.title,
      description: nugget.data.summary,
      pubDate: nugget.data.date,
      link: `/nuggets/${nugget.slug}/`,
      categories: nugget.data.tags,
      author: import.meta.env.PUBLIC_AUTHOR_EMAIL || 'hello@farhan.dev',
    })),
    customData: `<language>en-us</language>`,
    stylesheet: '/rss-styles.xsl',
  });
}
