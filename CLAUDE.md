# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **"Strava Wheel"** - a Vue 3 + TypeScript web application that integrates with Strava's API and OpenAI to generate AI-powered, witty reviews of athletic activities. The app features OAuth authentication, activity dashboards, and sophisticated Three.js animations.

## Development Commands

```bash
# Install dependencies
pnpm install

# Development server
pnpm dev

# Production build
pnpm build

# Preview production build
pnpm preview
```

**Package Manager**: This project exclusively uses `pnpm` (see `pnpm-lock.yaml`). Do not use `npm` or `yarn`.

## Architecture

### Core Stack
- **Vue 3.5** with Composition API and `<script setup>` syntax throughout
- **TypeScript** with strict mode enabled and multi-config setup
- **Vite** using `rolldown-vite` for optimized builds
- **Pinia** for centralized state management
- **Vue Router 4** with hash-based routing (`createWebHashHistory`)

### UI Framework
- **Tailwind CSS 4** with Vite plugin integration
- **shadcn/vue** component library (New York style, stone base color)
- **Reka UI** for accessible components
- **Lucide Vue** for icons
- **Vue Sonner** for toast notifications

### Key Integrations
- **Strava OAuth 2.0**: Complete authentication flow with token refresh
- **OpenAI SDK**: Custom browser-compatible type definitions in `src/types/openai.d.ts`
- **Three.js**: Sophisticated 3D shader animations on the home page

## Project Structure

```
src/
├── components/ui/      # shadcn/vue UI components (20+ components)
├── view/               # Page-level components (Home, Login, Activities)
├── stores/             # Pinia stores (strava.ts for auth + OpenAI settings)
├── router/             # Vue Router configuration
├── lib/                # Utility functions (Tailwind cn() utility)
├── types/              # TypeScript definitions (OpenAI types)
└── assets/             # Static assets
```

## State Management

The `useStravaStore` (`src/stores/strava.ts`) manages:
- **Strava Authentication**: OAuth tokens, athlete data, automatic persistence
- **OpenAI Configuration**: Model, API key, base URL, and customizable system prompts
- **Session Persistence**: All state automatically saved to localStorage

Key types:
- `TokenPayload`: Strava OAuth token structure
- `WheelSettings`: OpenAI configuration (model, baseUrl, apiKey, systemPrompt)

## Component Architecture

### UI Components
- Located in `src/components/ui/`
- All shadcn/vue components with consistent theming
- Use `class-variance-authority` for variant management
- Responsive design with Tailwind utilities

### Page Components
- **Home.vue**: Landing page with Three.js animation and theme toggle
- **Login.vue**: Strava OAuth authentication flow
- **Activities.vue**: Main dashboard with activity listing and AI review generation

### Key Patterns
- Composition API with `<script setup>` throughout
- Extensive use of Vue 3 reactivity (`ref`, `watch`, `computed`)
- Form validation with VeeValidate + Zod schemas
- Error boundaries and comprehensive loading states

## Authentication Flow

Strava OAuth implementation:
1. Redirect to Strava authorization
2. Handle callback with authorization code
3. Exchange tokens (access + refresh)
4. Store tokens with expiration tracking
5. Automatic token refresh on expiration
6. Persistent session management

## AI Integration

OpenAI integration for generating activity reviews:
- Custom browser-compatible OpenAI types
- Configurable system prompts for review style
- Error handling for API failures
- Activity analysis with Strava data context

## Development Notes

### Path Aliases
- `@/*` maps to `src/*` for clean imports
- Configured in both `vite.config.ts` and TypeScript configs

### Build System
- Uses `rolldown-vite` for faster builds
- TypeScript compilation with `vue-tsc -b && vite build`
- Strict TypeScript mode enabled

### Styling
- Tailwind CSS 4 with Vite plugin
- Dark/light theme support via CSS variables
- Consistent design system with shadcn/vue

## Testing

**No testing framework is currently set up.** Consider adding:
- Vitest for unit/integration testing
- Vue Test Utils for component testing
- Playwright or Cypress for E2E testing

## API Integration Details

### Strava API
- OAuth 2.0 flow with PKCE
- Activity fetching with pagination
- Token refresh automation
- Publishing AI reviews back to activities

### OpenAI API
- Browser-compatible implementation
- Custom type definitions for SDK compatibility
- Configurable model selection and prompts
- Error handling for rate limits and failures