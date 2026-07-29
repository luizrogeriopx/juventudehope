import { createHash } from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Participant, AdminConfig, Admin } from "./types";

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
  ticket_number?: number;
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
    ticketNumber: row.ticket_number,
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

export async function getAdminByEmail(email: string): Promise<Admin | null> {
  const { data, error } = await supabaseAdmin
    .from("admins")
    .select("*")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    id: data.id,
    email: data.email,
    passwordHash: data.password_hash,
    isTempPassword: data.is_temp_password,
    isSuperAdmin: data.is_super_admin,
    createdAt: data.created_at,
  };
}

export async function updateAdminPassword(email: string, passwordHash: string, isTempPassword: boolean): Promise<void> {
  const { error } = await supabaseAdmin
    .from("admins")
    .update({
      password_hash: passwordHash,
      is_temp_password: isTempPassword,
    })
    .eq("email", email.toLowerCase());

  if (error) throw new Error(error.message);
}

export async function listAdminsDb(): Promise<Omit<Admin, "passwordHash">[]> {
  const { data, error } = await supabaseAdmin
    .from("admins")
    .select("id, email, is_temp_password, is_super_admin, created_at")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    email: row.email,
    isTempPassword: row.is_temp_password,
    isSuperAdmin: row.is_super_admin,
    createdAt: row.created_at,
  }));
}

export async function createAdminDb(email: string, isSuperAdmin: boolean): Promise<Admin> {
  const normalizedEmail = email.toLowerCase().trim();
  
  // Check if admin already exists
  const { data: existing } = await supabaseAdmin
    .from("admins")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existing) {
    throw new Error("E-mail de administrador já cadastrado.");
  }

  // Default password is "123456" for new admins (temp)
  const defaultHash = hashPassword("123456");

  const { data, error } = await supabaseAdmin
    .from("admins")
    .insert({
      email: normalizedEmail,
      password_hash: defaultHash,
      is_temp_password: true,
      is_super_admin: isSuperAdmin,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  
  return {
    id: data.id,
    email: data.email,
    passwordHash: data.password_hash,
    isTempPassword: data.is_temp_password,
    isSuperAdmin: data.is_super_admin,
    createdAt: data.created_at,
  };
}

export async function deleteAdminDb(id: string, currentAdminId: string): Promise<boolean> {
  if (id === currentAdminId) {
    throw new Error("Você não pode excluir o seu próprio usuário de administrador.");
  }

  const { data: adminToDelete } = await supabaseAdmin
    .from("admins")
    .select("is_super_admin")
    .eq("id", id)
    .maybeSingle();

  if (!adminToDelete) {
    throw new Error("Administrador não encontrado.");
  }

  // If deleting a super admin, make sure there is at least one other super admin
  if (adminToDelete.is_super_admin) {
    const { count, error: countError } = await supabaseAdmin
      .from("admins")
      .select("id", { count: "exact", head: true })
      .eq("is_super_admin", true);

    if (countError) throw new Error(countError.message);
    if ((count ?? 0) <= 1) {
      throw new Error("Não é possível excluir o único Super Administrador ativo.");
    }
  }

  const { error } = await supabaseAdmin
    .from("admins")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  return true;
}

export async function getParticipantByCpfDb(cpf: string): Promise<Participant | null> {
  const { data, error } = await supabaseAdmin
    .from("participants")
    .select("*")
    .eq("cpf", cpf)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return toParticipant(data as ParticipantRow);
}
