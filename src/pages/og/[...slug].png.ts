import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { generateOGImage } from '../../utils/og-image';

export async function getStaticPaths() {
  const nuggets = await getCollection('nuggets', ({ data }) => {
    return data.published !== false;
  });

  return nuggets.map((nugget) => ({
    params: { slug: `nuggets/${nugget.slug}` },
    props: { nugget },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { nugget } = props;

  const png = await generateOGImage({
    title: nugget.data.title,
    tags: nugget.data.tags,
    date: nugget.data.date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }),
    type: 'article',
  });

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
