import bcrypt from "bcryptjs";
import { User } from "@prisma/client";
import { prisma } from "../../config/prisma";

/**
 * Abstraction over "how do we verify a login". Today this checks the local
 * seeded user table; swapping in RMS SSO/LDAP later means adding a new
 * implementation here without touching routes/controllers.
 */
export interface AuthProvider {
  verify(username: string, password: string): Promise<User | null>;
}

export class LocalMockProvider implements AuthProvider {
  async verify(username: string, password: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !user.active) return null;
    const ok = await bcrypt.compare(password, user.passwordHash);
    return ok ? user : null;
  }
}

export const authProvider: AuthProvider = new LocalMockProvider();
