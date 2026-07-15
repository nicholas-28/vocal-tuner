import { access, readFile, readdir } from 'node:fs/promises';
import { extname } from 'node:path';

const root = new URL('../', import.meta.url);
const deploymentConfig = await readJson(new URL('vercel.json', root));
assert(
  deploymentConfig.$schema === 'https://openapi.vercel.sh/vercel.json',
  'vercel.json must use the official schema.',
);
assert(
  Array.isArray(deploymentConfig.rewrites) &&
    deploymentConfig.rewrites.some(
      (rewrite) =>
        rewrite?.source === '/(.*)' && rewrite.destination === '/index.html',
    ),
  'vercel.json must provide the SPA fallback to /index.html.',
);

const manifest = await readJson(new URL('public/manifest.webmanifest', root));
for (const field of [
  'name',
  'short_name',
  'theme_color',
  'background_color',
  'display',
])
  assert(
    typeof manifest[field] === 'string' && manifest[field].length > 0,
    `manifest.webmanifest requires ${field}.`,
  );
assert(
  Array.isArray(manifest.icons) && manifest.icons.length > 0,
  'manifest.webmanifest requires at least one icon.',
);
for (const icon of manifest.icons) {
  assert(
    typeof icon.src === 'string' && icon.src.startsWith('/'),
    'Manifest icon paths must be root-relative.',
  );
  await access(new URL(`public${icon.src}`, root));
}

const distUrl = new URL('dist/', root);
const distIndex = await readFile(new URL('index.html', distUrl), 'utf8');
assert(
  distIndex.includes('/manifest.webmanifest'),
  'Built index.html must reference the web manifest.',
);
await access(new URL('manifest.webmanifest', distUrl));

const forbiddenRuntimePatterns = [
  /https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])/i,
  /\/Users\/[A-Za-z0-9._-]+\//,
  /[A-Za-z]:\\Users\\[^\\]+\\/i,
];
for (const file of await collectTextFiles(new URL('dist/', root))) {
  const contents = await readFile(file, 'utf8');
  for (const pattern of forbiddenRuntimePatterns)
    assert(
      !pattern.test(contents),
      `Built output contains a forbidden local runtime value in ${file.pathname}.`,
    );
}

console.log('Deployment configuration and built output are valid.');

async function readJson(url) {
  try {
    return JSON.parse(await readFile(url, 'utf8'));
  } catch (error) {
    throw new Error(`Invalid JSON at ${url.pathname}: ${error.message}`);
  }
}

async function collectTextFiles(directoryUrl) {
  const files = [];
  for (const entry of await readdir(directoryUrl, { withFileTypes: true })) {
    const entryUrl = new URL(
      `${entry.name}${entry.isDirectory() ? '/' : ''}`,
      directoryUrl,
    );
    if (entry.isDirectory()) files.push(...(await collectTextFiles(entryUrl)));
    else if (
      ['.css', '.html', '.js', '.json', '.svg', '.webmanifest'].includes(
        extname(entry.name),
      )
    )
      files.push(entryUrl);
  }
  return files;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
