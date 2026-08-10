import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Gift,
  User,
  Mail,
  KeyRound,
  Loader2,
  ArrowLeft,
  Flame,
  Sparkles,
  RefreshCw,
  Plus,
  Trash2,
  History,
  CheckCircle2,
  Award,
  AlertCircle,
  Shuffle,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Participant } from "@/lib/types";
import { getParticipants, loginAdmin } from "@/lib/server-functions";

export const Route = createFileRoute("/sortear")({
  head: () => ({
    meta: [
      { title: "Sorteador | BURN Conference 2026" },
      { name: "description", content: "Sorteio de prêmios para os participantes da BURN Conference." },
    ],
  }),
  component: SortearPage,
});

const DEFAULT_PRIZES = [
  "Camiseta BURN 2026",
  "Bíblia de Estudos NVT",
  "Livro 'Recalculando a Rota'",
  "Kit BURN (Squeeze + Caderno)",
  "Moletom Oficial BURN",
  "Ingresso BURN Conference 2027",
  "Voucher Livraria R$ 100",
];

function SortearPage() {
  // Auth states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPasswordHash, setAdminPasswordHash] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Participants & Draw states
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);

  // Raffle control states
  const [prizesList, setPrizesList] = useState<string[]>(DEFAULT_PRIZES);
  const [newPrizeInput, setNewPrizeInput] = useState("");
  const [selectedPrize, setSelectedPrize] = useState<string>("");
  const [selectedQuantity, setSelectedQuantity] = useState<string>("1");
  const [drawnPrizes, setDrawnPrizes] = useState<string[]>([]);
  
  // Winners and Animation states
  const [currentWinners, setCurrentWinners] = useState<Participant[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDrawn, setIsDrawn] = useState(false);
  const [shufflingText, setShufflingText] = useState("");
  
  // History of draws
  const [drawHistory, setDrawHistory] = useState<{
    prize: string;
    winners: Participant[];
    timestamp: string;
  }[]>([]);

  // Check auth on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedEmail = localStorage.getItem("burn_admin_email") || "";
      const storedHash = localStorage.getItem("burn_admin_hash") || "";
      const storedIsTemp = localStorage.getItem("burn_admin_istemp") === "true";

      if (storedEmail && storedHash && !storedIsTemp) {
        setAdminEmail(storedEmail);
        setAdminPasswordHash(storedHash);
        setIsAuthenticated(true);
      }
    }
  }, []);

  // Fetch participants when authenticated
  const loadParticipants = async (email: string, hash: string) => {
    setLoading(true);
    try {
      const data = await getParticipants({
        data: { email, passwordHash: hash },
      });
      // Filter only participants that have a ticket number
      const validParticipants = data.filter(p => p.ticketNumber !== undefined && p.ticketNumber !== null);
      setParticipants(validParticipants);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar participantes. Verifique sua sessão.");
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && adminEmail && adminPasswordHash) {
      loadParticipants(adminEmail, adminPasswordHash);
    }
  }, [isAuthenticated, adminEmail, adminPasswordHash]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) {
      toast.warning("Preencha todos os campos.");
      return;
    }

    setIsLoggingIn(true);
    try {
      const result = await loginAdmin({
        data: { email: emailInput, password: passwordInput },
      });

      if (result.success && result.email && result.passwordHash) {
        if (result.isTempPassword) {
          toast.error("Você precisa alterar sua senha temporária no painel admin primeiro.");
          return;
        }

        localStorage.setItem("burn_admin_email", result.email);
        localStorage.setItem("burn_admin_hash", result.passwordHash);
        localStorage.setItem("burn_admin_istemp", String(result.isTempPassword));
        localStorage.setItem("burn_admin_issuper", String(result.isSuperAdmin));

        setAdminEmail(result.email);
        setAdminPasswordHash(result.passwordHash);
        setIsAuthenticated(true);
        toast.success("Acesso autorizado!");
      } else {
        toast.error(result.error || "Dados de acesso incorretos.");
      }
    } catch (error) {
      console.error(error);
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

    setAdminEmail("");
    setAdminPasswordHash("");
    setIsAuthenticated(false);
    setEmailInput("");
    setPasswordInput("");
    setParticipants([]);
    toast.info("Sessão encerrada.");
  };

  // Add custom prize to options list
  const handleAddPrize = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPrize = newPrizeInput.trim();
    if (!cleanPrize) return;

    if (prizesList.some(p => p.toLowerCase() === cleanPrize.toLowerCase())) {
      toast.warning("Este prêmio já existe na lista.");
      return;
    }

    setPrizesList([...prizesList, cleanPrize]);
    setSelectedPrize(cleanPrize);
    setNewPrizeInput("");
    toast.success("Prêmio adicionado com sucesso!");
  };

  // Determine eligible participants (exclude ones already drawn in previous draws in the history)
  const getEligibleParticipants = () => {
    const alreadyWonIds = new Set(
      drawHistory.flatMap(h => h.winners.map(w => w.id))
    );
    return participants.filter(p => !alreadyWonIds.has(p.id));
  };

  // Run the draw logic with shuffle animation
  const handleDraw = () => {
    if (!selectedPrize) {
      toast.warning("Selecione um prêmio para sortear.");
      return;
    }

    const qty = parseInt(selectedQuantity);
    if (isNaN(qty) || qty <= 0) {
      toast.warning("Selecione uma quantidade válida de ganhadores.");
      return;
    }

    const pool = getEligibleParticipants();
    if (pool.length === 0) {
      toast.error("Não há participantes elegíveis para o sorteio.");
      return;
    }

    if (pool.length < qty) {
      toast.error(`Participantes elegíveis insuficientes (${pool.length}) para a quantidade solicitada (${qty}).`);
      return;
    }

    setIsDrawing(true);
    setCurrentWinners([]);
    
    // Animate shuffling for 2 seconds
    let count = 0;
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * pool.length);
      const tempPart = pool[randomIdx];
      setShufflingText(`${tempPart.fullName.toUpperCase()} (Nº #${tempPart.ticketNumber})`);
      count++;
    }, 60);

    setTimeout(() => {
      clearInterval(interval);
      
      // Select actual random winners from the pool
      const selected: Participant[] = [];
      const tempPool = [...pool];
      
      for (let i = 0; i < qty; i++) {
        const randomIdx = Math.floor(Math.random() * tempPool.length);
        selected.push(tempPool[randomIdx]);
        tempPool.splice(randomIdx, 1); // remove to prevent drawing same person again in this run
      }

      setCurrentWinners(selected);
      setDrawnPrizes([...drawnPrizes, selectedPrize]);
      
      // Add to draw history
      const now = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setDrawHistory([
        {
          prize: selectedPrize,
          winners: selected,
          timestamp: now
        },
        ...drawHistory
      ]);

      setIsDrawing(false);
      setIsDrawn(true);
      toast.success("Sorteio realizado com sucesso! Parabéns aos ganhadores!");
    }, 2000);
  };

  // Reset screen for next draw
  const handleNewDraw = () => {
    setCurrentWinners([]);
    setIsDrawn(false);
    setSelectedPrize("");
    // Selected quantity stays at whatever it was or resets to "1"
    setSelectedQuantity("1");
  };

  // Reset session history and drawn prizes
  const handleResetSorteador = () => {
    if (confirm("Deseja realmente reiniciar todo o sorteador? Isso limpará os ganhadores e os prêmios sorteados ficarão disponíveis novamente.")) {
      setDrawnPrizes([]);
      setCurrentWinners([]);
      setIsDrawn(false);
      setSelectedPrize("");
      setSelectedQuantity("1");
      setDrawHistory([]);
      toast.info("Sorteador reiniciado!");
    }
  };

  // Remove single draw from history
  const handleRemoveHistoryItem = (indexToDelete: number) => {
    const item = drawHistory[indexToDelete];
    if (confirm(`Deseja remover o sorteio do prêmio "${item.prize}" do histórico? Os ganhadores dele poderão ser sorteados novamente.`)) {
      const updatedHistory = drawHistory.filter((_, idx) => idx !== indexToDelete);
      setDrawHistory(updatedHistory);
      
      // Also remove from drawnPrizes list
      const updatedDrawnPrizes = drawnPrizes.filter(p => p !== item.prize);
      setDrawnPrizes(updatedDrawnPrizes);
      
      toast.success("Sorteio removido do histórico.");
    }
  };

  // Exclude drawn prizes from dropdown selection
  const availablePrizes = prizesList.filter(p => !drawnPrizes.includes(p));

  // Render Login Card if not authenticated
  if (!isAuthenticated) {
    return (
      <main className="grain-bg min-h-screen flex items-center justify-center p-6 text-foreground">
        <Card className="w-full max-w-md border-border/50 bg-card/65 backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 surface-ember" />
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-2 border border-accent/20">
              <KeyRound className="w-6 h-6 text-accent" />
            </div>
            <CardTitle className="text-2xl font-display uppercase tracking-wide">
              Área Sorteador (Admin)
            </CardTitle>
            <CardDescription>
              Acesso exclusivo para administradores da BURN Conference.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@email.com"
                    className="bg-secondary/40 border-border text-foreground pl-10"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    className="bg-secondary/40 border-border text-foreground pl-10 pr-10"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoggingIn}
                className="w-full surface-ember text-primary-foreground font-sans uppercase tracking-widest py-5 mt-2"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Autenticando...
                  </>
                ) : (
                  "Acessar Sorteador"
                )}
              </Button>

              <Button
                asChild
                variant="link"
                className="w-full text-muted-foreground hover:text-foreground text-xs uppercase tracking-wider mt-2 font-sans"
              >
                <Link to="/">Voltar ao Início</Link>
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  const eligibleCount = getEligibleParticipants().length;

  return (
    <main className="grain-bg min-h-screen pb-16 text-foreground">
      {/* Navbar/Header */}
      <header className="border-b border-border/40 px-6 py-4 bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-6xl flex justify-between items-center">
          <Link
            to="/admin"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-sans uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4 text-accent" /> Painel Admin
          </Link>
          <div className="flex items-center gap-2 font-display text-xl uppercase tracking-wider">
            <Flame className="w-5 h-5 text-accent animate-pulse" />
            <span>BURN <span className="text-muted-foreground text-sm font-sans tracking-widest ml-1">Conference</span></span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="border-border bg-secondary/30 hover:bg-secondary text-xs uppercase font-sans tracking-wider"
          >
            Sair
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 pt-10 space-y-6">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-display uppercase tracking-wider mb-2 bg-gradient-to-r from-orange-400 via-red-500 to-yellow-500 bg-clip-text text-transparent">
            Sorteador de Prêmios
          </h1>
          <p className="text-muted-foreground font-sans uppercase tracking-wider text-xs">
            BURN Conference 2026 · {participants.length} participantes ativos · {eligibleCount} elegíveis
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Settings Card */}
          <Card className="border-border/50 bg-card/65 backdrop-blur-md shadow-xl relative overflow-hidden md:col-span-1 h-fit">
            <div className="absolute top-0 left-0 w-full h-1 surface-ember" />
            <CardHeader>
              <CardTitle className="text-lg font-display uppercase tracking-wider flex items-center gap-2">
                <Gift className="w-5 h-5 text-accent" /> Configurações
              </CardTitle>
              <CardDescription>Defina o prêmio e os ganhadores.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Select Prize */}
              <div className="space-y-2">
                <Label htmlFor="prize-select">Escolher Prêmio</Label>
                <Select
                  value={selectedPrize}
                  onValueChange={setSelectedPrize}
                  disabled={isDrawing || isDrawn}
                >
                  <SelectTrigger id="prize-select" className="bg-secondary/40 border-border text-foreground disabled:opacity-50">
                    <SelectValue placeholder="Selecione um prêmio" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border max-h-[220px]">
                    {availablePrizes.length === 0 ? (
                      <SelectItem value="none" disabled>
                        Nenhum prêmio disponível
                      </SelectItem>
                    ) : (
                      availablePrizes.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Add Custom Prize */}
              {!isDrawn && !isDrawing && (
                <form onSubmit={handleAddPrize} className="flex gap-2">
                  <Input
                    placeholder="Adicionar prêmio personalizado..."
                    className="bg-secondary/40 border-border text-foreground text-sm"
                    value={newPrizeInput}
                    onChange={(e) => setNewPrizeInput(e.target.value)}
                  />
                  <Button type="submit" size="icon" variant="outline" className="border-border hover:bg-secondary shrink-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                </form>
              )}

              {/* Select Winners Quantity */}
              <div className="space-y-2">
                <Label htmlFor="qty-select">Nº de Ganhadores</Label>
                <Select
                  value={selectedQuantity}
                  onValueChange={setSelectedQuantity}
                  disabled={isDrawing || isDrawn}
                >
                  <SelectTrigger id="qty-select" className="bg-secondary/40 border-border text-foreground disabled:opacity-50">
                    <SelectValue placeholder="Qtd. de ganhadores" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {["1", "2", "3", "4", "5", "10"].map((q) => (
                      <SelectItem key={q} value={q}>
                        {q} {parseInt(q) === 1 ? "Ganhador" : "Ganhadores"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t border-border/30 pt-4 flex flex-col gap-2">
                {isDrawn ? (
                  <Button
                    onClick={handleNewDraw}
                    className="w-full bg-secondary hover:bg-secondary/80 border border-border text-foreground font-sans uppercase tracking-widest font-bold py-5"
                  >
                    Novo Sorteio
                  </Button>
                ) : (
                  <Button
                    onClick={handleDraw}
                    disabled={isDrawing || !selectedPrize || participants.length === 0}
                    className="w-full surface-ember text-primary-foreground font-sans uppercase tracking-widest font-bold py-5"
                  >
                    {isDrawing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Sorteando...
                      </>
                    ) : (
                      <>
                        <Shuffle className="w-4 h-4 mr-2" />
                        Sortear
                      </>
                    )}
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => loadParticipants(adminEmail, adminPasswordHash)}
                  disabled={loading || isDrawing}
                  className="w-full border-border bg-secondary/10 hover:bg-secondary/30 text-xs font-sans uppercase tracking-wider"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? "animate-spin" : ""}`} />
                  Recarregar Inscritos
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Draw Board Area */}
          <Card className="border-border/50 bg-card/65 backdrop-blur-md shadow-xl relative overflow-hidden md:col-span-2 flex flex-col justify-between min-h-[350px]">
            <div className="absolute top-0 left-0 w-full h-1 surface-ember" />
            
            {/* Shuffling Screen */}
            {isDrawing && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6 text-center animate-pulse">
                <div className="w-20 h-20 rounded-full border-4 border-t-accent border-accent/20 flex items-center justify-center animate-spin">
                  <Flame className="w-10 h-10 text-accent" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-display text-accent tracking-wider">EMBARALHANDO CUPONS...</h3>
                  <div className="font-mono text-lg bg-black/40 border border-border/40 rounded px-6 py-3 min-w-[280px] break-all max-w-md mx-auto text-primary">
                    {shufflingText || "Buscando cupons..."}
                  </div>
                </div>
              </div>
            )}

            {/* Empty Screen */}
            {!isDrawing && !isDrawn && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-secondary/40 flex items-center justify-center border border-border/30">
                  <Sparkles className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-display tracking-wider">Aguardando Início</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    {participants.length === 0
                      ? "Nenhum participante com número da sorte foi carregado. Recarregue os inscritos."
                      : "Selecione o prêmio e a quantidade de ganhadores, depois clique em Sortear."}
                  </p>
                </div>
              </div>
            )}

            {/* Results Screen */}
            {!isDrawing && isDrawn && currentWinners.length > 0 && (
              <div className="flex-1 p-6 space-y-6 flex flex-col justify-center">
                <div className="text-center space-y-1">
                  <span className="text-xs uppercase tracking-widest text-accent font-semibold flex items-center justify-center gap-1">
                    <Award className="w-3.5 h-3.5" /> Ganhador{currentWinners.length > 1 ? "es" : ""} do Prêmio
                  </span>
                  <h2 className="text-2xl font-display text-primary uppercase tracking-wide">
                    🎉 {selectedPrize}
                  </h2>
                </div>

                <div className={`grid gap-4 ${currentWinners.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                  {currentWinners.map((winner, idx) => (
                    <Card key={winner.id} className="border-accent/30 bg-accent/5 backdrop-blur-sm shadow-md border animate-in zoom-in duration-300">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full surface-ember flex items-center justify-center shrink-0">
                          <span className="font-display text-lg text-primary-foreground">#{winner.ticketNumber}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-display text-base uppercase text-foreground truncate">{winner.fullName}</p>
                          <p className="text-xs text-muted-foreground uppercase truncate">
                            {winner.congregation} ({winner.regional})
                          </p>
                          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                            CPF: ***.{winner.cpf.substring(3, 6)}.***-{winner.cpf.substring(9, 11)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {/* Disclaimer at Bottom of Draw Board */}
            <div className="border-t border-border/20 px-6 py-3 bg-secondary/10 flex justify-between items-center text-xs text-muted-foreground">
              <span>Apenas participantes com número da sorte gerado.</span>
              <span className="flex items-center gap-1 font-semibold text-accent">
                <CheckCircle2 className="w-3.5 h-3.5 text-accent" /> Sorteio Justo
              </span>
            </div>
          </Card>
        </div>

        {/* Draw History Section */}
        <Card className="border-border/50 bg-card/65 backdrop-blur-md shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-muted/50" />
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-display uppercase tracking-wider flex items-center gap-2">
                <History className="w-5 h-5 text-accent" /> Histórico de Sorteios
              </CardTitle>
              <CardDescription>Confira os prêmios sorteados nesta sessão.</CardDescription>
            </div>
            {drawHistory.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleResetSorteador}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-xs uppercase font-sans tracking-wider"
              >
                Limpar Tudo
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {drawHistory.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground flex flex-col items-center gap-2">
                <AlertCircle className="w-8 h-8 text-muted-foreground/50" />
                Nenhum sorteio foi realizado nesta sessão ainda.
              </div>
            ) : (
              <div className="space-y-4">
                {drawHistory.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between border border-border/30 rounded-lg p-4 bg-secondary/15 hover:bg-secondary/20 transition-colors gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold uppercase text-primary">
                          🎁 {item.prize}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono bg-secondary/60 border border-border/40 rounded px-1.5 py-0.5">
                          {item.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-foreground">
                        Ganhador{item.winners.length > 1 ? "es" : ""}:{" "}
                        <span className="font-semibold">
                          {item.winners.map(w => `${w.fullName} (#${w.ticketNumber})`).join(", ")}
                        </span>
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveHistoryItem(idx)}
                      className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded shrink-0 self-end sm:self-center"
                      title="Excluir este sorteio"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
