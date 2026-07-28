import { createFileRoute } from "@tanstack/react-router";
import poster from "@/assets/burn-post.jpg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BURN Conference 2025 | Juventude Hope - Igreja Esperança" },
      {
        name: "description",
        content:
          "BURN Conference: 15 e 16 de agosto, sábado às 14h e domingo às 17h, na Igreja Esperança em Aparecida de Goiânia. Recalculando a Rota.",
      },
      { property: "og:title", content: "BURN Conference 2025 | Juventude Hope" },
      {
        property: "og:description",
        content:
          "Dois dias de louvor e palavra. 15 e 16 de agosto, Igreja Esperança, Aparecida de Goiânia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const preletores = [
  "Pra. Raquel Lima",
  "Midian Lima",
  "Vitor Santana",
  "Pr. Romeu",
  "2 Metro",
  "Vanessa Tanaka",
  "Pr. Jackson Marques",
  "Pr. Jeferson",
];

const programacao = [
  { dia: "Sábado", data: "15 de agosto", hora: "14h" },
  { dia: "Domingo", data: "16 de agosto", hora: "17h" },
];

function Index() {
  return (
    <main className="grain-bg min-h-screen">
      {/* HERO */}
      <section className="relative overflow-hidden px-6 pb-20 pt-16 md:pt-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
          <div>
            <p className="font-sans text-sm uppercase tracking-[0.4em] text-accent">
              Juventude Hope apresenta
            </p>
            <h1 className="mt-4 text-7xl leading-[0.85] md:text-[8rem]">
              Burn
              <span className="block text-2xl tracking-[0.5em] text-muted-foreground md:text-3xl">
                Conference
              </span>
            </h1>
            <p className="mt-6 max-w-md text-lg text-muted-foreground">
              Recalculando a Rota. Dois dias de fogo, louvor e palavra para uma geração que não
              quer viver morna.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#programacao"
                className="surface-ember rounded-md px-8 py-4 font-sans text-lg uppercase tracking-widest text-primary-foreground transition-transform hover:-translate-y-0.5"
              >
                15 e 16 de Agosto
              </a>
              <a
                href="#local"
                className="rounded-md border border-border px-8 py-4 font-sans text-lg uppercase tracking-widest text-foreground transition-colors hover:bg-secondary"
              >
                Como chegar
              </a>
            </div>
          </div>
          <div className="relative">
            <img
              src={poster.url}
              alt="Cartaz oficial da BURN Conference com os preletores e convidados"
              className="w-full rounded-lg"
              style={{ boxShadow: "var(--shadow-deep)" }}
            />
          </div>
        </div>
      </section>

      {/* PROGRAMAÇÃO */}
      <section id="programacao" className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-4xl md:text-5xl">Programação</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {programacao.map((p) => (
              <div
                key={p.dia}
                className="rounded-lg border border-border bg-card p-8"
                style={{ boxShadow: "var(--shadow-deep)" }}
              >
                <p className="font-sans text-sm uppercase tracking-[0.35em] text-accent">
                  {p.data}
                </p>
                <p className="mt-3 font-display text-4xl uppercase">{p.dia}</p>
                <p className="mt-2 text-6xl font-display text-primary">{p.hora}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRELETORES */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-4xl md:text-5xl">Preletores & Convidados</h2>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {preletores.map((nome) => (
              <li
                key={nome}
                className="rounded-md border border-border bg-secondary/60 px-5 py-6 font-sans text-xl uppercase tracking-wide"
              >
                {nome}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* LOCAL */}
      <section id="local" className="px-6 pb-28 pt-10">
        <div
          className="surface-ember mx-auto max-w-5xl rounded-lg p-10 text-primary-foreground md:p-16"
        >
          <p className="font-sans text-sm uppercase tracking-[0.4em] opacity-80">Local</p>
          <h2 className="mt-3 text-4xl md:text-5xl">Igreja Esperança</h2>
          <p className="mt-4 font-sans text-xl uppercase tracking-wide">
            Av. Bartolomeu Bueno, Jardim Mont Serrat — Aparecida de Goiânia
          </p>
          <a
            href="https://www.google.com/maps/search/?api=1&query=Av.+Bartolomeu+Bueno,+Jardim+Mont+Serrat,+Aparecida+de+Goi%C3%A2nia"
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-block rounded-md bg-background px-8 py-4 font-sans text-lg uppercase tracking-widest text-foreground"
          >
            Abrir no mapa
          </a>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-10 text-center font-sans uppercase tracking-[0.3em] text-muted-foreground">
        Juventude Hope · Igreja Esperança
      </footer>
    </main>
  );
}
