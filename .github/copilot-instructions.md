# CardMystic - AI-Powered Magic: The Gathering Card Search

CardMystic is a Vue 3 + Nuxt 3 + TypeScript web application that provides AI-powered semantic search for Magic: The Gathering cards. Users can search using natural language queries like "blue creature that draws cards" instead of exact keywords. The app features a modern dark theme built with Vuetify and is deployed on Azure Static Web Apps.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Bootstrap, Build, and Test the Repository

Run these commands in order to set up the development environment:

```bash
# Copy environment configuration
cp .env_defaults .env

# Install dependencies
npm install
# Takes ~2 minutes. Shows Node version warnings (requires 22+, works with 20+) and Google Fonts fetch errors (safe to ignore).

# Build the application
npm run build
# Takes ~4 minutes. NEVER CANCEL. Set timeout to 10+ minutes. Google Fonts errors are expected due to network restrictions.

# Format code (always run before committing)
npm run format
# Takes ~2 seconds. Formats all files with Prettier.
```

### Development Server

```bash
# Start development server
npm run dev
# Takes ~3 seconds to start. Runs on http://localhost:5173
# Google Fonts fetch errors are expected and safe to ignore.
```

### Production Preview

```bash
# Preview production build (must build first)
npm run preview
# Runs built app on http://localhost:5173
```

### Linting

```bash
npm run lint
# Takes ~5 seconds. WARNING: Contains many existing errors in .nuxt generated files and some source files.
# These errors do NOT prevent the build from succeeding. Only fix lint errors in files you modify.
```

## Validation

### Always Manually Validate Changes

- **ALWAYS** test the development server after making code changes
- **ALWAYS** verify the search interface works by:
  1. Navigate to http://localhost:5173
  2. Type a test query like "blue creature that draws cards"
  3. Click Search and verify navigation to `/search?query=...` works
  4. Confirm the UI renders properly with dark theme
- **Backend API Note**: 502 errors in browser console are EXPECTED - this frontend connects to external backend services
- **ALWAYS** run `npm run format` before committing changes or the CI will fail

### Manual Testing Scenarios

Always test these scenarios when making UI changes:

- Home page loads with search interface and crystal ball logo
- Search functionality navigates correctly between AI Search and Similarity Search modes
- Filter panel expands/collapses properly
- Navigation between Home and About pages works
- Footer links are accessible and properly formatted
- Page is responsive and maintains dark theme styling

### Build Validation

- The build succeeds despite existing ESLint errors
- Google Fonts fetch failures are expected due to network restrictions
- Node.js version warnings (requires 22+) can be ignored if using 20+

## Key File Locations

### Core Application Files

- `/app.vue` - Root Vue component and layout
- `/nuxt.config.ts` - Main Nuxt configuration with Vuetify integration
- `/package.json` - Project dependencies and scripts

### Pages and Routing

- `/pages/index.vue` - Homepage with search interface
- `/pages/search/index.vue` - AI search results page
- `/pages/search/similarity.vue` - Similarity search page
- `/pages/card/[id].vue` - Individual card details page
- `/pages/about.vue` - About page

### Components

- `/components/search/Search.vue` - Main search component with input and filters
- `/components/search/Filters.vue` - Advanced search filters panel
- `/components/card.vue` - Card display component
- `/components/navbar.vue` - Top navigation bar
- `/components/footer.vue` - Site footer

### Configuration

- `/plugins/vuetify.ts` - Vuetify theme configuration (dark theme)
- `/plugins/vue-query.ts` - TanStack Vue Query setup
- `/eslint.config.js` - ESLint configuration
- `/.env_defaults` - Default environment variables template

### API and Data

- `/server/api/[...path].ts` - API proxy for backend requests
- `/models/` - TypeScript type definitions for cards, search, etc.
- `/composables/` - Vue composables for search types and page info

## Tech Stack Details

### Framework and Build

- **Framework**: Vue 3 with Composition API using `<script setup>` syntax
- **Meta-framework**: Nuxt 3 for SSR/SPA hybrid
- **Build Tool**: Vite (integrated with Nuxt)
- **Language**: TypeScript (strict mode enabled)

### UI and Styling

- **Component Library**: Vuetify 3 with Material Design Icons
- **Theme**: Custom dark theme with purple/blue accent colors
- **Icons**: Material Design Icons (@mdi/font) + mana symbols
- **Fonts**: Alfa Slab One from Google Fonts (may fail due to network restrictions)

### Data Management

- **HTTP Client**: TanStack Vue Query for caching and state management
- **Validation**: Zod schemas with VeeValidate for forms
- **Persistence**: Local storage for query caching (6 hour TTL)

### Code Quality

- **Linting**: ESLint with TypeScript support and Vue plugin
- **Formatting**: Prettier with opinionated config
- **Git Hooks**: Format and lint on commit (configured in CI)

## Common Development Tasks

### Adding New Components

- Use Vue 3 Composition API with `<script setup lang="ts">`
- Follow existing component patterns in `/components/`
- Import Vuetify components as needed: `import { VCard, VBtn } from 'vuetify/components'`

### Modifying Search Features

- Search logic is in `/components/search/Search.vue`
- Filters are in `/components/search/Filters.vue`
- Search types (AI vs Similarity) managed by `/composables/useSearchType.ts`
- API calls go through `/server/api/[...path].ts` proxy

### Styling Changes

- Custom theme defined in `/plugins/vuetify.ts`
- Global styles in `/app.vue`
- Component-scoped styles preferred over global CSS
- Use Vuetify's theme colors: `primary`, `secondary`, `surface`, etc.

### Adding New Pages

- Create `.vue` files in `/pages/` directory
- Nuxt auto-generates routes based on file structure
- Use `definePageMeta()` for page-specific configuration
- Layout is defined in `/layouts/default.vue`

## Deployment and CI

### Azure Static Web Apps

- **Production**: Deploys from `main` branch to cardmystic.com
- **Staging**: Deploys from `dev` branch to staging environment
- **PR Previews**: Automatic preview deployments for pull requests
- **Configuration**: `.github/workflows/azure-web-app-deployment.yml`

### Build Settings

- **App Location**: `/` (repository root)
- **API Location**: `.output/server` (Nuxt server functions)
- **Output Location**: `.output/public` (static assets)
- **Node Version**: Requires 22+ (warns on 20+ but still works)

### Environment Variables

- Development: Copy `.env_defaults` to `.env`
- Production: Set `NUXT_BACKEND_URL` in Azure Static Web Apps configuration
- Port: Uses `NUXT_PORT` (defaults to 5173)

## Troubleshooting

### Common Issues

- **Google Fonts errors**: Expected due to network restrictions, app works fine without them
- **Node version warnings**: App works with Node 20+ despite requiring 22+
- **ESLint errors**: Many exist in generated files, only fix errors in files you modify
- **502 Backend errors**: Expected when backend services are not running
- **Hydration mismatches**: Common with Vuetify SSR, usually harmless

### Performance Notes

- **Build time**: ~4 minutes (normal for Nuxt + Vuetify)
- **Dev server startup**: ~3 seconds
- **Hot reload**: Fast (<1 second) for most changes
- **Bundle size**: ~4.5MB total output (optimized with code splitting)

### Development Tips

- Use Nuxt DevTools (Shift + Alt + D) for debugging
- TanStack Query DevTools available for API state inspection
- Vue DevTools work in development mode
- TypeScript strict mode enabled - fix type errors before committing
