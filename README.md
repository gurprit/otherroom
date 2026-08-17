# OtherRoom 🚪

> Give unwanted DMs somewhere else to go.

**OtherRoom** is a lightweight anonymous chat app that lets you create a shareable room containing an AI character. Instead of continuing an unwanted or awkward conversation in your own DMs, you can send the visitor to an OtherRoom and let the character take it from there.

🌐 **Live:** [otherroom.chat](https://otherroom.chat/)

## How it works

1. Create an OtherRoom.
2. Give the character a name and choose a personality, or write your own.
3. Share the generated room link.
4. The visitor chats anonymously with the AI character.
5. Return to the private management page to see conversations and room statistics.

The character is deliberately separate from the room creator. OtherRoom is not intended to impersonate the person who shared the link.

## Features

- 🎭 Preset AI personalities
- ✍️ Custom character personalities
- 🔗 Shareable room links
- 💬 Anonymous visitor chat
- 🧠 AI-generated character replies
- 💾 Persistent rooms and conversations
- 📊 Private room management and conversation stats
- 📱 Mobile-first interface
- ☁️ Serverless deployment on Cloudflare

## Tech stack

| | Technology |
| --- | --- |
| Framework | Next.js 16 |
| UI | React 19 |
| Language | TypeScript |
| Styling | SCSS Modules |
| Hosting | Cloudflare Workers |
| Next.js adapter | OpenNext for Cloudflare |
| Database | Cloudflare D1 |
| AI | Cloudflare Workers AI |
| Deployment | Wrangler |

## Local development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a local `.env.local` file for any environment-specific configuration required by the app.

Environment files are ignored by Git and **secrets should never be committed to the repository**.

### 3. Start the development server

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Useful commands

```bash
# Development
npm run dev

# Lint
npm run lint

# Standard Next.js production build
npm run build

# Cloudflare/OpenNext build
npm run cf:build
```

## Deployment

OtherRoom is deployed to Cloudflare Workers using OpenNext.

The production build command is:

```bash
npm run cf:build
```

The deployment command is:

```bash
npx wrangler deploy --keep-vars
```

Cloudflare configuration lives in `wrangler.jsonc`, including the D1 database binding used by the application.

Production deployments are connected to the `main` branch of this repository.

## Project structure

```text
app/
  api/                 API routes
  manage/[roomId]/     Private room management
  room/[roomId]/       Visitor chat experience
components/            React UI components
lib/                   Database, AI and application helpers
types/                 Shared TypeScript types
```

## Status

🟢 **MVP deployed**

OtherRoom is currently an early-stage project. The core create → share → chat → review flow is live, but features, character behaviour, safety controls and the interface are still being refined.

## Roadmap

- Improve character realism and personality consistency
- Expand safety and abuse protections
- Refine room analytics and achievements
- Improve sharing and onboarding
- Continue mobile UX polish
- Production testing across browsers and devices

---

Built as an experiment in giving awkward internet conversations another room to wander into. 🚪
