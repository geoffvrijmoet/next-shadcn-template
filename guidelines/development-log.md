# Development Log

This file serves as both a **to-do list for AI agents** and a **comprehensive guide** to understanding how this Next.js + shadcn/ui template works. AI agents should treat questions written here as actionable tasks and update this log after making changes.

## 🎯 Current To-Do Items / Questions for AI

*AI agents: Treat items in this section as your task list. Remove completed items and add new ones as needed.*

- [ ] Integrations backend: Design database schema (Prisma + PostgreSQL) for integrations and evidence graph
- [ ] API routes for managing integrations
- [ ] Server-side evidence ingestion workers (placeholder)
- [ ] Implement authentication-protected API endpoints for gaps and policies
- [ ] Flesh out Settings page with organization profile, API keys, billing info
- [ ] Replace dummy data in Dashboard with real API calls once backend is ready

<!-- Example format for new tasks:
- [ ] **Task Title**: Description of what needs to be done
- [ ] **Question**: What specific functionality should be implemented?
-->

## 📋 Recently Completed Tasks

### ✅ Compliance Dashboard Skeleton (Latest)
**Description**: Added initial UI skeleton for compliance platform including integrations grid, gap table, and policy generator.

**Files Created/Modified**:
- `app/dashboard/page.tsx` - Main compliance dashboard page
- `components/IntegrationStatusCard.tsx` - Reusable card for integration connection status
- `components/GapTable.tsx` - Table listing control gaps
- `components/PolicyGenerator.tsx` - Interactive policy generator widget
- `app/settings/page.tsx` - Placeholder settings route
- `components/main-nav.tsx` (existing) - Already included /dashboard and /settings links

**Architecture Details**:
- **Integrations Grid**: Displays connection status for GitHub, AWS, etc. Supports connect/disconnect actions (stubbed handlers)
- **Control Gaps**: Table visualizing unresolved compliance gaps with severity coloring
- **Policy Generator**: Simulates policy generation progress with Tailwind progress bar and button interactions
- **Routing**: Middleware continues to enforce authentication for all non-public routes, so dashboard is protected

### ✅ Unauthorized Sign-In Page & Cursor Rules (Latest)
**Description**: Created unauthorized sign-in page for Clerk security redirects and comprehensive cursor rules for business management system.

**Files Created/Modified**:
- `app/unauthorized-sign-in/page.tsx` - Security page for unauthorized access attempts
- `CURSOR_RULES_SUGGESTIONS.md` - Comprehensive cursor rules for business management web app

**Architecture Details**:
- **Security Page**: Clean, accessible design with proper error messaging and user guidance
- **Cursor Rules**: Comprehensive rules covering business logic, multi-project management, template generation, security, and AI interaction patterns
- **Business Context**: Rules designed specifically for a holding company management system that generates project templates

### ✅ Template Suggestions System
**Description**: Implemented a complete system for collecting and displaying suggestions from other web applications.

**Files Created/Modified**:
- `lib/models/TemplateSuggestion.ts` - Data model interfaces
- `lib/mongodb.ts` - MongoDB connection utility
- `app/api/suggestions/route.ts` - POST/GET API endpoints
- `components/TemplateSuggestions.tsx` - React component for displaying suggestions
- `app/page.tsx` - Added suggestions component to main page
- `API_DOCUMENTATION.md` - Complete API documentation

**Architecture Details**:
- **MongoDB Collection**: `template_suggestions` in `next-shadcn-template` database
- **API Endpoints**: `/api/suggestions` (POST for submit, GET for fetch)
- **Data Flow**: External apps → POST API → MongoDB → GET API → React component → UI
- **Key Features**: Filtering, pagination, priority badges, code examples, responsive design

### ✅ MongoDB Infrastructure & TypeScript Fixes (Latest)
**Description**: Added MongoDB models for `integrations` and `evidence`, authentication helper, and addressed TypeScript config issues.

**Files Created/Modified**:
- `next-env.d.ts` - Ensures React/Node/Next types
- `lib/models/Integration.ts` - Mongo collection + helpers
- `lib/models/Evidence.ts` - Mongo collection + helpers
- `lib/auth.ts` - Helper to obtain org identifier from Clerk
- `components/*`, `app/dashboard/page.tsx`, `components/PolicyGenerator.tsx` - Typing refinements

**Architecture Details**:
- **Integrations Collection**: `{ orgId, name, status, config, lastSyncedAt }` with unique index on `(orgId, name)`
- **Evidence Collection**: `{ orgId, integrationId, controlId, description, artifactPath, collectedAt }` indexed on `orgId`, `integrationId`, `controlId`
- **Auth Helper**: `requireOrg()` centralises retrieval of `orgId || userId` for DB access guards

---

## 🏗️ Web App Architecture Guide

