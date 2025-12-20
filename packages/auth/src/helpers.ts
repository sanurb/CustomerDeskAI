import { db } from "@CustomerDeskAI/db/client";
import { tenants, tenantUsers } from "@CustomerDeskAI/db/schema/nile";
import { and, eq } from "drizzle-orm";

/**
 * Membership resolution helpers
 * Centralized location for tenant and membership lookups
 * DO NOT scatter this logic across the codebase
 */

/**
 * Resolve tenant by slug
 * @param slug - Tenant slug (public identifier)
 * @returns Tenant record or null if not found
 */
export async function resolveTenantBySlug(slug: string): Promise<{
  id: string;
  name: string;
  slug: string | null;
  logo: string | null;
} | null> {
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.slug, slug),
    columns: {
      id: true,
      name: true,
      slug: true,
      logo: true,
    },
  });

  return tenant ?? null;
}

/**
 * Get membership for a user in a tenant
 * @param tenantId - Tenant UUID
 * @param userId - User ID
 * @returns Membership record or null if not a member
 */
export async function getMembership(
  tenantId: string,
  userId: string
): Promise<{
  id: string;
  tenant_id: string;
  user_id: string;
  roles: string[];
} | null> {
  const membership = await db.query.tenantUsers.findFirst({
    where: and(
      eq(tenantUsers.tenant_id, tenantId),
      eq(tenantUsers.user_id, userId)
    ),
    columns: {
      id: true,
      tenant_id: true,
      user_id: true,
      roles: true,
    },
  });

  return membership ?? null;
}

/**
 * Check if membership has a specific role
 * @param membership - Membership record (nullable)
 * @param role - Role to check
 * @returns true if membership has role, false otherwise
 */
export function hasRole(
  membership: { roles: string[] } | null,
  role: string
): boolean {
  return membership?.roles.includes(role) ?? false;
}

/**
 * Check if membership has any of the specified roles
 * @param membership - Membership record (nullable)
 * @param roles - Roles to check
 * @returns true if membership has any role, false otherwise
 */
export function hasAnyRole(
  membership: { roles: string[] } | null,
  roles: string[]
): boolean {
  return roles.some((role) => hasRole(membership, role));
}
