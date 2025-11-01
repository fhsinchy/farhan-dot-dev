import satori from 'satori';
import sharp from 'sharp';

interface OGImageOptions {
  title: string;
  tags?: string[];
  date?: string;
  type?: 'article' | 'default';
}

const INTER_REGULAR = 'https://cdn.jsdelivr.net/npm/@fontsource/inter@4.5.0/files/inter-latin-400-normal.woff';
const INTER_BOLD = 'https://cdn.jsdelivr.net/npm/@fontsource/inter@4.5.0/files/inter-latin-700-normal.woff';

export async function generateOGImage(options: OGImageOptions): Promise<Buffer> {
  const { title, tags = [], date, type = 'article' } = options;

  // Fetch fonts
  const [regularFont, boldFont] = await Promise.all([
    fetch(INTER_REGULAR).then(res => res.arrayBuffer()),
    fetch(INTER_BOLD).then(res => res.arrayBuffer()),
  ]);

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
          padding: '60px',
          fontFamily: 'Inter',
          color: '#ffffff',
        },
        children: [
          // Header
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'center',
                marginBottom: '40px',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '32px',
                      fontWeight: 700,
                      color: '#3b82f6',
                    },
                    children: 'farhan.dev',
                  },
                },
              ],
            },
          },
          // Title
          {
            type: 'div',
            props: {
              style: {
                fontSize: '64px',
                fontWeight: 700,
                lineHeight: 1.2,
                marginBottom: '30px',
                color: '#ffffff',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              },
              children: title,
            },
          },
          // Tags
          tags.length > 0 && {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                gap: '12px',
                marginBottom: '30px',
                flexWrap: 'wrap',
              },
              children: tags.slice(0, 4).map(tag => ({
                type: 'div',
                props: {
                  style: {
                    padding: '8px 16px',
                    background: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '6px',
                    fontSize: '20px',
                    color: '#3b82f6',
                  },
                  children: tag,
                },
              })),
            },
          },
          // Footer
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 'auto',
                paddingTop: '30px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '24px',
                      color: '#9ca3af',
                    },
                    children: type === 'article' ? 'Engineering Nuggets' : 'Backend & AI Engineering',
                  },
                },
                date && {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '20px',
                      color: '#9ca3af',
                    },
                    children: date,
                  },
                },
              ],
            },
          },
        ].filter(Boolean),
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Inter',
          data: regularFont,
          weight: 400,
          style: 'normal',
        },
        {
          name: 'Inter',
          data: boldFont,
          weight: 700,
          style: 'normal',
        },
      ],
    }
  );

  // Convert SVG to PNG using Sharp
  const png = await sharp(Buffer.from(svg))
    .png()
    .toBuffer();

  return png;
}
