import { defineConfig, type MarkdownRenderer } from 'vitepress';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// sidebar of the API, generated with its pages by `yarn doc:typedoc`
const apiSidebarFile = fileURLToPath(new URL('../api/typedoc-sidebar.json', import.meta.url));
const apiSidebar = existsSync(apiSidebarFile) ? JSON.parse(readFileSync(apiSidebarFile, 'utf8')) : [];

// headings of details of API members (parameters, return, inheritance...): not in the outline, which lists the
// classes, functions and types of a page and the members of its classes
const apiDetails = new Set([
  'Parameters',
  'Returns',
  'Type Parameters',
  'Type Declaration',
  'Type Literal',
  'Inherited from',
  'Overrides',
  'Implementation of',
  'Extends',
  'Extended by',
  'Implements',
  'Get Signature',
  'Set Signature',
  'Call Signature',
  'Index Signature',
  'Deprecated',
  'Throws',
  'Example',
  'Examples',
  'Param',
  'Remarks',
  'See',
  'Default Value',
]);

/** Rule of the core of markdown-it, as typed by VitePress */
type CoreRule = Parameters<MarkdownRenderer['core']['ruler']['push']>[1];

/**
 * Headings of details of API pages and their sub-headings without anchor: the outline (headings with an id) lists
 * members only
 * @param state Markdown state of a page
 */
const hideApiDetails: CoreRule = (state) => {
  if (!String(state.env.relativePath ?? '').startsWith('api/')) return;

  // level of the detail heading whose sub-headings are hidden, 0 for none
  let hidden = 0;

  for (const [i, token] of state.tokens.entries()) {
    if (token.type !== 'heading_open') continue;

    const level = Number(token.tag.slice(1));
    const inline = state.tokens[i + 1];

    if (hidden && level <= hidden) hidden = 0;
    if (!hidden && apiDetails.has(inline.content)) hidden = level;
    if (!hidden) continue;

    token.attrs = token.attrs?.filter(([name]) => name !== 'id') ?? null;

    // link to the anchor of the heading
    const children = inline.children ?? [];
    const start = children.findIndex((child) => child.attrGet('class') === 'header-anchor');
    const end = children.findIndex((child, j) => j > start && child.type === 'link_close');

    if (start >= 0 && end > start) children.splice(start, end - start + 1);
  }
};

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'free-drawing',
  description: 'Infinite canvas drawing library',
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico', sizes: '16x16 32x32 48x48' }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
  ],
  cleanUrls: true,
  // API pages (one per source file): classes, functions and types of the file in the outline, with the members of
  // classes (properties, methods...), not their details
  transformPageData(pageData) {
    if (pageData.relativePath.startsWith('api/')) pageData.frontmatter.outline ??= [2, 5];
  },
  markdown: {
    config(md) {
      md.core.ruler.push('api-details', hideApiDetails);
    },
  },
  // local search index of every page (API included, about 2.3 MB), loaded when search is opened
  vite: { build: { chunkSizeWarningLimit: 3000 } },
  themeConfig: {
    logo: '/logo.svg',
    search: { provider: 'local' },
    footer: {
      message:
        'Released under the <a href="https://github.com/fabienwnklr/free-drawing/blob/master/LICENCE">MIT License</a>.',
      copyright: 'Copyright © 2023-present <a href="https://github.com/fabienwnklr">Fabien Winkler</a>',
    },
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Get started', link: '/get-started/' },
      { text: 'Features', link: '/features' },
      { text: 'Plugins', link: '/plugins' },
      { text: 'API', link: '/api/' },
      { text: 'Changelog', link: '/changelog' },
      { text: 'Demo', link: 'https://free-drawing-demo.netlify.app/', target: '_blank' },
    ],
    sidebar: {
      '/get-started/': [
        {
          text: 'Guide',
          items: [
            { text: 'Get started', link: '/get-started/' },
            // components (READMEs of their packages)
            { text: 'React', link: '/get-started/react' },
            { text: 'Vue', link: '/get-started/vue' },
            { text: 'Web Component', link: '/get-started/element' },
            { text: 'Contribute', link: '/get-started/contribute' },
          ],
        },
      ],
      '/api/': [{ text: 'API', items: apiSidebar }],
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/fabienwnklr/free-drawing' }],
  },
});
