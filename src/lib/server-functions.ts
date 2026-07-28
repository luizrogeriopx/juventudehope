import { createServerFn } from "@tanstack/react-start";
import {
  addParticipant,
  readParticipants,
  deleteParticipant,
  readAdminConfig,
  writeAdminConfig,
  hashPassword,
} from "./db";
import { Participant } from "./types";

export const registerParticipant = createServerFn({ method: "POST" })
  .validator((data: Omit<Participant, "id" | "createdAt">) => data)
  .handler(async ({ data }) => {
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
    const adminConfig = await readAdminConfig();

    if (adminConfig.email.toLowerCase() !== email.toLowerCase()) {
      return { success: false, error: "E-mail ou senha incorretos." };
    }

    const hashedInput = await hashPassword(password);
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

    const newHash = await hashPassword(newPassword);
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
    const adminConfig = await readAdminConfig();
    if (
      adminConfig.email.toLowerCase() !== email.toLowerCase() ||
      adminConfig.passwordHash !== passwordHash
    ) {
      throw new Error("Não autorizado");
    }
    const list = await readParticipants();
    return list;
  });

export const deleteParticipantFn = createServerFn({ method: "POST" })
  .validator(
    (payload: { email: string; passwordHash: string; id: string }) => payload
  )
  .handler(async ({ data: { email, passwordHash, id } }) => {
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
