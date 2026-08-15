import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Users,
  Search,
  Download,
  Trash2,
  Lock,
  RefreshCw,
  LogOut,
  Church,
  TrendingUp,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  ShieldAlert,
  Shield,
  UserPlus,
  Trophy,
  Gift,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Participant } from "@/lib/types";
import {
  getParticipants,
  deleteParticipantFn,
  loginAdmin,
  changeAdminPassword,
  getAdmins,
  createAdminFn,
  deleteAdminFn,
  getPrizes,
  createPrizeFn,
  deletePrizeFn,
  updatePrizeFn,
  getWinners,
  resetWinnersFn,
  resetPrizeWinnersFn,
} from "@/lib/server-functions";
import { REGIONALS_DATA } from "@/lib/regionals";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel Admin | BURN Conference 2026" },
      { name: "description", content: "Administração de participantes do sorteio." },
    ],
  }),
  component: AdminPage,
});

type AdminTab = "participants" | "prizes" | "admins";

export function AdminPage({ defaultTab = "participants" }: { defaultTab?: AdminTab }) {
  // Authentication states
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPasswordHash, setAdminPasswordHash] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  
  // Password change states (forced first access)
  const [isTempPassword, setIsTempPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Dashboard data states
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterRegional, setFilterRegional] = useState<string>("all");
  const [filterCongregation, setFilterCongregation] = useState<string>("all");

  // Super admin / admin tab state
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>(defaultTab);

  // Prizes & winners state
  const [prizes, setPrizes] = useState<any[]>([]);
  const [winnersList, setWinnersList] = useState<any[]>([]);
  const [loadingPrizes, setLoadingPrizes] = useState(false);
  const [newPrizeName, setNewPrizeName] = useState("");
  const [newPrizePosition, setNewPrizePosition] = useState(1);
  const [isCreatingPrize, setIsCreatingPrize] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resettingPrizeId, setResettingPrizeId] = useState<string | null>(null);
  const [adminsList, setAdminsList] = useState<any[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminIsSuper, setNewAdminIsSuper] = useState(false);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedEmail = localStorage.getItem("burn_admin_email") || "";
      const storedHash = localStorage.getItem("burn_admin_hash") || "";
      const storedIsTemp = localStorage.getItem("burn_admin_istemp") === "true";
      const storedIsSuper = localStorage.getItem("burn_admin_issuper") === "true";

      if (storedEmail && storedHash) {
        setAdminEmail(storedEmail);
        setAdminPasswordHash(storedHash);
        setIsSuperAdmin(storedIsSuper);
        
        if (storedIsTemp) {
          setIsTempPassword(true);
          setIsAuthenticated(false); // Make them change password first
        } else {
          setIsAuthenticated(true);
        }
      }
    }
  }, []);

  // Fetch participants when authenticated
  const loadData = async (email: string, hash: string) => {
    setLoading(true);
    try {
      const data = await getParticipants({
        data: { email, passwordHash: hash },
      });
      setParticipants(data);
    } catch (error) {
      console.error(error);
      toast.error("Sessão expirada ou não autorizada.");
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && adminEmail && adminPasswordHash) {
      loadData(adminEmail, adminPasswordHash);
    }
  }, [isAuthenticated, adminEmail, adminPasswordHash]);

  const loadPrizes = async () => {
    setLoadingPrizes(true);
    try {
      const [prizeList, winnerList] = await Promise.all([getPrizes(), getWinners()]);
      setPrizes(prizeList);
      setWinnersList(winnerList);
      setNewPrizePosition((prizeList as any[]).length + 1);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar prêmios.");
    } finally {
      setLoadingPrizes(false);
    }
  };

  const handleCreatePrize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrizeName.trim()) {
      toast.warning("Informe o nome do prêmio.");
      return;
    }
    setIsCreatingPrize(true);
    try {
      const result = await createPrizeFn({
        data: {
          email: adminEmail,
          passwordHash: adminPasswordHash,
          name: newPrizeName.trim(),
          position: newPrizePosition,
        },
      });
      if (result.success) {
        toast.success("Prêmio cadastrado!");
        setNewPrizeName("");
        loadPrizes();
      } else {
        toast.error(result.error || "Erro ao cadastrar prêmio.");
      }
    } finally {
      setIsCreatingPrize(false);
    }
  };

  const handleDeletePrize = async (id: string, name: string) => {
    if (!confirm(`Excluir o prêmio "${name}"? Os ganhadores desse prêmio também serão removidos.`)) return;
    const result = await deletePrizeFn({
      data: { email: adminEmail, passwordHash: adminPasswordHash, id },
    });
    if (result.success) {
      toast.success("Prêmio removido.");
      loadPrizes();
    } else {
      toast.error(result.error || "Erro ao remover prêmio.");
    }
  };

  const handleUpdatePrize = async (id: string, name: string, position: number) => {
    const result = await updatePrizeFn({
      data: { email: adminEmail, passwordHash: adminPasswordHash, id, name, position },
    });
    if (result.success) {
      toast.success("Prêmio atualizado.");
      loadPrizes();
    } else {
      toast.error(result.error || "Erro ao atualizar prêmio.");
    }
  };

  const handleResetWinners = async () => {
    if (!confirm("Resetar todos os ganhadores? Todos voltarão a concorrer nos próximos sorteios.")) return;
    setIsResetting(true);
    try {
      const result = await resetWinnersFn({
        data: { email: adminEmail, passwordHash: adminPasswordHash },
      });
      if (result.success) {
        toast.success(`Ganhadores resetados (${result.removed ?? 0} removidos).`);
        loadPrizes();
      } else {
        toast.error(result.error || "Erro ao resetar ganhadores.");
      }
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetPrizeWinners = async (prizeId: string, prizeName: string) => {
    if (
      !confirm(
        `Resetar os ganhadores do prêmio "${prizeName}"? Eles voltarão a concorrer nos próximos sorteios.`,
      )
    )
      return;
    setResettingPrizeId(prizeId);
    try {
      const result = await resetPrizeWinnersFn({
        data: { email: adminEmail, passwordHash: adminPasswordHash, prizeId },
      });
      if (result.success) {
        toast.success(`Ganhadores do prêmio resetados (${result.removed ?? 0} removidos).`);
        loadPrizes();
      } else {
        toast.error(result.error || "Erro ao resetar ganhadores do prêmio.");
      }
    } finally {
      setResettingPrizeId(null);
    }
  };

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
        localStorage.setItem("burn_admin_email", result.email);
        localStorage.setItem("burn_admin_hash", result.passwordHash);
        localStorage.setItem("burn_admin_istemp", String(result.isTempPassword));
        localStorage.setItem("burn_admin_issuper", String(result.isSuperAdmin));

        setAdminEmail(result.email);
        setAdminPasswordHash(result.passwordHash);
        setIsSuperAdmin(!!result.isSuperAdmin);

        if (result.isTempPassword) {
          setIsTempPassword(true);
          toast.warning("Senha provisória detectada. Você deve alterá-la para continuar.");
        } else {
          setIsAuthenticated(true);
          toast.success("Acesso autorizado!");
        }
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

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.warning("Preencha todos os campos.");
      return;
    }

    if (newPassword.length < 6) {
      toast.warning("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await changeAdminPassword({
        data: {
          email: adminEmail,
          passwordHash: adminPasswordHash,
          newPassword: newPassword,
        },
      });

      if (result.success && result.passwordHash) {
        localStorage.setItem("burn_admin_hash", result.passwordHash);
        localStorage.setItem("burn_admin_istemp", "false");

        setAdminPasswordHash(result.passwordHash);
        setIsTempPassword(false);
        setIsAuthenticated(true);
        toast.success("Senha alterada com sucesso! Bem-vindo ao painel.");
      } else {
        toast.error(result.error || "Erro ao alterar a senha.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao conectar com o servidor.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("burn_admin_email");
    localStorage.removeItem("burn_admin_hash");
    localStorage.removeItem("burn_admin_istemp");
    localStorage.removeItem("burn_admin_issuper");

    setAdminEmail("");
    setAdminPasswordHash("");
    setIsTempPassword(false);
    setIsSuperAdmin(false);
    setIsAuthenticated(false);
    setEmailInput("");
    setPasswordInput("");
    setNewPassword("");
    setConfirmPassword("");
    setParticipants([]);
    setAdminsList([]);
    toast.info("Sessão encerrada.");
  };

  const loadAdmins = async (email: string, hash: string) => {
    setLoadingAdmins(true);
    try {
      const list = await getAdmins({
        data: { email, passwordHash: hash },
      });
      setAdminsList(list);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar administradores.");
    } finally {
      setLoadingAdmins(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail) {
      toast.warning("Digite o e-mail do novo administrador.");
      return;
    }

    setIsCreatingAdmin(true);
    try {
      const response = await createAdminFn({
        data: {
          email: adminEmail,
          passwordHash: adminPasswordHash,
          newAdminEmail,
          isSuperAdmin: newAdminIsSuper,
        },
      });

      if (response.success) {
        toast.success("Administrador adicionado com sucesso! A senha padrão é 123456.");
        setNewAdminEmail("");
        setNewAdminIsSuper(false);
        loadAdmins(adminEmail, adminPasswordHash);
      } else {
        toast.error(response.error || "Erro ao adicionar administrador.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao conectar com o servidor.");
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const handleDeleteAdmin = async (id: string, email: string) => {
    if (!confirm(`Deseja realmente remover o administrador ${email}?`)) {
      return;
    }

    try {
      const response = await deleteAdminFn({
        data: {
          email: adminEmail,
          passwordHash: adminPasswordHash,
          adminIdToDelete: id,
        },
      });

      if (response.success) {
        toast.success("Administrador removido com sucesso!");
        loadAdmins(adminEmail, adminPasswordHash);
      } else {
        toast.error(response.error || "Erro ao remover administrador.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao conectar com o servidor.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente remover o cadastro de ${name}?`)) {
      return;
    }

    try {
      const result = await deleteParticipantFn({
        data: { email: adminEmail, passwordHash: adminPasswordHash, id },
      });
      if (result.success) {
        toast.success("Participante removido com sucesso!");
        loadData(adminEmail, adminPasswordHash);
      } else {
        toast.error("Erro ao remover participante.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao conectar com o servidor.");
    }
  };

  const exportToCSV = () => {
    if (filteredParticipants.length === 0) {
      toast.warning("Nenhum registro para exportar.");
      return;
    }

    // Build CSV with UTF-8 BOM so Excel opens it with accents correctly
    let csvContent = "\uFEFF";
    csvContent +=
      "Nº Sorteio;Nome Completo;Data Nascimento;CPF;E-mail;Telefone;Logradouro;Complemento;Bairro;Cidade;Estado;Regional;Congregação;Data Cadastro\n";

    filteredParticipants.forEach((p) => {
      const row = [
        p.ticketNumber ? String(p.ticketNumber) : "",
        p.fullName,
        p.birthDate,
        p.cpf,
        p.email,
        p.phone,
        p.address.street,
        p.address.complement || "",
        p.address.neighborhood,
        p.address.city,
        p.address.state,
        p.regional,
        p.congregation,
        new Date(p.createdAt).toLocaleString("pt-BR"),
      ]
        .map((val) => `"${val.replace(/"/g, '""')}"`)
        .join(";");

      csvContent += row + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `participantes_sorteio_burn_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exportado com sucesso!");
  };

  // Filter logic
  const filteredParticipants = participants.filter((p) => {
    const matchesSearch =
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.cpf.includes(search) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search) ||
      p.congregation.toLowerCase().includes(search.toLowerCase());

    const matchesRegional = filterRegional === "all" || p.regional === filterRegional;
    const matchesCongregation = filterCongregation === "all" || p.congregation === filterCongregation;

    return matchesSearch && matchesRegional && matchesCongregation;
  });

  // Calculate statistics
  const totalRegistrations = participants.length;
  const uniqueCongregations = new Set(participants.map((p) => p.congregation)).size;

  // Find most active regional
  const regionalCounts: Record<string, number> = {};
  participants.forEach((p) => {
    regionalCounts[p.regional] = (regionalCounts[p.regional] || 0) + 1;
  });
  let topRegional = "-";
  let topRegionalCount = 0;
  Object.entries(regionalCounts).forEach(([reg, count]) => {
    if (count > topRegionalCount) {
      topRegional = reg;
      topRegionalCount = count;
    }
  });

  // Render Lock screen
  if (!isAuthenticated && !isTempPassword) {
    return (
      <main className="grain-bg min-h-screen flex items-center justify-center p-6 text-foreground">
        <Card className="w-full max-w-md border-border/50 bg-card/65 backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 surface-ember" />
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-2 border border-accent/20">
              <Lock className="w-6 h-6 text-accent" />
            </div>
            <CardTitle className="text-2xl font-display uppercase tracking-wide">
              Acesso do Administrador
            </CardTitle>
            <CardDescription>
              Entre com suas credenciais de e-mail e senha.
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
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">Senha</Label>
                </div>
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
                    Entrando...
                  </>
                ) : (
                  "Entrar no Painel"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Render Mandatory Password Change screen
  if (!isAuthenticated && isTempPassword) {
    return (
      <main className="grain-bg min-h-screen flex items-center justify-center p-6 text-foreground">
        <Card className="w-full max-w-md border-border/50 bg-card/65 backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-yellow-500" />
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center mb-2 border border-yellow-500/30">
              <ShieldAlert className="w-6 h-6 text-yellow-500 animate-bounce" />
            </div>
            <CardTitle className="text-xl font-display uppercase tracking-wide text-yellow-500">
              Alteração de Senha Obrigatória
            </CardTitle>
            <CardDescription className="text-sm">
              Você realizou login com uma senha provisória. Por segurança, altere sua senha para prosseguir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha (mín. 6 caracteres)</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Nova senha"
                  className="bg-secondary/40 border-border text-foreground"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirme a nova senha"
                  className="bg-secondary/40 border-border text-foreground"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-sans uppercase tracking-widest py-5"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar e Entrar"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLogout}
                  className="border-border hover:bg-secondary font-sans uppercase tracking-widest py-5"
                >
                  Cancelar e Sair
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Render authenticated admin dashboard
  return (
    <main className="grain-bg min-h-screen pb-16 text-foreground">
      {/* Header */}
      <header className="border-b border-border/40 px-6 py-4 bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-7xl flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-accent/10 flex items-center justify-center border border-accent/30">
              <Users className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h1 className="font-display text-lg uppercase tracking-wider leading-none">
                Painel Admin
              </h1>
              <span className="text-xs text-muted-foreground uppercase tracking-widest">
                BURN Conference 2026 · {adminEmail}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-accent/30 bg-accent/10 hover:bg-accent/20 text-accent text-xs uppercase font-sans tracking-wider"
            >
              <Link to="/sortear">
                <Gift className="w-3.5 h-3.5 mr-1.5 animate-pulse" />
                Realizar Sorteio
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(adminEmail, adminPasswordHash)}
              disabled={loading}
              className="border-border bg-secondary/30 hover:bg-secondary text-xs uppercase font-sans tracking-wider"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLogout}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-xs uppercase font-sans tracking-wider"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Container */}
      <div className="max-w-7xl mx-auto px-6 pt-8 space-y-6">
        {(
          <div className="flex border-b border-border/40 gap-4 mb-2 flex-wrap">
            <button
              onClick={() => setActiveAdminTab("participants")}
              className={`pb-3 text-sm font-sans uppercase tracking-wider font-semibold border-b-2 transition-colors ${
                activeAdminTab === "participants"
                  ? "border-accent text-accent"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Participantes
            </button>
            <button
              onClick={() => {
                setActiveAdminTab("prizes");
                loadPrizes();
              }}
              className={`pb-3 text-sm font-sans uppercase tracking-wider font-semibold border-b-2 transition-colors ${
                activeAdminTab === "prizes"
                  ? "border-accent text-accent"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Prêmios & Ganhadores
            </button>
            {isSuperAdmin && (
            <button
              onClick={() => {
                setActiveAdminTab("admins");
                loadAdmins(adminEmail, adminPasswordHash);
              }}
              className={`pb-3 text-sm font-sans uppercase tracking-wider font-semibold border-b-2 transition-colors ${
                activeAdminTab === "admins"
                  ? "border-accent text-accent"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Gerenciar Administradores
            </button>
            )}
          </div>
        )}

        {activeAdminTab === "prizes" ? (
          <PrizesSection
            prizes={prizes}
            winners={winnersList}
            loading={loadingPrizes}
            isSuperAdmin={isSuperAdmin}
            newPrizeName={newPrizeName}
            setNewPrizeName={setNewPrizeName}
            newPrizePosition={newPrizePosition}
            setNewPrizePosition={setNewPrizePosition}
            isCreatingPrize={isCreatingPrize}
            isResetting={isResetting}
            onCreate={handleCreatePrize}
            onDelete={handleDeletePrize}
            onUpdate={handleUpdatePrize}
            onReset={handleResetWinners}
            onRefresh={loadPrizes}
          />
        ) : activeAdminTab === "participants" ? (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-md">
                <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Total de Inscritos
                    </p>
                    <h3 className="text-3xl font-display uppercase text-primary mt-1">
                      {totalRegistrations}
                    </h3>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20">
                    <Users className="w-6 h-6 text-accent" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-md">
                <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Congregações Ativas
                    </p>
                    <h3 className="text-3xl font-display uppercase text-primary mt-1">
                      {uniqueCongregations}
                    </h3>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20">
                    <Church className="w-6 h-6 text-accent" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-md">
                <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Regional Mais Ativa
                    </p>
                    <h3 className="text-2xl font-display uppercase text-primary mt-1.5 truncate max-w-[200px]">
                      {topRegional}
                    </h3>
                    <span className="text-[10px] uppercase text-muted-foreground tracking-wider">
                      {topRegionalCount} cadastro{topRegionalCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20">
                    <TrendingUp className="w-6 h-6 text-accent" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Search */}
            <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-md">
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Search Bar */}
                  <div className="relative md:col-span-2">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome, CPF, e-mail, congregação..."
                      className="bg-secondary/20 border-border pl-10 text-foreground"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  {/* Regional Filter */}
                  <div>
                    <Select
                      value={filterRegional}
                      onValueChange={(val) => {
                        setFilterRegional(val);
                        setFilterCongregation("all"); // Reset congregation
                      }}
                    >
                      <SelectTrigger className="bg-secondary/20 border-border text-foreground">
                        <SelectValue placeholder="Filtrar por Regional" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border max-h-[250px]">
                        <SelectItem value="all">Todas as Regionais</SelectItem>
                        {Object.keys(REGIONALS_DATA).map((reg) => (
                          <SelectItem key={reg} value={reg}>
                            {reg}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Congregation Filter */}
                  <div>
                    <Select
                      value={filterCongregation}
                      onValueChange={setFilterCongregation}
                      disabled={filterRegional === "all"}
                    >
                      <SelectTrigger className="bg-secondary/20 border-border text-foreground disabled:opacity-50">
                        <SelectValue
                          placeholder={
                            filterRegional !== "all"
                              ? "Filtrar por Congregação"
                              : "Selecione uma Regional"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border max-h-[250px]">
                        <SelectItem value="all">Todas as Congregações</SelectItem>
                        {filterRegional !== "all" &&
                          REGIONALS_DATA[filterRegional]?.map((cong) => (
                            <SelectItem key={cong} value={cong}>
                              {cong}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Export and Info Button */}
                <div className="flex flex-wrap gap-2 justify-between items-center border-t border-border/30 pt-4">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Mostrando {filteredParticipants.length} de {participants.length} participantes
                  </span>
                  <Button
                    onClick={exportToCSV}
                    className="surface-ember text-primary-foreground text-xs uppercase font-sans tracking-wider"
                  >
                    <Download className="w-3.5 h-3.5 mr-2" />
                    Exportar para CSV (Excel)
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Table list */}
            <Card className="border-border/40 bg-card/30 backdrop-blur-sm shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border/50 bg-secondary/30 uppercase text-xs tracking-wider text-muted-foreground">
                      <th className="py-4 px-6 font-semibold">Nº Sorteio</th>
                      <th className="py-4 px-6 font-semibold">Nome</th>
                      <th className="py-4 px-6 font-semibold">Contato</th>
                      <th className="py-4 px-6 font-semibold">CPF / Nasc.</th>
                      <th className="py-4 px-6 font-semibold">Localidade</th>
                      <th className="py-4 px-6 font-semibold">Eclesiástico</th>
                      <th className="py-4 px-6 font-semibold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {filteredParticipants.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-muted-foreground">
                          Nenhum participante encontrado.
                        </td>
                      </tr>
                    ) : (
                      filteredParticipants.map((p) => {
                        const displayBirth = p.birthDate.split("-").reverse().join("/");

                        return (
                          <tr key={p.id} className="hover:bg-secondary/15 transition-colors">
                            <td className="py-4 px-6 font-mono font-semibold text-primary">
                              {p.ticketNumber ? `#${p.ticketNumber}` : "-"}
                            </td>
                            <td className="py-4 px-6">
                              <p className="font-medium text-foreground">{p.fullName}</p>
                              <span className="text-xs text-muted-foreground tracking-wider block mt-0.5">
                                Cadastro: {new Date(p.createdAt).toLocaleDateString("pt-BR")}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="space-y-0.5">
                                <p className="text-foreground">{p.phone}</p>
                                <p className="text-xs text-muted-foreground">{p.email}</p>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="space-y-0.5">
                                <p className="text-foreground">{p.cpf}</p>
                                <p className="text-xs text-muted-foreground">{displayBirth}</p>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="space-y-0.5 max-w-[200px]">
                                <p className="truncate text-foreground" title={p.address.street}>
                                  {p.address.street}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {p.address.neighborhood}, {p.address.city} - {p.address.state}
                                </p>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="space-y-0.5">
                                <p className="text-foreground">{p.congregation}</p>
                                <p className="text-xs text-accent uppercase tracking-wider">
                                  {p.regional}
                                </p>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => handleDelete(p.id, p.fullName)}
                                className="h-8 w-8 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Adicionar Novo Administrador Card */}
              <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-md md:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg font-display uppercase tracking-wider flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-accent" />
                    Novo Administrador
                  </CardTitle>
                  <CardDescription>
                    Cadastre um novo usuário administrador. A senha provisória padrão será 123456.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateAdmin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="newAdminEmail">E-mail</Label>
                      <Input
                        id="newAdminEmail"
                        type="email"
                        placeholder="nome@email.com"
                        className="bg-secondary/40 border-border text-foreground"
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                      <input
                        type="checkbox"
                        id="isSuper"
                        className="rounded border-border bg-secondary/40 text-accent focus:ring-accent w-4 h-4"
                        checked={newAdminIsSuper}
                        onChange={(e) => setNewAdminIsSuper(e.target.checked)}
                      />
                      <Label htmlFor="isSuper" className="text-sm font-medium cursor-pointer">
                        Super Administrador (Permite gerenciar gestores)
                      </Label>
                    </div>
                    <Button
                      type="submit"
                      disabled={isCreatingAdmin}
                      className="w-full surface-ember text-primary-foreground font-sans uppercase tracking-widest py-5 mt-2"
                    >
                      {isCreatingAdmin ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Adicionando...
                        </>
                      ) : (
                        "Adicionar Administrador"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Lista de Administradores Card */}
              <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-md md:col-span-2 overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-display uppercase tracking-wider flex items-center gap-2">
                      <Shield className="w-5 h-5 text-accent" />
                      Administradores Cadastrados
                    </CardTitle>
                    <CardDescription>
                      Gerencie as contas administrativas da BURN Conference.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadAdmins(adminEmail, adminPasswordHash)}
                    disabled={loadingAdmins}
                    className="border-border bg-secondary/30 hover:bg-secondary text-xs uppercase font-sans tracking-wider"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingAdmins ? "animate-spin" : ""}`} />
                    Atualizar
                  </Button>
                </CardHeader>
                <div className="overflow-x-auto border-t border-border/40">
                  {loadingAdmins ? (
                    <div className="py-20 flex justify-center items-center text-muted-foreground gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-accent" />
                      Carregando administradores...
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-border/50 bg-secondary/30 uppercase text-xs tracking-wider text-muted-foreground">
                          <th className="py-4 px-6 font-semibold">E-mail</th>
                          <th className="py-4 px-6 font-semibold">Nível</th>
                          <th className="py-4 px-6 font-semibold">Senha Provisória</th>
                          <th className="py-4 px-6 font-semibold">Data Cadastro</th>
                          <th className="py-4 px-6 font-semibold text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20">
                        {adminsList.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-muted-foreground">
                              Nenhum administrador cadastrado.
                            </td>
                          </tr>
                        ) : (
                          adminsList.map((adm) => (
                            <tr key={adm.id} className="hover:bg-secondary/15 transition-colors">
                              <td className="py-4 px-6 font-medium text-foreground">
                                {adm.email}
                              </td>
                              <td className="py-4 px-6">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  adm.isSuperAdmin
                                    ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                    : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                }`}>
                                  {adm.isSuperAdmin ? "Super Admin" : "Admin"}
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  adm.isTempPassword
                                    ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                }`}>
                                  {adm.isTempPassword ? "Pendente Reset" : "Ok"}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-muted-foreground text-xs">
                                {new Date(adm.createdAt).toLocaleDateString("pt-BR")}
                              </td>
                              <td className="py-4 px-6 text-right">
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  disabled={adm.email.toLowerCase() === adminEmail.toLowerCase()}
                                  onClick={() => handleDeleteAdmin(adm.id, adm.email)}
                                  className="h-8 w-8 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 disabled:opacity-30 disabled:hover:bg-transparent"
                                  title={adm.email.toLowerCase() === adminEmail.toLowerCase() ? "Você não pode se auto-excluir" : "Remover administrador"}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function PrizesSection({
  prizes,
  winners,
  loading,
  isSuperAdmin,
  newPrizeName,
  setNewPrizeName,
  newPrizePosition,
  setNewPrizePosition,
  isCreatingPrize,
  isResetting,
  onCreate,
  onDelete,
  onUpdate,
  onReset,
  onRefresh,
}: {
  prizes: any[];
  winners: any[];
  loading: boolean;
  isSuperAdmin: boolean;
  newPrizeName: string;
  setNewPrizeName: (v: string) => void;
  newPrizePosition: number;
  setNewPrizePosition: (v: number) => void;
  isCreatingPrize: boolean;
  isResetting: boolean;
  onCreate: (e: React.FormEvent) => void;
  onDelete: (id: string, name: string) => void;
  onUpdate: (id: string, name: string, position: number) => void;
  onReset: () => void;
  onRefresh: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPosition, setEditPosition] = useState(1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 space-y-6">
        <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-display uppercase tracking-wider flex items-center gap-2">
              <Gift className="w-5 h-5 text-accent" />
              Cadastrar Prêmio
            </CardTitle>
            <CardDescription>
              Cadastre os prêmios (1º Prêmio, 2º Prêmio...) que serão sorteados em /sortear.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Posição</Label>
                <Input
                  type="number"
                  min={1}
                  value={newPrizePosition}
                  onChange={(e) => setNewPrizePosition(Math.max(1, Number(e.target.value) || 1))}
                />
              </div>
              <div className="space-y-2">
                <Label>Nome do prêmio</Label>
                <Input
                  value={newPrizeName}
                  onChange={(e) => setNewPrizeName(e.target.value)}
                  placeholder="Ex: Smartphone"
                />
              </div>
              <Button type="submit" disabled={isCreatingPrize} className="w-full uppercase tracking-widest font-sans">
                {isCreatingPrize ? <Loader2 className="w-4 h-4 animate-spin" /> : "Adicionar Prêmio"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-red-500/20 bg-red-500/5 backdrop-blur-sm shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-display uppercase tracking-wider text-red-500 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              Resetar Ganhadores
            </CardTitle>
            <CardDescription>
              Apaga permanentemente todos os registros de ganhadores.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="destructive"
              onClick={onReset}
              disabled={isResetting}
              className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 uppercase tracking-widest text-xs py-4"
            >
              {isResetting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resetar Ganhadores
                </>
              )}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">
              Os prêmios cadastrados NÃO serão apagados. Todos os participantes voltam a concorrer.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-md md:col-span-2 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-display uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-5 h-5 text-accent" />
              Prêmios & Ganhadores
            </CardTitle>
            <CardDescription>Prêmios cadastrados e ganhadores já sorteados.</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="border-border bg-secondary/30 hover:bg-secondary text-xs uppercase font-sans tracking-wider"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 border-t border-border/40 pt-6">
          {loading ? (
            <div className="py-16 flex justify-center items-center text-muted-foreground gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-accent" /> Carregando...
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {prizes.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    Nenhum prêmio cadastrado.
                  </p>
                ) : (
                  prizes.map((p) => {
                    const prizeWinners = winners.filter((w) => w.prize_id === p.id);
                    const isEditing = editingId === p.id;

                    return (
                      <div
                        key={p.id}
                        className="rounded-lg border border-border/40 bg-secondary/10 px-4 py-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          {isEditing ? (
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Input
                                type="number"
                                min={1}
                                value={editPosition}
                                onChange={(e) => setEditPosition(Math.max(1, Number(e.target.value) || 1))}
                                className="w-16 h-8 text-sm"
                              />
                              <span className="text-muted-foreground text-xs uppercase font-sans">º</span>
                              <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="flex-1 h-8 text-sm min-w-[120px]"
                                placeholder="Nome do prêmio"
                              />
                            </div>
                          ) : (
                            <span className="font-semibold">
                              {p.position}º Prêmio · {p.name}
                            </span>
                          )}

                          <div className="flex items-center gap-2 shrink-0">
                            {isEditing ? (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    if (!editName.trim()) {
                                      toast.warning("O nome do prêmio não pode ser vazio.");
                                      return;
                                    }
                                    onUpdate(p.id, editName, editPosition);
                                    setEditingId(null);
                                  }}
                                  className="h-8 text-xs px-3"
                                >
                                  Salvar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingId(null)}
                                  className="h-8 text-xs px-3"
                                >
                                  Cancelar
                                </Button>
                              </>
                            ) : (
                              <>
                                <span className="text-xs text-muted-foreground uppercase tracking-wider mr-1">
                                  {prizeWinners.length} ganhador(es)
                                </span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => {
                                    setEditingId(p.id);
                                    setEditName(p.name);
                                    setEditPosition(p.position);
                                  }}
                                  className="h-8 w-8 border-border bg-secondary/30 hover:bg-secondary text-muted-foreground hover:text-foreground"
                                  title="Editar prêmio"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => onDelete(p.id, p.name)}
                                  className="h-8 w-8 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20"
                                  title="Excluir prêmio"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        {prizeWinners.length > 0 && (
                          <ul className="mt-2 space-y-1 border-t border-border/30 pt-2">
                            {prizeWinners.map((w) => (
                              <li key={w.id} className="flex justify-between text-sm text-muted-foreground">
                                <span>{w.full_name}</span>
                                <span className="text-accent tabular-nums">
                                  {String(w.ticket_number).padStart(4, "0")}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
