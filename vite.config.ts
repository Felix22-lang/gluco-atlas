import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { cloudflare } from '@cloudflare/vite-plugin';
import { defineConfig } from 'vite';
import vinext from 'vinext';
import hosting from './.openai/hosting.json';
import local from './wrangler.local.json';
import { sites } from './scripts/vite/sites-vite-plugin';

// Sites supplies a verified identity at its private gateway. A plain Worker
// build has no trusted identity provider and must not accept client-supplied IDs.
const siteProject = 'project_id' in hosting && typeof hosting.project_id === 'string' && Boolean(hosting.project_id);

const localTerms = fileURLToPath(new URL('./local/keywords.json', import.meta.url));
const publicTerms = fileURLToPath(new URL('./research/default-terms.json', import.meta.url));
const termsPath = existsSync(localTerms) ? localTerms : publicTerms;
if (termsPath === localTerms) {
  const terms = JSON.parse(readFileSync(termsPath, 'utf8'));
  for (const key of ['exerciseZh', 'exerciseEn', 'glucoseZh', 'glucoseEn', 'designZh']) {
    if (!Array.isArray(terms[key]) || !terms[key].every((word: unknown) => typeof word === 'string')) {
      throw new Error(`local/keywords.json 中的 ${key} 应为字符串数组。`);
    }
  }
}

export default defineConfig({
  resolve: { alias: { '#gluco-terms': termsPath } },
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  define: { __GLUCO_SITES_GATEWAY__: JSON.stringify(siteProject) },
  plugins: [
    vinext(),
    sites({ mockAuth: false }),
    cloudflare({
      inspectorPort: false,
      viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
      config: {
        main: './worker/index.ts',
        compatibility_date: local.compatibility_date,
        compatibility_flags: ['nodejs_compat'],
        d1_databases: local.d1_databases,
      },
    }),
  ],
});
