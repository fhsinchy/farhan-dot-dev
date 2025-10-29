import type { APIRoute } from 'astro';
import { generateOGImage } from '../utils/og-image';

export const GET: APIRoute = async () => {
  const siteName = import.meta.env.PUBLIC_SITE_NAME || 'farhan.dev';
  const authorName = import.meta.env.PUBLIC_AUTHOR_NAME || 'Farhan Hasin Chowdhury';

  const png = await generateOGImage({
    title: `${authorName} - Backend & AI Engineer`,
    tags: ['Backend', 'AI', 'Distributed Systems', 'API Design'],
    type: 'default',
  });

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
