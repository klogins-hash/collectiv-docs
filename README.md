# The Collectiv Documentation

Complete documentation for The Collectiv creator cooperative, built with [Fumadocs](https://fumadocs.dev).

## About The Collectiv

A creator cooperative where you crowdfund to get in, own your IP and cooperative equity, and borrow against your equity to build wealth.

We're building tools and infrastructure together. You're not joining something finished. You're helping build something you'll own part of.

## Documentation

This site contains comprehensive documentation covering:

- **Business Model** - How The Collectiv works economically
- **Governance** - Democratic decision-making and operations
- **Member Guide** - Everything members need to know
- **FAQ** - Common questions answered
- **Tools & Technical** - Technical documentation and APIs
- **Strategy** - Our 2026 strategy and sovereignty stack
- **Culture** - Brand rituals and public pledges

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org)
- **Documentation:** [Fumadocs](https://fumadocs.dev)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com)
- **Content:** MDX (Markdown + JSX)
- **Search:** Orama (local search)

## Development

### Prerequisites

- Node.js 22+
- pnpm (recommended)

### Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

The dev server will be available at `http://localhost:3000`.

## Project Structure

```
collectiv-docs/
├── app/                    # Next.js app directory
│   ├── (home)/            # Homepage
│   ├── docs/              # Documentation pages
│   └── layout.tsx         # Root layout
├── content/
│   └── docs/              # MDX documentation files
├── components/            # React components
├── lib/                   # Utility functions and configs
└── public/                # Static assets
```

## Writing Documentation

### Creating a New Page

1. Create a new `.mdx` file in `content/docs/`
2. Add frontmatter:

```mdx
---
title: Your Page Title
description: A brief description
---

## Your Content

Write your content here using Markdown and MDX.
```

3. The page will automatically appear in navigation

### MDX Features

Fumadocs supports enhanced MDX syntax:

- **Code blocks** with syntax highlighting
- **Tabs** for code examples
- **Callouts** for warnings/tips
- **Cards** for visual organization
- **Tables** and more

See [Fumadocs documentation](https://fumadocs.dev/docs/markdown) for full syntax.

## Customization

### Branding

Update branding in `lib/layout.shared.tsx`:

```tsx
export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: 'The Collectiv',
      url: '/',
    },
    // ... other options
  };
}
```

### Styling

Customize theme in `app/global.css` using Tailwind CSS.

### Navigation

Navigation is automatically generated from the file structure in `content/docs/`.

You can customize it using `meta.json` files. See [Fumadocs docs](https://fumadocs.dev/docs/navigation) for details.

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Deploy

Fumadocs works seamlessly with Vercel's Next.js hosting.

### Other Platforms

This is a standard Next.js app and can be deployed anywhere that supports Next.js:

- Netlify
- Railway
- AWS
- Your own server

## Features

✅ **Search** - Built-in local search powered by Orama
✅ **Dark Mode** - Automatic theme switching
✅ **Mobile Responsive** - Optimized for all devices
✅ **SEO Optimized** - Meta tags and Open Graph
✅ **Fast** - Built with Next.js and Turbopack
✅ **Type-Safe** - Full TypeScript support
✅ **Accessible** - WCAG compliant

## Contributing

To contribute documentation:

1. Fork this repository
2. Create a new branch
3. Add or edit MDX files in `content/docs/`
4. Test locally with `pnpm dev`
5. Submit a pull request

## License

Documentation content is licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

Code is licensed under MIT.

## Links

- **Website:** [The Collectiv](https://thecollectiv.com) *(coming soon)*
- **GitHub:** [github.com/klogins-hash](https://github.com/klogins-hash)
- **Fumadocs:** [fumadocs.dev](https://fumadocs.dev)

---

Built with ❤️ by The Collectiv community.
