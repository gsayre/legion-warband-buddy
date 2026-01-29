# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Legion Warband Buddy is a full-stack web application for tracking and managing heroes in the mobile game "Mini Legion: Warbands". Users can manage character gear, create guilds, and collaborate with guild members.

## Tech Stack

- **Frontend**: React 19, TanStack Router (file-based routing), TypeScript
- **Backend**: Convex (serverless backend with real-time sync)
- **Auth**: Clerk (JWT tokens validated by Convex)
- **UI**: shadcn/ui components, Tailwind CSS
- **Build**: Vite 7, Bun package manager
- **Linting**: Biome

## Development Commands

```bash
bun run dev           # Start Convex + Vite dev servers concurrently
bun run dev:web       # Vite dev server only
bun run dev:convex    # Convex backend only
bun run build         # Deploy Convex + build Vite for production
bun run typecheck     # TypeScript validation
bun run lint          # Biome linting
bun run lint:fix      # Auto-fix Biome issues
bun run test          # Vitest watch mode
bun run test:run      # Vitest single run
```

## Architecture

### Routing (TanStack Router)
- File-based routing in `src/routes/`
- `_protected.tsx` wraps routes requiring authentication
- `$characterId.tsx` and `$guildId/` use dynamic route params
- Route tree auto-generated in `src/routeTree.gen.ts`

### Backend (Convex)
- All backend code lives in `convex/`
- `schema.ts` defines database tables and indexes
- Queries (read) and Mutations (write) in `characters.ts`, `guilds.ts`, `users.ts`
- HTTP endpoint for Clerk webhook in `http.ts`
- Use `useQuery` and `useMutation` from `convex/react` in components

### Key Tables
- **characters**: userId-owned gear tracking with adventureGear/dungeonGear arrays (16 slots each)
- **guilds**: Guild metadata with ownerId
- **guildMembers**: Membership with role (owner/member)
- **guildApplications**: Join requests with status
- **users**: Synced from Clerk via webhook

### State Management
- Server state via Convex React hooks (real-time subscribed)
- UI state via local React state (modals, toggles, forms)
- No Redux/Zustand - Convex handles data sync

## Convex Guidelines

When writing Convex functions:
- Always use the new function syntax with `args` and `returns` validators
- Use `v.null()` for functions that don't return a value
- Never use `filter()` in queries - define indexes and use `withIndex()`
- Use `internalQuery`/`internalMutation`/`internalAction` for private functions
- Import function references from `api` (public) or `internal` (private) in `_generated/api`
- Always validate user identity with `ctx.auth.getUserIdentity()` in mutations/queries that access user data

## Path Aliases

- `~/` maps to `src/` (e.g., `~/components/NavBar`)
- `@/` also maps to `src/`

## Character Gear Structure

Each character has `adventureGear` and `dungeonGear` arrays with 16 slots:
- Head, Neck, Shoulders, Chest, Back, Wrist, Gloves, Main Hand, Off Hand, Belt, Pants, Boots, Ring 1, Ring 2, Trinket 1, Trinket 2

Gear pieces contain: ilvl, secondaryStats, setBonus, legendary flag, quality

## Environment Variables

Required in `.env.local`:
- `VITE_CONVEX_URL` - Convex deployment URL
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk frontend key
- `CLERK_SECRET_KEY` - Clerk backend key
- `CLERK_WEBHOOK_SECRET` - For Clerk→Convex user sync
