import { UserRole } from "@/lib/generated/prisma/client";

declare module "next-auth" {
  interface User {
    role: UserRole;
    companyId: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      role: UserRole;
      companyId: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    companyId?: string | null;
  }
}
