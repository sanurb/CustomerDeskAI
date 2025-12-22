# Development Guide

**Generated:** 2025-12-21
**For:** CustomerDeskAI Monorepo
**Audience:** Developers joining the project

---

## Prerequisites

### Required Software

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | 20.x+ | JavaScript runtime |
| **pnpm** | 10.23.0+ | Package manager |
| **Bun** | Latest | Server runtime (optional for local dev) |
| **Docker** | Latest | PostgreSQL container |
| **Git** | 2.x+ | Version control |

### Optional Tools
- **Drizzle Studio** - Visual database browser (included)
- **PostgreSQL Client** - Direct DB access (psql, TablePlus, etc.)

---

## Initial Setup

### 1. Clone and Install

```bash
# Clone repository
git clone <repository-url>
cd CustomerDeskAI

# Install dependencies (all workspaces)
pnpm install
```

**Note:** First install takes 2-5 minutes depending on network speed.

---

### 2. Environment Configuration

#### Create Environment Files

**`apps/server/.env`:**
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/customerdeskai"
CORS_ORIGIN="http://localhost:3001"
BETTER_AUTH_SECRET="your-secret-key-min-32-chars"
BETTER_AUTH_URL="http://localhost:3000"
GOOGLE_API_KEY="your-google-api-key"
```

**`apps/web/.env.local`:**
```bash
NEXT_PUBLIC_SERVER_URL="http://localhost:3000"
```

#### Generate Secrets
```bash
# Generate BETTER_AUTH_SECRET
openssl rand -base64 32
```

---

### 3. Database Setup

#### Option A: Docker (Recommended)
```bash
# Start PostgreSQL container
pnpm db:start

# Push schema to database
pnpm db:push

# Verify with Drizzle Studio
pnpm db:studio
```

#### Option B: Local PostgreSQL
```bash
# Create database
createdb customerdeskai

# Update DATABASE_URL in apps/server/.env
DATABASE_URL="postgresql://localhost:5432/customerdeskai"

# Push schema
pnpm db:push
```

---

## Development Workflow

### Starting Development Servers

#### All Apps (Recommended)
```bash
pnpm dev
```

This starts:
- **web** on http://localhost:3001
- **server** on http://localhost:3000
- **fumadocs** on http://localhost:4000

#### Individual Apps
```bash
pnpm dev:web       # Frontend only
pnpm dev:server    # Backend only
```

---

### Code Quality Commands

```bash
# Format code (Ultracite/Biome)
pnpm format

# Lint code
pnpm lint

# Type check all workspaces
pnpm check-types

# Run all checks (recommended before commit)
pnpm format && pnpm check-types
```

---

## Database Operations

### Schema Changes

#### Development Workflow
```bash
# 1. Modify schema files in packages/db/src/schema/

# 2. Push changes directly (development)
pnpm db:push

# 3. Open Drizzle Studio to verify
pnpm db:studio
```

#### Production Workflow
```bash
# 1. Generate migration
pnpm db:generate

# 2. Review migration in packages/db/drizzle/
# 3. Apply migration
pnpm db:migrate
```

### Database Management

```bash
# Start PostgreSQL
pnpm db:start

# View logs
pnpm db:watch

# Stop PostgreSQL
pnpm db:stop

# Stop and remove containers
pnpm db:down

# Open visual database browser
pnpm db:studio
```

### Direct Database Access

Using Nile credentials (from env):
```bash
DATABASE_URL="postgres://019b2816-ea84-7158-b8dc-c208136e53a7:c0de12a7-b95f-44ec-bf3e-da608c1194c3@us-west-2.db.thenile.dev:5432/pw_wallets"

# Via psql
PGPASSWORD="c0de12a7-b95f-44ec-bf3e-da608c1194c3" psql -h us-west-2.db.thenile.dev -U 019b2816-ea84-7158-b8dc-c208136e53a7 -d pw_wallets
```

---

## Adding Features

### New API Endpoint

**1. Define Schema & Handler** (`packages/api/src/routers/feature.ts`):
```typescript
import { z } from "zod";
import { publicProcedure, protectedProcedure } from "../index";

export const featureRouter = {
  getData: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      // Access user via context.session
      return { data: "result" };
    }),
};
```

**2. Mount Router** (`packages/api/src/routers/index.ts`):
```typescript
import { featureRouter } from "./feature";

export const appRouter = {
  // existing routers...
  feature: featureRouter,
};
```

**3. Use in Frontend** (`apps/web/`):
```typescript
import { orpc } from "@/utils/orpc";

