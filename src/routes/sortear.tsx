import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { Loader2, Lock, LogOut, Sparkles, Trophy, Eye, EyeOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  loginAdmin,
  getPrizes,
  getEligibleCount,
  drawWinnersFn,
} from "@/lib/server-functions";

export const Route = createFileRoute("/sortear")({
  head: () => ({
    meta: [
      { title: "Sorteio ao Vivo | BURN Conference 2026" },
      { name: "description", content: "Painel de sorteio ao vivo dos prêmios da BURN Conference 2026." },
      { property: "og:title", content: "Sorteio ao Vivo | BURN Conference 2026" },
      { property: "og:description", content: "Painel de sorteio ao vivo dos prêmios da BURN Conference 2026." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SortearPage,
});

type Prize = { id: string; name: string; position: number };
type Winner = { id: string; full_name: string; ticket_number: number; prize_name: string };

function fireCelebration() {
  const end = Date.now() + 4000;
  const colors = ["#ff3b1f", "#ffb703", "#ffffff", "#ff7b00"];
  (function frame() {
    confetti({ particleCount: 6, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors });
    confetti({ particleCount: 6, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
  confetti({ particleCount: 160, spread: 120, startVelocity: 45, origin: { y: 0.6 }, colors });
  setTimeout(() => confetti({ particleCount: 120, spread: 100, origin: { y: 0.4 }, colors }), 700);
  setTimeout(() => confetti({ particleCount: 120, spread: 160, origin: { y: 0.5 }, colors }), 1500);
}

function SortearPage() {
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPasswordHash, setAdminPasswordHash] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [selectedPrize, setSelectedPrize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [eligible, setEligible] = useState<number[]>([]);
  const [eligibleCount, setEligibleCount] = useState(0);
  const [loadingData, setLoadingData] = useState(false);

  const [rolling, setRolling] = useState(false);
  const [rollNumbers, setRollNumbers] = useState<number[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const email = localStorage.getItem("burn_admin_email") || "";
    const hash = localStorage.getItem("burn_admin_hash") || "";
    const isTemp = localStorage.getItem("burn_admin_istemp") === "true";
    if (email && hash && !isTemp) {
      setAdminEmail(email);
      setAdminPasswordHash(hash);
      setIsAuthenticated(true);
    }
  }, []);

  const loadData = async (email: string, hash: string) => {
    setLoadingData(true);
    try {
      const [prizeList, elig] = await Promise.all([
        getPrizes(),
        getEligibleCount({ data: { email, passwordHash: hash } }),
      ]);
      setPrizes(prizeList as Prize[]);
      setEligible(elig.tickets ?? []);
      setEligibleCount(elig.count ?? 0);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar dados do sorteio.");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && adminEmail && adminPasswordHash) {
      loadData(adminEmail, adminPasswordHash);
    }
  }, [isAuthenticated, adminEmail, adminPasswordHash]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const result = await loginAdmin({ data: { email: emailInput, password: passwordInput } });
      if (result.success && result.email && result.passwordHash) {
        if (result.isTempPassword) {
          toast.warning("Altere sua senha provisória no painel admin antes de sortear.");
          return;
        }
        localStorage.setItem("burn_admin_email", result.email);
        localStorage.setItem("burn_admin_hash", result.passwordHash);
        localStorage.setItem("burn_admin_istemp", "false");
        localStorage.setItem("burn_admin_issuper", String(result.isSuperAdmin));
        setAdminEmail(result.email);
        setAdminPasswordHash(result.passwordHash);
        setIsAuthenticated(true);
        toast.success("Acesso autorizado!");
      } else {
        toast.error(result.error || "Dados de acesso incorretos.");
      }
    } catch {
      toast.error("Erro ao conectar com o servidor.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("burn_admin_email");
    localStorage.removeItem("burn_admin_hash");
    localStorage.removeItem("burn_admin_istemp");
    localStorage.removeItem("burn_admin_issuper");
    setIsAuthenticated(false);
    setAdminEmail("");
    setAdminPasswordHash("");
  };

  const handleDraw = async () => {
    if (!selectedPrize) {
      toast.warning("Escolha o prêmio a ser sorteado.");
      return;
    }
    if (quantity < 1) {
      toast.warning("Informe a quantidade de ganhadores.");
      return;
    }
    if (quantity > eligibleCount) {
      toast.error(`Só existem ${eligibleCount} participantes elegíveis.`);
      return;
    }

    setWinners([]);
    setRolling(true);

    const pool = eligible.length ? eligible : [0];
    setRollNumbers(Array.from({ length: quantity }, () => pool[Math.floor(Math.random() * pool.length)]!));
    intervalRef.current = setInterval(() => {
      setRollNumbers(Array.from({ length: quantity }, () => pool[Math.floor(Math.random() * pool.length)]!));
    }, 70);

    const drawPromise = drawWinnersFn({
      data: { email: adminEmail, passwordHash: adminPasswordHash, prizeId: selectedPrize, quantity },
    });

    const [result] = await Promise.all([
      drawPromise,
      new Promise((r) => setTimeout(r, 5000)),
    ]);

    if (intervalRef.current) clearInterval(intervalRef.current);
    setRolling(false);

    if (!result.success || !result.winners) {
      toast.error(result.error || "Erro ao realizar o sorteio.");
      setRollNumbers([]);
      return;
    }

    const drawn = result.winners as Winner[];
    setRollNumbers(drawn.map((w) => w.ticket_number));
    setWinners(drawn);
    fireCelebration();
    toast.success("Sorteio realizado!");
    loadData(adminEmail, adminPasswordHash);
  };

  if (!isAuthenticated) {
    return (
      <main className="grain-bg min-h-screen flex items-center justify-center px-6 py-16">
        <Card className="w-full max-w-md border-border/50 bg-card/65 backdrop-blur-md shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center mb-3">
              <Lock className="w-5 h-5 text-accent" />
            </div>
            <CardTitle className="text-2xl font-display uppercase tracking-wide">
              Sorteio ao Vivo
            </CardTitle>
            <CardDescription>Acesso restrito a administradores.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="admin@burn.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Senha</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={isLoggingIn} className="w-full uppercase tracking-widest font-sans">
                {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="grain-bg min-h-screen pb-20 text-foreground">
      <header className="border-b border-border/40 px-6 py-4 bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-5xl flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-accent/10 flex items-center justify-center border border-accent/30">
              <Trophy className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h1 className="font-display text-lg uppercase tracking-wider leading-none">Sorteio ao Vivo</h1>
              <span className="text-xs text-muted-foreground uppercase tracking-widest">
                {adminEmail}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(adminEmail, adminPasswordHash)}
              disabled={loadingData || rolling}
              className="text-xs uppercase tracking-wider"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingData ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            <Button variant="destructive" size="sm" onClick={handleLogout} className="text-xs uppercase tracking-wider">
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 pt-8 space-y-8">
        <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2 md:col-span-1">
              <Label>Prêmio</Label>
              <Select value={selectedPrize} onValueChange={setSelectedPrize} disabled={rolling}>
                <SelectTrigger>
                  <SelectValue placeholder={prizes.length ? "Escolha o prêmio" : "Nenhum prêmio cadastrado"} />
                </SelectTrigger>
                <SelectContent>
                  {prizes.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.position}º Prêmio · {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantidade de ganhadores</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                disabled={rolling}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
            <Button
              onClick={handleDraw}
              disabled={rolling || !selectedPrize}
              className="w-full py-6 text-base uppercase tracking-widest font-display"
            >
              {rolling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sorteando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" /> Sortear
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground md:col-span-3 uppercase tracking-wider">
              Participantes elegíveis: <span className="text-accent font-bold">{eligibleCount}</span>
            </p>
          </CardContent>
        </Card>

        {(rolling || rollNumbers.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {rollNumbers.map((num, i) => {
              const winner = winners[i];
              return (
                <div
                  key={i}
                  className={`relative rounded-xl border p-8 text-center overflow-hidden transition-all duration-500 ${
                    winner
                      ? "border-accent bg-accent/10 shadow-[0_0_40px_-10px_rgba(255,90,30,0.6)] scale-100 animate-scale-in"
                      : "border-border/50 bg-card/40"
                  }`}
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">
                    Número da sorte
                  </p>
                  <div
                    className={`font-display text-6xl sm:text-7xl tabular-nums ${
                      winner ? "text-accent" : "text-foreground/70 blur-[1px]"
                    }`}
                  >
                    {String(num).padStart(4, "0")}
                  </div>
                  {winner ? (
                    <div className="mt-5 animate-fade-in">
                      <p className="font-display text-2xl uppercase tracking-wide leading-tight">
                        {winner.full_name}
                      </p>
                      <p className="mt-2 text-sm uppercase tracking-widest text-muted-foreground">
                        {winner.prize_name}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-5 text-sm uppercase tracking-widest text-muted-foreground animate-pulse">
                      Sorteando...
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
