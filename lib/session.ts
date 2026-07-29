import { auth } from "@/lib/auth";

/**
 * All admin CRUD and the print page operate within the logged-in user's own
 * Company. SUPER_ADMIN (multi-company management) is defined in the schema
 * for future use but has no dedicated UI yet — every route here assumes a
 * COMPANY_ADMIN-style session with a companyId.
 */
export async function requireCompanySession() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  if (!session.user.companyId) {
    throw new Error("Akun ini belum terhubung ke company mana pun.");
  }
  return { session, companyId: session.user.companyId };
}
