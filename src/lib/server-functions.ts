import { createServerFn } from "@tanstack/react-start";
import { Participant } from "./types";

export const registerParticipant = createServerFn({ method: "POST" })
  .validator((data: Omit<Participant, "id" | "createdAt">) => data)
  .handler(async ({ data }) => {
    const { addParticipant } = await import("./db.server");
    try {
      const newParticipant = await addParticipant(data);
      return { success: true, participant: newParticipant };
    } catch (error: any) {
      return { success: false, error: error.message || "Erro desconhecido." };
    }
  });

export const loginAdmin = createServerFn({ method: "POST" })
  .validator((credentials: { email: string; password: string }) => credentials)
  .handler(async ({ data: { email, password } }) => {
    const { getAdminByEmail, hashPassword } = await import("./db.server");
    const admin = await getAdminByEmail(email);

    if (!admin) {
      return { success: false, error: "E-mail ou senha incorretos." };
    }

    const hashedInput = hashPassword(password);
    if (admin.passwordHash !== hashedInput) {
      return { success: false, error: "E-mail ou senha incorretos." };
    }

    return {
      success: true,
      email: admin.email,
      passwordHash: admin.passwordHash,
      isTempPassword: admin.isTempPassword,
      isSuperAdmin: admin.isSuperAdmin,
    };
  });

export const changeAdminPassword = createServerFn({ method: "POST" })
  .validator((payload: { email: string; passwordHash: string; newPassword: string }) => payload)
  .handler(async ({ data: { email, passwordHash, newPassword } }) => {
    const { getAdminByEmail, updateAdminPassword, hashPassword } = await import("./db.server");
    const admin = await getAdminByEmail(email);

    if (!admin || admin.passwordHash !== passwordHash) {
      return { success: false, error: "Sessão inválida ou não autorizada." };
    }

    if (newPassword.length < 6) {
      return { success: false, error: "A nova senha deve ter no mínimo 6 caracteres." };
    }

    const newHash = hashPassword(newPassword);
    await updateAdminPassword(email, newHash, false);

    return {
      success: true,
      passwordHash: newHash,
    };
  });

export const getParticipants = createServerFn({ method: "GET" })
  .validator((credentials: { email: string; passwordHash: string }) => credentials)
  .handler(async ({ data: { email, passwordHash } }) => {
    const { getAdminByEmail, readParticipants } = await import("./db.server");
    const admin = await getAdminByEmail(email);
    if (!admin || admin.passwordHash !== passwordHash) {
      throw new Error("Não autorizado");
    }
    return await readParticipants();
  });

export const deleteParticipantFn = createServerFn({ method: "POST" })
  .validator((payload: { email: string; passwordHash: string; id: string }) => payload)
  .handler(async ({ data: { email, passwordHash, id } }) => {
    const { getAdminByEmail, deleteParticipant } = await import("./db.server");
    const admin = await getAdminByEmail(email);
    if (!admin || admin.passwordHash !== passwordHash) {
      throw new Error("Não autorizado");
    }
    const success = await deleteParticipant(id);
    return { success };
  });

export const getAdmins = createServerFn({ method: "GET" })
  .validator((credentials: { email: string; passwordHash: string }) => credentials)
  .handler(async ({ data: { email, passwordHash } }) => {
    const { getAdminByEmail, listAdminsDb } = await import("./db.server");
    const admin = await getAdminByEmail(email);
    if (!admin || admin.passwordHash !== passwordHash || !admin.isSuperAdmin) {
      throw new Error("Não autorizado");
    }
    return await listAdminsDb();
  });

export const createAdminFn = createServerFn({ method: "POST" })
  .validator(
    (payload: {
      email: string;
      passwordHash: string;
      newAdminEmail: string;
      isSuperAdmin: boolean;
    }) => payload
  )
  .handler(async ({ data: { email, passwordHash, newAdminEmail, isSuperAdmin } }) => {
    const { getAdminByEmail, createAdminDb } = await import("./db.server");
    const admin = await getAdminByEmail(email);
    if (!admin || admin.passwordHash !== passwordHash || !admin.isSuperAdmin) {
      return { success: false, error: "Não autorizado" };
    }
    try {
      const result = await createAdminDb(newAdminEmail, isSuperAdmin);
      return { success: true, admin: result };
    } catch (error: any) {
      return { success: false, error: error.message || "Erro desconhecido" };
    }
  });