// Fully typed, autocomplete works!
const { data } = orpc.feature.getData.useQuery({ id: "123" });
```

---

### New Database Table

**1. Define Schema** (`packages/db/src/schema/feature.ts`):
```typescript
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const feature = pgTable("feature", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
```

**2. Export Schema** (`packages/db/src/schema/index.ts`):
```typescript
export * from "./feature";
```

**3. Push to Database:**
```bash
pnpm db:push
```

**4. Use in API:**
```typescript
import { db } from "@CustomerDeskAI/db/client";
import { feature } from "@CustomerDeskAI/db/schema/feature";

await db.select().from(feature);
```

---

### New UI Component

**1. Create Component** (`apps/web/src/components/FeatureCard.tsx`):
```typescript
interface FeatureCardProps {
  title: string;
  description: string;
}

export function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <div className="border rounded p-4">
      <h3 className="font-bold">{title}</h3>
      <p>{description}</p>
    </div>
  );
}
```

**2. Use in Page** (`apps/web/src/app/page.tsx`):
```typescript
import { FeatureCard } from "@/components/FeatureCard";

export default function HomePage() {
  return <FeatureCard title="Feature" description="Description" />;
}
```

---

## Package Management

### Adding Dependencies

```bash
# To specific workspace
pnpm add <package> --filter web
pnpm add <package> --filter server
pnpm add -D <package> --filter api

# To root workspace
pnpm add <package> -w

# Examples
pnpm add lodash --filter server
pnpm add -D @types/lodash --filter server
```

### Removing Dependencies

```bash
pnpm remove <package> --filter <workspace>
```

### Listing Dependencies

```bash
pnpm list --filter web
```

---

## Testing

### Running Tests

**Note:** Test framework not yet configured. Recommended setup:

#### For Backend (Bun)
```bash
bun test  # Uses bun:test (built-in)
```

#### For Frontend (Vitest)
```bash
pnpm test --filter web
```

### Writing Tests

**Example Test** (`packages/api/src/routers/todo.test.ts`):
```typescript
import { describe, it, expect } from "bun:test";
import { todoRouter } from "./todo";

describe("Todo Router", () => {
  it("should create a todo", async () => {
    // Test implementation
  });
});
```

---

## Debugging

### Frontend (Next.js)

**Chrome DevTools:**
1. Open http://localhost:3001
2. Press F12
3. Use React DevTools extension
4. Check Network tab for API calls

**VS Code Debugging:**
- Add Next.js debug configuration
- Set breakpoints in `.tsx` files
- Press F5 to start debugging

---

### Backend (Elysia/Bun)

**Console Logging:**
```typescript
console.log("Debug info:", data);
```

**Bun Debugger:**
```bash
bun --inspect src/index.ts
```

Then attach Chrome DevTools to `chrome://inspect`.

---

## Common Issues & Solutions

### Issue: pnpm install fails

**Solution:**
```bash
# Clear cache and reinstall
pnpm store prune
rm -rf node_modules
pnpm install
```

---

### Issue: Database connection refused

**Solutions:**
1. Check PostgreSQL is running: `pnpm db:start`
2. Verify DATABASE_URL in `.env`
3. Check Docker container: `docker ps`

---

### Issue: Type errors after dependency update

**Solution:**
```bash
# Rebuild TypeScript types
pnpm check-types

# Restart TS server in VS Code
Cmd+Shift+P → "TypeScript: Restart TS Server"
```

---

### Issue: Hot reload not working

**Solutions:**
1. **Frontend:** Restart dev server: `pnpm dev:web`
2. **Backend:** Bun hot reload is automatic, check terminal for errors

---

## Build for Production

### Full Build
```bash
# Build all apps
pnpm build
```

### Individual Builds
```bash
pnpm build --filter web
pnpm build --filter server
```

### Build Outputs
- **web:** `apps/web/.next/`
- **server:** `apps/server/dist/`
- **fumadocs:** `apps/fumadocs/.next/`

---

## Git Workflow

### Recommended Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes, check types
pnpm check-types

# Format code
pnpm format

# Commit
git add .
git commit -m "feat: add new feature"

# Push
git push origin feature/new-feature
```

### Commit Message Convention

```
feat: add new feature
fix: resolve bug
chore: update dependencies
docs: update README
refactor: restructure code
test: add tests
```

---

## Performance Tips

### Development
1. Use `pnpm dev:web` or `pnpm dev:server` if you only need one app
2. Close unused browser tabs to free memory
3. Use Turbo's caching: subsequent builds are faster

### Production
1. Enable Next.js image optimization
2. Use Bun's `--compile` for server binary
3. Enable Turbo's remote caching for CI

---

## Getting Help

### Documentation
- [Project Overview](./project-overview.md)
- [API Contracts](./api-contracts-server.md)
- [Data Models](./data-models.md)

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Elysia Documentation](https://elysiajs.com)
- [Drizzle ORM](https://orm.drizzle.team)
- [oRPC Documentation](https://orpc.dev)

### Team Communication
- Check existing docs in `memory/docs/`
- Review task plans in `memory/tasks/`