### 📂 Project Structure
```
├── app/                     # Next.js App Router
│   ├── api/                # API routes
│   │   └── suggestions/    # Template suggestions endpoints
│   ├── page.tsx           # Main dashboard page
│   └── layout.tsx         # Root layout with providers
├── components/            # Reusable React components
│   ├── ui/               # shadcn/ui components
│   └── TemplateSuggestions.tsx  # Suggestions display component
├── lib/                  # Utility libraries
│   ├── models/          # TypeScript interfaces/models
│   ├── mongodb.ts       # Database connection
│   └── utils.ts         # General utilities
└── guidelines/          # Documentation and development guides
```

### 🗄️ Database Architecture

**MongoDB Database**: `next-shadcn-template`

**Collections**:
- `template_suggestions`: Stores suggestions from external applications
  - Fields: title, description, category, submitterName, submitterUrl, codeExample, implementationNotes, priority, status, tags, createdAt, updatedAt
  - Indexes: Recommended on `status`, `category`, `createdAt` for performance

### 🔌 API Architecture

**Base URL**: `/api/`

**Endpoints**:
1. **POST /api/suggestions**
   - Purpose: Accept suggestions from external web apps
   - Authentication: None (public endpoint)
   - Rate Limiting: Not implemented (consider adding)
   - Validation: Required fields checked server-side

2. **GET /api/suggestions**
   - Purpose: Fetch suggestions with filtering/pagination
   - Query Parameters: status, category, limit, skip
   - Response: Paginated results with metadata

### 🎨 Frontend Architecture

**Framework**: Next.js 14 with App Router  
**Styling**: Tailwind CSS  
**UI Components**: shadcn/ui  
**State Management**: React useState (local state)  
**Authentication**: Clerk (configured but not used for suggestions)

**Key Components**:
- `TemplateSuggestions`: Main component for displaying suggestions
  - Features: Filtering, loading states, responsive grid, code examples
  - Data fetching: Client-side with useEffect
  - Styling: Tailwind with responsive design

### 🔧 Development Patterns

**File Naming**: 
- Components: PascalCase (`TemplateSuggestions.tsx`)
- API routes: lowercase (`route.ts`)
- Utilities: camelCase (`mongodb.ts`)

**TypeScript Usage**:
- Strict typing enabled
- Interfaces in `/lib/models/`
- Proper error handling with try/catch

**Error Handling**:
- API: HTTP status codes with descriptive error messages
- Frontend: Console errors, loading states, empty states

### 🚀 Deployment Considerations

**Environment Variables Required**:
- `MONGODB_URI`: MongoDB connection string
- Other Clerk variables for authentication (if used)

**Database Initialization**:
- Collections are created automatically on first document insert
- No migrations required for current schema

### 🔍 How to Find and Modify Features

**To find suggestion-related code**:
```bash
# Search for collection usage
grep -r "template_suggestions" .

# Search for API endpoints
find . -path "*/api/*" -name "*.ts"

# Search for suggestion components
find . -name "*Suggestion*"
```

**To modify the suggestions system**:
1. **Data Model**: Edit `lib/models/TemplateSuggestion.ts`
2. **API Logic**: Edit `app/api/suggestions/route.ts`
3. **UI Display**: Edit `components/TemplateSuggestions.tsx`
4. **Database**: Update MongoDB queries as needed

**To add new features**:
1. Define TypeScript interfaces in `/lib/models/`
2. Create API routes in `/app/api/`
3. Build React components in `/components/`
4. Update this development log with architecture details

### 📝 Code Style Guidelines

- Use TypeScript for all new files
- Follow ESLint rules (fix linter errors before committing)
- Use Tailwind for styling (avoid custom CSS)
- Implement proper error handling
- Add loading and empty states for user interactions
- Use semantic HTML and accessibility features

### 🔄 Maintenance Tasks

**Regular Updates Needed**:
- Monitor API usage and add rate limiting if needed
- Consider adding authentication for admin features
- Add database indexes as collection grows
- Update dependencies regularly

**Performance Optimizations**:
- Add database indexes for frequently queried fields
- Implement caching for suggestion data
- Add loading skeletons for better UX
- Consider server-side rendering for initial suggestions

---

## 💡 Notes for AI Agents

**When updating this log**:
1. Add completed tasks to the "Recently Completed Tasks" section
2. Update architecture details if you modify core systems
3. Remove completed items from the "To-Do Items" section
4. Add new to-do items when users request features
5. Keep the architecture guide current with actual implementation

**When working on the codebase**:
1. Always check this log first to understand existing architecture
2. Follow the established patterns documented here
3. Update this log after making significant changes
4. Use the search patterns provided to find relevant code quickly

**For debugging**:
1. Check API endpoints with the examples in `API_DOCUMENTATION.md`
2. Verify MongoDB connection and collection names
3. Look for TypeScript errors in models and interfaces
4. Test responsive design on different screen sizes 