import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "./admin";

export const Route = createFileRoute("/super-admin")({
  head: () => ({
    meta: [
      { title: "Painel Super Admin | BURN Conference 2025" },
      { name: "description", content: "Administração de participantes do sorteio e gestores." },
    ],
  }),
  component: SuperAdminRoutePage,
});

function SuperAdminRoutePage() {
  return <AdminPage defaultTab="admins" />;
}
