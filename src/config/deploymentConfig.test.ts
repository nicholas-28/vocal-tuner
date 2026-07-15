import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('deployment configuration', () => {
  it('contains a valid minimal Vercel SPA rewrite', () => {
    const config = JSON.parse(
      readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf8'),
    ) as {
      $schema?: string;
      rewrites?: Array<{ source?: string; destination?: string }>;
    };

    expect(config.$schema).toBe('https://openapi.vercel.sh/vercel.json');
    expect(config.rewrites).toEqual([
      { source: '/(.*)', destination: '/index.html' },
    ]);
  });

  it('references manifest icons that exist in public assets', () => {
    const manifest = JSON.parse(
      readFileSync(
        resolve(process.cwd(), 'public/manifest.webmanifest'),
        'utf8',
      ),
    ) as { icons?: Array<{ src?: string }> };

    expect(manifest.icons).not.toHaveLength(0);
    for (const icon of manifest.icons ?? [])
      expect(() =>
        readFileSync(resolve(process.cwd(), `public${icon.src}`), 'utf8'),
      ).not.toThrow();
  });
});
