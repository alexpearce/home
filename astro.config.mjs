import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

import sitemap from '@astrojs/sitemap';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import rehypeUnwrapImages from 'rehype-unwrap-images';

// https://astro.build/config
export default defineConfig({
	site: 'https://alex.pearwin.com',
	markdown: {
		rehypePlugins: [
			rehypeSlug,
			[rehypeAutolinkHeadings, {behavior: "append"}],
			rehypeUnwrapImages,
		],
		shikiConfig: {
			themes: {
				light: 'nord',
				dark: 'nord'
			},
		},
	},
	integrations: [mdx(), sitemap()],
});
