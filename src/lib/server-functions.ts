import { createServerFn } from "@tanstack/react-start";
import { addParticipant, readParticipants, deleteParticipant } from "./db";
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

export const getParticipants = createServerFn({ method: "GET" })
  .validator((passcode: string) => passcode)
  .handler(async ({ data: passcode }) => {
    if (passcode !== "burn2026") {
      throw new Error("Não autorizado");
    }
    const list = await readParticipants();
    return list;
  });

export const deleteParticipantFn = createServerFn({ method: "POST" })
  .validator((payload: { id: string; passcode: string }) => payload)
  .handler(async ({ data: { id, passcode } }) => {
    if (passcode !== "burn2026") {
      throw new Error("Não autorizado");
    }
    const success = await deleteParticipant(id);
    return { success };
  });
