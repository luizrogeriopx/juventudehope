import { Participant } from "./types";

// Dynamic imports to prevent bundler issues on the client side
async function getFs() {
  return await import("node:fs/promises");
}

async function getPath() {
  return await import("node:path");
}

async function getDbPath(): Promise<string> {
  const path = await getPath();
  // Store the JSON file in the project's root "data" directory
  return path.join(process.cwd(), "data", "registrations.json");
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
  const dbPath = await getDbPath();
  await ensureDirectoryExists(dbPath);

  try {
    const data = await fs.readFile(dbPath, "utf-8");
    return JSON.parse(data) as Participant[];
  } catch (error) {
    // If file doesn't exist, return empty array
    return [];
  }
}

export async function writeParticipants(participants: Participant[]): Promise<void> {
  const fs = await getFs();
  const dbPath = await getDbPath();
  await ensureDirectoryExists(dbPath);
  await fs.writeFile(dbPath, JSON.stringify(participants, null, 2), "utf-8");
}

export async function addParticipant(
  data: Omit<Participant, "id" | "createdAt">
): Promise<Participant> {
  const participants = await readParticipants();

  // Normalize CPF to check for duplicates (remove dots, hyphens, spaces)
  const normalizedCpf = data.cpf.replace(/\D/g, "");
  const duplicate = participants.find((p) => p.cpf.replace(/\D/g, "") === normalizedCpf);

  if (duplicate) {
    throw new Error("CPF já cadastrado para outro participante.");
  }

  // Auto-generate ID and timestamp
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
