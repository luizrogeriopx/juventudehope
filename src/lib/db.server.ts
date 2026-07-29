import { createHash } from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Participant, AdminConfig } from "./types";

export function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

type ParticipantRow = {
  id: string;
  full_name: string;
  birth_date: string;
  cpf: string;
  email: string;
  phone: string;
  street: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  regional: string;
  congregation: string;
  created_at: string;
};

function toParticipant(row: ParticipantRow): Participant {
  return {
    id: row.id,
    fullName: row.full_name,
    birthDate: row.birth_date,
    cpf: row.cpf,
    email: row.email,
    phone: row.phone,
    address: {
      street: row.street,
      complement: row.complement ?? "",
      neighborhood: row.neighborhood,
      city: row.city,
      state: row.state,
    },
    regional: row.regional,
    congregation: row.congregation,
    createdAt: row.created_at,
  };
}

export async function readParticipants(): Promise<Participant[]> {
  const { data, error } = await supabaseAdmin
    .from("participants")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as ParticipantRow[]).map(toParticipant);
}

export async function addParticipant(
  data: Omit<Participant, "id" | "createdAt">,
): Promise<Participant> {
  const normalizedCpf = data.cpf.replace(/\D/g, "");

  const { data: existing } = await supabaseAdmin
    .from("participants")
    .select("id")
    .eq("cpf", normalizedCpf)
    .maybeSingle();

  if (existing) {
    throw new Error("CPF já cadastrado para outro participante.");
  }

  const { data: inserted, error } = await supabaseAdmin
    .from("participants")
    .insert({
      full_name: data.fullName,
      birth_date: data.birthDate,
      cpf: normalizedCpf,
      email: data.email,
      phone: data.phone,
      street: data.address.street,
      complement: data.address.complement || null,
      neighborhood: data.address.neighborhood,
      city: data.address.city,
      state: data.address.state,
      regional: data.regional,
      congregation: data.congregation,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("CPF já cadastrado para outro participante.");
    }
    throw new Error(error.message);
  }

  return toParticipant(inserted as ParticipantRow);
}

export async function deleteParticipant(id: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("participants")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) throw new Error(error.message);
  return (data ?? []).length > 0;
}

export async function readAdminConfig(): Promise<AdminConfig> {
  const { data, error } = await supabaseAdmin
    .from("admin_config")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (!data) {
    const initial = {
      id: 1,
      email: "luizrogeriopx@gmail.com",
      password_hash: hashPassword("123456"),
      is_temp_password: true,
    };
    await supabaseAdmin.from("admin_config").insert(initial);
    return {
      email: initial.email,
      passwordHash: initial.password_hash,
      isTempPassword: initial.is_temp_password,
    };
  }

  const row = data as { email: string; password_hash: string; is_temp_password: boolean };
  return {
    email: row.email,
    passwordHash: row.password_hash,
    isTempPassword: row.is_temp_password,
  };
}

export async function writeAdminConfig(config: AdminConfig): Promise<void> {
  const { error } = await supabaseAdmin
    .from("admin_config")
    .update({
      email: config.email,
      password_hash: config.passwordHash,
      is_temp_password: config.isTempPassword,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) throw new Error(error.message);
}
