import { getAdminByEmail } from "./db.server";

export async function requireAdmin(email: string, passwordHash: string, superOnly = false) {
  const admin = await getAdminByEmail(email);
  if (!admin || admin.passwordHash !== passwordHash) throw new Error("Não autorizado");
  if (superOnly && !admin.isSuperAdmin) throw new Error("Não autorizado");
  return admin;
}
