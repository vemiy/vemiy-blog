# vemiy-blog

A personal blog built with [Astro](https://astro.build/) and the [Firefly](https://github.com/CuteLeaf/Firefly) theme.

🔗 <https://www.vemiy.com>

## Local Development

```bash
pnpm install
pnpm dev       # preview at http://localhost:4321
pnpm build     # generate dist/
pnpm preview   # preview the production build
```

## Posts

Posts are in `src/content/posts/`, written in Markdown with Astro content collection front-matter.

## Deployment

Pushing to `main` triggers Cloudflare Workers Builds automatically.

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Output directory: `dist`

## License

Code: Apache-2.0 · Posts: CC BY-NC-SA 4.0
