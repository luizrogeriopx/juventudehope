import { Participant, AdminConfig } from "./types";

// Dynamic imports to prevent bundler issues on the client side
async function getFs() {
  return await import("node:fs/promises");
}

async function getPath() {
  return await import("node:path");
}

async function getCrypto() {
  return await import("node:crypto");
}

export async function hashPassword(password: string): Promise<string> {
  const crypto = await getCrypto();
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function getDbPath(filename: string): Promise<string> {
  const path = await getPath();
  return path.join(process.cwd(), "data", filename);
}

async function ensureDirectoryExists(filePath: string) {
  const fs = await getFs();
  const path = await getPath();
  const dir = path.dirname(filePath);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

export async function readParticipants(): Promise<Participant[]> {
  const fs = await getFs();
  const dbPath = await getDbPath("registrations.json");
  await ensureDirectoryExists(dbPath);

  try {
    const data = await fs.readFile(dbPath, "utf-8");
    return JSON.parse(data) as Participant[];
  } catch (error) {
    return [];
  }
}

export async function writeParticipants(participants: Participant[]): Promise<void> {
  const fs = await getFs();
  const dbPath = await getDbPath("registrations.json");
  await ensureDirectoryExists(dbPath);
  await fs.writeFile(dbPath, JSON.stringify(participants, null, 2), "utf-8");
}

export async function addParticipant(
  data: Omit<Participant, "id" | "createdAt">
): Promise<Participant> {
  const participants = await readParticipants();

  const normalizedCpf = data.cpf.replace(/\D/g, "");
  const duplicate = participants.find((p) => p.cpf.replace(/\D/g, "") === normalizedCpf);

  if (duplicate) {
    throw new Error("CPF já cadastrado para outro participante.");
  }

  const newParticipant: Participant = {
    ...data,
    id: Math.random().toString(36).substring(2, 11),
    createdAt: new Date().toISOString(),
  };

  participants.push(newParticipant);
  await writeParticipants(participants);
  return newParticipant;
}

export async function deleteParticipant(id: string): Promise<boolean> {
  const participants = await readParticipants();
  const filtered = participants.filter((p) => p.id !== id);

  if (filtered.length === participants.length) {
    return false;
  }

  await writeParticipants(filtered);
  return true;
}

// Admin configuration helper
export async function readAdminConfig(): Promise<AdminConfig> {
  const fs = await getFs();
  const dbPath = await getDbPath("admin.json");
  await ensureDirectoryExists(dbPath);

  try {
    const data = await fs.readFile(dbPath, "utf-8");
    return JSON.parse(data) as AdminConfig;
  } catch (error) {
    // If not found, seed with initial credentials:
    // Email: luizrogeriopx@gmail.com
    // Password: 123456 (hashed)
    // isTempPassword: true
    const initialConfig: AdminConfig = {
      email: "luizrogeriopx@gmail.com",
      passwordHash: await hashPassword("123456"),
      isTempPassword: true,
    };
    await writeAdminConfig(initialConfig);
    return initialConfig;
  }
}

export async function writeAdminConfig(config: AdminConfig): Promise<void> {
  const fs = await getFs();
  const dbPath = await getDbPath("admin.json");
  await ensureDirectoryExists(dbPath);
  await fs.writeFile(dbPath, JSON.stringify(config, null, 2), "utf-8");
}
