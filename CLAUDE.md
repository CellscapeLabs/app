# Cellscape — Claude Code project guide

## What this app is
An interactive biology education tool for students. The core differentiator is
rich, animated visualizations (SVG/Three.js) and virtual lab simulations — not
just static content and quizzes. Target users: high school and early college
biology students.

## Tech stack
- **Framework**: Next.js (App Router) — web-first, works on all devices
- **Styling**: Tailwind CSS
- **Visualizations**: D3.js for 2D diagrams, Three.js for 3D structures
- **Animations**: Framer Motion for UI, Lottie for biology motion graphics
- **Auth & DB**: Supabase (auth + postgres)
- **Deployment**: Vercel (connected to this repo)

## Project structure
```
/app              → Next.js app router pages
/components
  /ui             → Generic UI components (buttons, cards, nav)
  /visualizations → Interactive biology diagrams and simulations
  /lessons        → Lesson layout and content components
/lib              → Supabase client, utilities, data fetching
/content          → Biology topic data (JSON or MDX)
/public           → Static assets, Lottie JSON files
.github/
  workflows/
    ci.yml        → Lint + typecheck on every PR
```

## Branch strategy
- `main` → production (auto-deploys to cellscape.app via Vercel)
- `dev` → staging (auto-deploys to a Vercel preview URL)
- Feature work → branch off `dev`, open PR back into `dev`
- Only merge `dev` → `main` when stable and tested on the preview URL

Never push directly to `main`. Always go through a PR, even when working solo —
branch protection is enabled.

## Vercel environments
- **Production**: triggered by merges to `main`
- **Preview**: triggered by every push to `dev` or any feature branch
- Preview URLs follow the pattern: `cellscape-git-branch-name.vercel.app`
- Test on the preview URL on mobile before merging to `main`

## Current phase: Phase 2 — Interactive lessons
Core app is scaffolded. We are now building out the full AP-Biology lesson library.
Progress is tracked in `cellscape_lesson_checklist.html` at the repo root — open
it in a browser to see what's done and what's next.

## Roadmap summary
1. **Phase 1** (weeks 1–6): Core app, routing, user auth, topic browsing, lesson flow ✓
2. **Phase 2** (weeks 7–14): Full AP-Bio interactive lesson library (30 lessons across 3 topics)
3. **Phase 3** (weeks 15–20): Spaced repetition quizzes, progress tracking, streaks
4. **Phase 4** (month 6+): Teacher accounts, freemium model, AI-powered hints

## Lesson plan (AP-Bio scope) — 30 lessons
Source of truth: `cellscape_lesson_checklist.html`. Summary below for quick reference.

### Cell biology
| # | Lesson | Status |
|---|--------|--------|
| 1 | Mitosis | ✓ done |
| 2 | Meiosis | ✓ done |
| 3 | Organelles | ✓ done |
| 4 | Cell membrane & transport | ✓ done |
| 5 | Osmosis & diffusion simulator | ✓ done |
| 6 | Cellular respiration — ATP production | — |
| 7 | Photosynthesis — light & dark reactions | — |
| 8 | The cell cycle & checkpoints | — |
| 9 | Prokaryotic vs eukaryotic cells | — |
| 10 | Enzyme activity & inhibition | — |

### Genetics
| # | Lesson | Status |
|---|--------|--------|
| 1 | DNA structure — double helix explorer | up next |
| 2 | DNA replication fork animation | — |
| 3 | Transcription — DNA to mRNA | — |
| 4 | Translation — mRNA to protein | — |
| 5 | Mendelian inheritance & Punnett squares | — |
| 6 | Mutations — types and effects | — |
| 7 | Gene expression & regulation | — |
| 8 | Chromosomes & karyotyping | — |
| 9 | Genetic disorders explorer | — |
| 10 | CRISPR — gene editing explainer | — |

### Ecosystems
| # | Lesson | Status |
|---|--------|--------|
| 1 | Food web builder | up next |
| 2 | Energy flow — trophic levels | — |
| 3 | Carbon cycle animation | — |
| 4 | Nitrogen cycle animation | — |
| 5 | Water cycle animation | — |
| 6 | Population dynamics — predator/prey simulator | — |
| 7 | Biomes of the world — interactive map | — |
| 8 | Biodiversity & species interactions | — |
| 9 | Human impact — deforestation & climate | — |
| 10 | Ecological succession | — |

## Lesson standards
Every lesson must follow the pattern established by Mitosis, Meiosis, and Organelles:
- Dedicated route under `/app/topics/[topic]/[lesson]/page.tsx`
- Visualization component in `/components/visualizations/` with a comment block explaining the biology concept and interactions
- Step-through or interactive animation (not static content)
- Mobile-responsive, keyboard-accessible

## Coding conventions
- TypeScript throughout — no `any` types
- Functional React components with hooks only
- Co-locate component styles with the component (Tailwind classes only)
- Keep visualization logic in `/components/visualizations`, never in page files
- Use server components for data fetching, client components for interactivity
- Every visualization component must have a comment at the top explaining:
  - What biology concept it teaches
  - What interactions it supports

## Design principles
- Mobile-first responsive layout
- Accessible: all interactive diagrams need keyboard nav and ARIA labels
- Visualizations should work without JS as static fallbacks
- Clean, scientific aesthetic — white space, subtle color, no gimmicks

## Environment variables
See `.env.example` in the repo root for required variable names.
Never commit `.env.local`. In Vercel, set these for both production and preview:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Commands
```bash
npm run dev       # Start dev server (localhost:3000)
npm run build     # Production build
npm run lint      # ESLint
npm run typecheck # tsc --noEmit
```

## CI
Every PR runs `.github/workflows/ci.yml` — lint and typecheck must pass before
merging. Fix errors locally before pushing; don't rely on CI to catch them first.

## How to work with me (Claude Code)
- Always read this file before starting any task
- Ask before installing new dependencies — keep the bundle lean
- When building a new visualization, start with a static SVG, then add interactivity
- Prefer small, focused components over large multi-purpose ones
- Never touch `main` directly — always branch from `dev`
- When a task is done, remind me to test on the Vercel preview URL before merging
