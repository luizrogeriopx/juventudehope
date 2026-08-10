import { createFileRoute } from "@tanstack/react-router";
import { Trophy, PartyPopper } from "lucide-react";
import { getWinners } from "@/lib/server-functions";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";

const winnersQueryOptions = queryOptions({
  queryKey: ["winners"],
  queryFn: () => getWinners(),
});

export const Route = createFileRoute("/ganhadores")({
  head: () => ({
    meta: [
      { title: "Ganhadores do Sorteio | BURN Conference 2026" },
      {
        name: "description",
        content: "Confira a lista oficial dos ganhadores dos prêmios sorteados na BURN Conference 2026.",
      },
      { property: "og:title", content: "Ganhadores do Sorteio | BURN Conference 2026" },
      {
        property: "og:description",
        content: "Confira a lista oficial dos ganhadores dos prêmios sorteados na BURN Conference 2026.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(winnersQueryOptions);
  },
  errorComponent: () => (
    <main className="grain-bg min-h-screen flex items-center justify-center text-muted-foreground">
      Não foi possível carregar os ganhadores agora.
    </main>
  ),
  component: GanhadoresPage,
});

function GanhadoresPage() {
  const { data: winners } = useSuspenseQuery(winnersQueryOptions);

  const groups = winners.reduce<Record<string, typeof winners>>((acc, w) => {
    const key = `${w.prize_position}|${w.prize_name}`;
    (acc[key] ??= []).push(w);
    return acc;
  }, {});

  const orderedKeys = Object.keys(groups).sort(
    (a, b) => Number(a.split("|")[0]) - Number(b.split("|")[0]),
  );

  return (
    <main className="grain-bg min-h-screen pb-24 text-foreground">
      <section className="px-6 pt-20 pb-10 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center mb-5">
          <PartyPopper className="w-6 h-6 text-accent" />
        </div>
        <h1 className="font-display text-4xl sm:text-6xl uppercase tracking-wide">Ganhadores</h1>
        <p className="mt-3 text-sm uppercase tracking-[0.3em] text-muted-foreground">
          Sorteio BURN Conference 2026
        </p>
      </section>

      <div className="mx-auto max-w-3xl px-6 space-y-8">
        {orderedKeys.length === 0 ? (
          <p className="text-center text-muted-foreground py-16 uppercase tracking-widest text-sm">
            Nenhum ganhador sorteado ainda.
          </p>
        ) : (
          orderedKeys.map((key) => {
            const [position, name] = key.split("|");
            return (
              <div key={key} className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-border/40 bg-secondary/20">
                  <Trophy className="w-5 h-5 text-accent" />
                  <h2 className="font-display text-xl uppercase tracking-wider">
                    {position}º Prêmio · {name}
                  </h2>
                </div>
                <ul className="divide-y divide-border/20">
                  {groups[key]!.map((w) => (
                    <li key={w.id} className="flex items-center justify-between gap-4 px-6 py-4">
                      <div>
                        <p className="font-semibold">{w.full_name}</p>
                        {w.congregation && (
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">
                            {w.congregation}
                          </p>
                        )}
                      </div>
                      <span className="font-display text-2xl text-accent tabular-nums">
                        {String(w.ticket_number).padStart(4, "0")}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
