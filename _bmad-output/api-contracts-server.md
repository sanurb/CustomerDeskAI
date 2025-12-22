# API Contracts - Server

**Generated:** 2025-12-21
**Part:** server (Backend API)
**Framework:** Elysia + oRPC
**Type Safety:** End-to-end with TypeScript

---

## Overview

The server exposes a type-safe RPC API using oRPC, which provides automatic type inference from server to client. All endpoints are accessible via `/rpc` and documented via OpenAPI at `/api-reference`.

---

## API Endpoints

### Health Check

**Endpoint:** `healthCheck`
**Method:** GET (via RPC)
**Auth:** Public
**Description:** Health check endpoint for monitoring

**Response:**
```typescript
"OK"
```

---

### Private Data

**Endpoint:** `privateData`
**Method:** GET (via RPC)
**Auth:** Protected (requires authentication)
**Description:** Returns private data for authenticated users

**Response:**
```typescript
{
  message: string;
  user: {
    id: string;
    email: string;
    name: string;
    // ... other user fields
  } | undefined;
}
```

---

## Todo Router

All todo endpoints are under the `todo` namespace.

### Get All Todos

**Endpoint:** `todo.getAll`
**Method:** GET (via RPC)
**Auth:** Public
**Description:** Retrieves all todos from the database

**Response:**
```typescript
Array<{
  id: number;
  text: string;
  completed: boolean;
}>
```

---

### Create Todo

**Endpoint:** `todo.create`
**Method:** POST (via RPC)
**Auth:** Public
**Description:** Creates a new todo item

**Request:**
```typescript
{
  text: string; // min length: 1
}
```

**Response:**
```typescript
// Insert result from Drizzle ORM
```

**Validation:**
- `text` must be a non-empty string

---

### Toggle Todo

**Endpoint:** `todo.toggle`
**Method:** PUT (via RPC)
**Auth:** Public
**Description:** Toggles the completed status of a todo

**Request:**
```typescript
{
  id: number;
  completed: boolean;
}
```

**Response:**
```typescript
// Update result from Drizzle ORM
```

**Validation:**
- `id` must be a valid number
- `completed` must be a boolean

---

### Delete Todo

**Endpoint:** `todo.delete`
**Method:** DELETE (via RPC)
**Auth:** Public
**Description:** Deletes a todo by ID

**Request:**
```typescript
{
  id: number;
}
```

**Response:**
```typescript
// Delete result from Drizzle ORM
```

**Validation:**
- `id` must be a valid number

---

## Authentication

### Better-Auth Integration

Authentication is handled via Better-Auth with the following endpoints exposed at `/api/auth/*`:

- Sign in/Sign up flows
- Session management
- Email verification
- Password reset
- OAuth providers (if configured)

**Session Context:**
Protected procedures have access to `context.session` which includes:
- `user`: Current user object
- `session`: Active session data
- `activeOrganizationId`: Current tenant context (if applicable)

---

## Type Safety

All endpoints are fully type-safe using oRPC:

1. **Input Validation:** Zod schemas validate all inputs
2. **Type Inference:** Client automatically inherits types from server
3. **Return Types:** Response types are inferred from handlers

Example client usage:
```typescript
import { client } from "@/utils/orpc";

// Fully typed, autocomplete works
const todos = await client.todo.getAll();
//    ^? Array<{ id: number; text: string; completed: boolean; }>

await client.todo.create({ text: "New todo" });
//                         ^? Type-checked input
```

---

## Error Handling

All endpoints use standard oRPC error handling:
- Input validation errors return 400 with Zod error details
- Authentication errors return 401
- Database errors propagate as 500 errors

---

## CORS Configuration

CORS is configured via `@elysiajs/cors` to allow requests from the frontend origin (`http://localhost:3001` in development).

---

## OpenAPI Documentation

Interactive API documentation is available at:
- **Development:** `http://localhost:3000/api-reference`

The OpenAPI spec is automatically generated from oRPC router definitions.
