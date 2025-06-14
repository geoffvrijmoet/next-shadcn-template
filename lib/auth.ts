import { auth } from '@clerk/nextjs/server';

export function requireOrg() {
  const { orgId, userId } = auth();
  if (!orgId && !userId) {
    throw new Error('Unauthenticated');
  }
  // Use orgId when available, else fallback to userId for single-tenant users
  return orgId ?? userId!;
}