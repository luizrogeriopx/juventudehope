import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import poster from "@/assets/burn-post.jpg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BURN Conference 2026 | Juventude Hope - Igreja Esperança" },
      {
        name: "description",
        content:
          "BURN Conference: 15 e 16 de agosto, sábado às 14h e domingo às 17h, na Igreja Esperança em Aparecida de Goiânia. Recalculando a Rota.",
      },
      { property: "og:title", content: "BURN Conference 2026 | Juventude Hope" },
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

// Sábado, 15 de agosto de 2026, 14h (horário de Brasília, UTC-3)
const EVENT_START = new Date("2026-08-15T14:00:00-03:00").getTime();

const comoChegar = [
  {
    label: "Uber",
    href: "https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=-16.7603239&dropoff[longitude]=-49.2704948",
  },
  {
    label: "Waze",
    href: "https://waze.com/ul?ll=-16.7603239,-49.2704948&navigate=yes",
  },
  {
    label: "Google Maps",
    href: "https://www.google.com/maps/dir/?api=1&destination=-16.7603239,-49.2704948",
  },
];

function Countdown() {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setLeft(Math.max(0, EVENT_START - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const s = Math.floor((left ?? 0) / 1000);
  const parts = [
    { label: "Dias", value: Math.floor(s / 86400) },
    { label: "Horas", value: Math.floor((s % 86400) / 3600) },
    { label: "Min", value: Math.floor((s % 3600) / 60) },
    { label: "Seg", value: s % 60 },
  ];

  return (
    <div className="border-b border-border px-6 py-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <p className="font-sans text-sm uppercase tracking-[0.35em] text-accent">
          CONTAGEM REGRESSIVA
        </p>
        <div className="flex gap-3">
          {parts.map((p) => (
            <div
              key={p.label}
              className="min-w-[68px] rounded-md border border-border bg-card px-4 py-3 text-center"
            >
              <p className="font-display text-3xl leading-none text-primary">
                {left === null ? "--" : String(p.value).padStart(2, "0")}
              </p>
              <p className="mt-1 font-sans text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {p.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Index() {
  return (
    <main className="grain-bg min-h-screen">
      <Countdown />

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
            <h2 className="mt-4 text-3xl uppercase tracking-[0.2em] text-fire md:text-4xl">
              Recalculando a Rota
            </h2>
            <p className="mt-6 max-w-md text-lg text-muted-foreground">
              A Burn Conference nasceu com o propósito de reunir pessoas apaixonadas por Jesus para
              viver um tempo de adoração, Palavra, Comunhão e Despertamento Espiritual.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="https://ticketsprime.com.br/detalhe/7949/burn-conference"
                target="_blank"
                rel="noreferrer"
                className="surface-ember rounded-md px-8 py-4 font-sans text-lg uppercase tracking-widest text-primary-foreground transition-transform hover:-translate-y-0.5"
              >
                Fazer Inscrição
              </a>
              <Link
                to="/sorteio"
                className="rounded-md border border-accent bg-accent/15 px-8 py-4 font-sans text-lg uppercase tracking-widest text-accent font-semibold transition-transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                <Flame className="w-5 h-5 text-accent animate-pulse" />
                Participar do Sorteio
              </Link>
              <a
                href="#programacao"
                className="rounded-md border border-border px-8 py-4 font-sans text-lg uppercase tracking-widest text-foreground transition-colors hover:bg-secondary"
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
          <div className="mt-12 text-center">
            <a
              href="https://ticketsprime.com.br/detalhe/7949/burn-conference"
              target="_blank"
              rel="noreferrer"
              className="surface-ember inline-block rounded-md px-8 py-4 font-sans text-lg uppercase tracking-widest text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Fazer Inscrição
            </a>
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
          <div className="mt-12 text-center">
            <a
              href="https://ticketsprime.com.br/detalhe/7949/burn-conference"
              target="_blank"
              rel="noreferrer"
              className="surface-ember inline-block rounded-md px-8 py-4 font-sans text-lg uppercase tracking-widest text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Fazer Inscrição
            </a>
          </div>
        </div>
      </section>

      {/* LOCAL */}
      <section id="local" className="px-6 pb-28 pt-10">
        <div
          className="surface-ember mx-auto max-w-5xl rounded-lg p-10 text-primary-foreground md:p-16"
        >
          <p className="font-sans text-sm uppercase tracking-[0.4em] opacity-80">Local</p>
          <h2 className="mt-3 text-4xl uppercase md:text-5xl">
            <span className="font-nexa font-extralight tracking-[0.15em]">Igreja</span>{" "}
            <span className="font-montserrat font-extrabold tracking-tight">Esperança</span>
          </h2>
          <p className="mt-4 font-sans text-xl uppercase tracking-wide">
            Av. Bartolomeu Bueno, Jardim Mont Serrat — Aparecida de Goiânia
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            {comoChegar.map((c) => (
              <a
                key={c.label}
                href={c.href}
                target="_blank"
                rel="noreferrer"
                className="inline-block rounded-md bg-background px-8 py-4 font-sans text-lg uppercase tracking-widest text-foreground transition-transform hover:-translate-y-0.5"
              >
                {c.label}
              </a>
            ))}
          </div>

        </div>
      </section>

      <footer className="border-t border-border px-6 py-10 text-center font-sans uppercase tracking-[0.3em] text-muted-foreground">
        Juventude Hope · Igreja Esperança
      </footer>
    </main>
  );
}
