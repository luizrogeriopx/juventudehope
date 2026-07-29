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
    const { readAdminConfig, hashPassword } = await import("./db.server");
    const adminConfig = await readAdminConfig();

    if (adminConfig.email.toLowerCase() !== email.toLowerCase()) {
      return { success: false, error: "E-mail ou senha incorretos." };
    }

    const hashedInput = hashPassword(password);
    if (adminConfig.passwordHash !== hashedInput) {
      return { success: false, error: "E-mail ou senha incorretos." };
    }

    return {
      success: true,
      email: adminConfig.email,
      passwordHash: adminConfig.passwordHash,
      isTempPassword: adminConfig.isTempPassword,
    };
  });

export const changeAdminPassword = createServerFn({ method: "POST" })
  .validator((payload: { email: string; passwordHash: string; newPassword: string }) => payload)
  .handler(async ({ data: { email, passwordHash, newPassword } }) => {
    const { readAdminConfig, writeAdminConfig, hashPassword } = await import("./db.server");
    const adminConfig = await readAdminConfig();

    if (
      adminConfig.email.toLowerCase() !== email.toLowerCase() ||
      adminConfig.passwordHash !== passwordHash
    ) {
      return { success: false, error: "Sessão inválida ou não autorizada." };
    }

    if (newPassword.length < 6) {
      return { success: false, error: "A nova senha deve ter no mínimo 6 caracteres." };
    }

    const newHash = hashPassword(newPassword);
    adminConfig.passwordHash = newHash;
    adminConfig.isTempPassword = false;

    await writeAdminConfig(adminConfig);

    return {
      success: true,
      passwordHash: newHash,
    };
  });

export const getParticipants = createServerFn({ method: "GET" })
  .validator((credentials: { email: string; passwordHash: string }) => credentials)
  .handler(async ({ data: { email, passwordHash } }) => {
    const { readAdminConfig, readParticipants } = await import("./db.server");
    const adminConfig = await readAdminConfig();
    if (
      adminConfig.email.toLowerCase() !== email.toLowerCase() ||
      adminConfig.passwordHash !== passwordHash
    ) {
      throw new Error("Não autorizado");
    }
    return await readParticipants();
  });

export const deleteParticipantFn = createServerFn({ method: "POST" })
  .validator((payload: { email: string; passwordHash: string; id: string }) => payload)
  .handler(async ({ data: { email, passwordHash, id } }) => {
    const { readAdminConfig, deleteParticipant } = await import("./db.server");
    const adminConfig = await readAdminConfig();
    if (
      adminConfig.email.toLowerCase() !== email.toLowerCase() ||
      adminConfig.passwordHash !== passwordHash
    ) {
      throw new Error("Não autorizado");
    }
    const success = await deleteParticipant(id);
    return { success };
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
