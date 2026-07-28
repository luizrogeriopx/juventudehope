import { createFileRoute } from "@tanstack/react-router";
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
} from "@/lib/server-functions";
import { REGIONALS_DATA } from "@/lib/regionals";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel Admin | BURN Conference 2025" },
      { name: "description", content: "Administração de participantes do sorteio." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  // Authentication states
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPasswordHash, setAdminPasswordHash] = useState("");
  
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

  // Check authentication on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedEmail = localStorage.getItem("burn_admin_email") || "";
      const storedHash = localStorage.getItem("burn_admin_hash") || "";
      const storedIsTemp = localStorage.getItem("burn_admin_istemp") === "true";

      if (storedEmail && storedHash) {
        setAdminEmail(storedEmail);
        setAdminPasswordHash(storedHash);
        
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

        setAdminEmail(result.email);
        setAdminPasswordHash(result.passwordHash);

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

    setAdminEmail("");
    setAdminPasswordHash("");
    setIsTempPassword(false);
    setIsAuthenticated(false);
    setEmailInput("");
    setPasswordInput("");
    setNewPassword("");
    setConfirmPassword("");
    setParticipants([]);
    toast.info("Sessão encerrada.");
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
      "Nome Completo;Data Nascimento;CPF;E-mail;Telefone;Logradouro;Complemento;Bairro;Cidade;Estado;Regional;Congregação;Data Cadastro\n";

    filteredParticipants.forEach((p) => {
      const row = [
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
                BURN Conference 2025 · {adminEmail}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
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
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      Nenhum participante encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredParticipants.map((p) => {
                    const displayBirth = p.birthDate.split("-").reverse().join("/");

                    return (
                      <tr key={p.id} className="hover:bg-secondary/15 transition-colors">
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
      </div>
    </main>
  );
}
