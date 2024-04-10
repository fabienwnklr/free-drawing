import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'free-drawing',
  description: 'Free Drawing Docs',
  head: [],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Get started', link: '/get-started/' },
      { text: 'API', link: '/api/modules' },
      { text: 'Changelog', link: '/changelog' },
      { text: 'Demo', link: 'https://free-drawing.fabienwinkler.fr/', target: "_blank"},
    ],

    sidebar: {
      // This sidebar gets displayed when a user
      // is on `guide` directory.
      '/get-started/': [
        {
          text: 'Guide',
          items: [
            { text: 'Get started', link: '/get-started/' },
            { text: 'Constants', link: '/get-started/constants' },
            { text: 'Contribute', link: '/get-started/contribute' },
            { text: 'Events', link: '/get-started/events' }
          ]
        }
      ],

      // This sidebar gets displayed when a user
      // is on `config` directory.
      '/config/': [
        {
          text: 'Config',
          items: [
            { text: 'Index', link: '/config/' },
            { text: 'Three', link: '/config/three' },
            { text: 'Four', link: '/config/four' }
          ]
        }
      ]
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/vuejs/vitepress' }],
  },
});