export const deleteAdminFn = createServerFn({ method: "POST" })
  .validator((payload: { email: string; passwordHash: string; adminIdToDelete: string }) => payload)
  .handler(async ({ data: { email, passwordHash, adminIdToDelete } }) => {
    const { getAdminByEmail, deleteAdminDb } = await import("./db.server");
    const admin = await getAdminByEmail(email);
    if (!admin || admin.passwordHash !== passwordHash || !admin.isSuperAdmin) {
      return { success: false, error: "Não autorizado" };
    }
    try {
      const success = await deleteAdminDb(adminIdToDelete, admin.id);
      return { success };
    } catch (error: any) {
      return { success: false, error: error.message || "Erro desconhecido" };
    }
  });

export const getParticipantByCpf = createServerFn({ method: "POST" })
  .validator((payload: { cpf: string }) => payload)
  .handler(async ({ data: { cpf } }) => {
    const { getParticipantByCpfDb } = await import("./db.server");
    try {
      const normalizedCpf = cpf.replace(/\D/g, "");
      const participant = await getParticipantByCpfDb(normalizedCpf);
      if (!participant) {
        return { success: false, error: "Participante não encontrado com este CPF." };
      }
      return {
        success: true,
        participant: {
          fullName: participant.fullName,
          ticketNumber: participant.ticketNumber,
          congregation: participant.congregation,
          regional: participant.regional,
          cpf: participant.cpf,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message || "Erro desconhecido." };
    }
  });

// ---------------- Prêmios / Sorteio / Ganhadores ----------------

async function requireAdmin(email: string, passwordHash: string, superOnly = false) {
  const { getAdminByEmail } = await import("./db.server");
  const admin = await getAdminByEmail(email);
  if (!admin || admin.passwordHash !== passwordHash) throw new Error("Não autorizado");
  if (superOnly && !admin.isSuperAdmin) throw new Error("Não autorizado");
  return admin;
}

export const getPrizes = createServerFn({ method: "GET" }).handler(async () => {
  const { listPrizesDb } = await import("./db.server");
  return await listPrizesDb();
});

export const createPrizeFn = createServerFn({ method: "POST" })
  .validator((p: { email: string; passwordHash: string; name: string; position: number }) => p)
  .handler(async ({ data }) => {
    try {
      await requireAdmin(data.email, data.passwordHash);
      const { createPrizeDb } = await import("./db.server");
      const prize = await createPrizeDb(data.name, data.position);
      return { success: true, prize };
    } catch (error: any) {
      return { success: false, error: error.message || "Erro desconhecido" };
    }
  });

export const deletePrizeFn = createServerFn({ method: "POST" })
  .validator((p: { email: string; passwordHash: string; id: string }) => p)
  .handler(async ({ data }) => {
    try {
      await requireAdmin(data.email, data.passwordHash);
      const { deletePrizeDb } = await import("./db.server");
      await deletePrizeDb(data.id);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Erro desconhecido" };
    }
  });

export const getWinners = createServerFn({ method: "GET" }).handler(async () => {
  const { listWinnersDb } = await import("./db.server");
  return await listWinnersDb();
});

export const getEligibleCount = createServerFn({ method: "POST" })
  .validator((p: { email: string; passwordHash: string }) => p)
  .handler(async ({ data }) => {
    try {
      await requireAdmin(data.email, data.passwordHash);
      const { getEligibleParticipantsDb } = await import("./db.server");
      const eligible = await getEligibleParticipantsDb();
      return {
        success: true,
        count: eligible.length,
        tickets: eligible.map((e) => e.ticket_number).filter((n) => n != null),
      };
    } catch (error: any) {
      return { success: false, error: error.message || "Erro desconhecido", count: 0, tickets: [] as number[] };
    }
  });

export const drawWinnersFn = createServerFn({ method: "POST" })
  .validator((p: { email: string; passwordHash: string; prizeId: string; quantity: number }) => p)
  .handler(async ({ data }) => {
    try {
      await requireAdmin(data.email, data.passwordHash);
      const { drawWinnersDb } = await import("./db.server");
      const winners = await drawWinnersDb(data.prizeId, data.quantity);
      return { success: true, winners };
    } catch (error: any) {
      return { success: false, error: error.message || "Erro desconhecido" };
    }
  });

export const resetWinnersFn = createServerFn({ method: "POST" })
  .validator((p: { email: string; passwordHash: string }) => p)
  .handler(async ({ data }) => {
    try {
      await requireAdmin(data.email, data.passwordHash, true);
      const { resetWinnersDb } = await import("./db.server");
      const removed = await resetWinnersDb();
      return { success: true, removed };
    } catch (error: any) {
      return { success: false, error: error.message || "Erro desconhecido" };
    }
  });
