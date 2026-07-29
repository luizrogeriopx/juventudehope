import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Flame,
  User,
  Calendar,
  CreditCard,
  Mail,
  Phone,
  MapPin,
  Church,
  ArrowLeft,
  CheckCircle2,
  Loader2,
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
import { REGIONALS_DATA } from "@/lib/regionals";
import { registerParticipant, getParticipantByCpf } from "@/lib/server-functions";
import { Participant } from "@/lib/types";

export const Route = createFileRoute("/sorteio")({
  head: () => ({
    meta: [
      { title: "Sorteio | BURN Conference 2025" },
      {
        name: "description",
        content: "Faça sua inscrição para participar do sorteio da BURN Conference.",
      },
    ],
  }),
  component: SorteioPage,
});

// CPF Checksum Validator
function validateCPF(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(clean)) return false; // Avoid 111.111.111-11

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i)) * (10 - i);
  }
  let result = sum % 11;
  let digit1 = result < 2 ? 0 : 11 - result;
  if (parseInt(clean.charAt(9)) !== digit1) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i)) * (11 - i);
  }
  result = sum % 11;
  let digit2 = result < 2 ? 0 : 11 - result;
  if (parseInt(clean.charAt(10)) !== digit2) return false;

  return true;
}

// CPF Formatter Mask
const formatCPF = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
    .substring(0, 14);
};

// Phone Formatter Mask
const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .substring(0, 14);
  } else {
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .substring(0, 15);
  }
};

const statesList = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const formSchema = z.object({
  fullName: z.string().min(3, "Nome completo deve ter pelo menos 3 caracteres"),
  birthDate: z.string().min(1, "Data de nascimento é obrigatória"),
  cpf: z.string().refine((val) => validateCPF(val), {
    message: "CPF inválido",
  }),
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(14, "Telefone inválido (mínimo de 10 dígitos com DDD)"),
  address: z.object({
    street: z.string().min(3, "Logradouro é obrigatório"),
    complement: z.string().optional(),
    neighborhood: z.string().min(2, "Bairro é obrigatório"),
    city: z.string().min(2, "Cidade é obrigatória"),
    state: z.string().length(2, "Selecione o estado"),
  }),
  regional: z.string().min(1, "Selecione a Regional"),
  congregation: z.string().min(1, "Selecione a Congregação"),
});

type FormValues = z.infer<typeof formSchema>;

function SorteioPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<Participant | null>(null);

  const [activeTab, setActiveTab] = useState<"register" | "query">("register");
  const [queryCpf, setQueryCpf] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryCpf) {
      toast.warning("Por favor, digite o seu CPF.");
      return;
    }

    const cleanCpf = queryCpf.replace(/\D/g, "");
    if (cleanCpf.length !== 11) {
      toast.error("CPF inválido. Deve conter 11 dígitos.");
      return;
    }

    setIsQuerying(true);
    setQueryError(null);
    setQueryResult(null);
    try {
      const response = await getParticipantByCpf({ data: { cpf: queryCpf } });
      if (response.success && response.participant) {
        setQueryResult(response.participant);
        toast.success("Inscrição localizada!");
      } else {
        setQueryError(response.error || "Inscrição não encontrada.");
        toast.error(response.error || "Inscrição não encontrada.");
      }
    } catch (error) {
      console.error(error);
      setQueryError("Erro de conexão com o servidor.");
      toast.error("Erro de conexão com o servidor. Tente novamente.");
    } finally {
      setIsQuerying(false);
    }
  };

  const handleQueryCPFInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setQueryCpf(formatted);
  };

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      birthDate: "",
      cpf: "",
      email: "",
      phone: "",
      address: {
        street: "",
        complement: "",
        neighborhood: "",
        city: "Aparecida de Goiânia",
        state: "GO",
      },
      regional: "",
      congregation: "",
    },
  });

  const selectedRegional = watch("regional");

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const response = await registerParticipant({ data: values });

      if (response.success && response.participant) {
        toast.success("Inscrição realizada com sucesso!");
        setRegisteredUser(response.participant);
      } else {
        toast.error(response.error || "Erro ao realizar inscrição.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro de conexão com o servidor. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCPFInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setValue("cpf", formatted, { shouldValidate: true });
  };

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setValue("phone", formatted, { shouldValidate: true });
  };

  if (registeredUser) {
    return (
      <main className="grain-bg min-h-screen flex items-center justify-center p-6 text-foreground">
        <Card className="w-full max-w-xl border-border/50 bg-card/65 backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 surface-ember" />
          <CardHeader className="text-center pt-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 border border-emerald-500/30">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <CardTitle className="text-3xl font-display uppercase tracking-wide text-primary">
              Confirmado!
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Você já está concorrendo aos sorteios da BURN Conference.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-secondary/30 border border-border p-5 space-y-4">
              <div className="flex justify-between items-start border-b border-border/40 pb-3 mb-1">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Participante</p>
                  <p className="text-lg font-medium text-foreground">{registeredUser.fullName}</p>
                </div>
                {registeredUser.ticketNumber && (
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wider text-accent font-semibold">Número da Sorte</p>
                    <p className="text-2xl font-display font-bold text-primary">#{registeredUser.ticketNumber}</p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">CPF</p>
                  <p className="text-sm font-medium text-foreground">{registeredUser.cpf}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Congregação</p>
                  <p className="text-sm font-medium text-foreground">
                    {registeredUser.congregation} ({registeredUser.regional})
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground space-y-1">
              <p>Guarde essa confirmação.</p>
              <p>Os sorteios acontecerão ao longo da BURN Conference.</p>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Button
                asChild
                className="surface-ember text-primary-foreground font-sans uppercase tracking-widest"
              >
                <Link to="/">Voltar para o Início</Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => setRegisteredUser(null)}
                className="border-border hover:bg-secondary text-foreground font-sans uppercase tracking-widest"
              >
                Cadastrar Novo Participante
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="grain-bg min-h-screen pb-16 text-foreground">
      {/* Navbar/Header */}
      <header className="border-b border-border/40 px-6 py-4 bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-6xl flex justify-between items-center">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-sans uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4 text-accent" /> Voltar
          </Link>
          <div className="flex items-center gap-2 font-display text-xl uppercase tracking-wider">
            <Flame className="w-5 h-5 text-accent animate-pulse" />
            <span>BURN <span className="text-muted-foreground text-sm font-sans tracking-widest ml-1">Conference</span></span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 pt-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display uppercase tracking-wider mb-2 bg-gradient-to-r from-orange-400 via-red-500 to-yellow-500 bg-clip-text text-transparent">
            {activeTab === "register" ? "Inscrição para Sorteio" : "Consultar Sorteio"}
          </h1>
          <p className="text-muted-foreground">
            {activeTab === "register"
              ? "Insira suas informações abaixo para se cadastrar nos sorteios da BURN Conference."
              : "Insira seu CPF para consultar seu número da sorte."}
          </p>
        </div>

        <Card className="border-border/50 bg-card/65 backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 surface-ember" />
          <CardContent className="pt-6">
            <div className="flex border-b border-border/40 mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("register");
                  setQueryError(null);
                  setQueryResult(null);
                }}
                className={`flex-1 pb-3 text-sm font-sans uppercase tracking-wider font-semibold border-b-2 transition-colors ${
                  activeTab === "register"
                    ? "border-accent text-accent"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Nova Inscrição
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("query")}
                className={`flex-1 pb-3 text-sm font-sans uppercase tracking-wider font-semibold border-b-2 transition-colors ${
                  activeTab === "query"
                    ? "border-accent text-accent"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Consultar Inscrição
              </button>
            </div>

            {activeTab === "register" && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Seção 1: Dados Pessoais */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-border/40 pb-2 mb-4">
                    <User className="w-4 h-4 text-accent" />
                    <h3 className="font-sans text-sm font-semibold uppercase tracking-wider text-accent">
                      Dados Pessoais
                    </h3>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome Completo</Label>
                    <Input
                      id="fullName"
                      placeholder="Seu nome completo"
                      className="bg-secondary/40 border-border text-foreground"
                      {...register("fullName")}
                    />
                    {errors.fullName && (
                      <span className="text-xs text-red-500 font-medium">{errors.fullName.message}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="birthDate">Data de Nascimento</Label>
                      <div className="relative">
                        <Input
                          id="birthDate"
                          type="date"
                          className="bg-secondary/40 border-border text-foreground pr-10"
                          {...register("birthDate")}
                        />
                      </div>
                      {errors.birthDate && (
                        <span className="text-xs text-red-500 font-medium">
                          {errors.birthDate.message}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        placeholder="000.000.000-00"
                        maxLength={14}
                        className="bg-secondary/40 border-border text-foreground"
                        {...register("cpf")}
                        onChange={handleCPFInput}
                      />
                      {errors.cpf && (
                        <span className="text-xs text-red-500 font-medium">{errors.cpf.message}</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="exemplo@email.com"
                        className="bg-secondary/40 border-border text-foreground"
                        {...register("email")}
                      />
                      {errors.email && (
                        <span className="text-xs text-red-500 font-medium">{errors.email.message}</span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone / WhatsApp</Label>
                      <Input
                        id="phone"
                        placeholder="(62) 99999-9999"
                        maxLength={15}
                        className="bg-secondary/40 border-border text-foreground"
                        {...register("phone")}
                        onChange={handlePhoneInput}
                      />
                      {errors.phone && (
                        <span className="text-xs text-red-500 font-medium">{errors.phone.message}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Seção 2: Endereço */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 border-b border-border/40 pb-2 mb-4">
                    <MapPin className="w-4 h-4 text-accent" />
                    <h3 className="font-sans text-sm font-semibold uppercase tracking-wider text-accent">
                      Endereço
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="address.street">Logradouro (Rua, Av.)</Label>
                      <Input
                        id="address.street"
                        placeholder="Rua, Av, Quadra..."
                        className="bg-secondary/40 border-border text-foreground"
                        {...register("address.street")}
                      />
                      {errors.address?.street && (
                        <span className="text-xs text-red-500 font-medium">
                          {errors.address.street.message}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address.complement">Complemento</Label>
                      <Input
                        id="address.complement"
                        placeholder="Apto, Sala, Qd..."
                        className="bg-secondary/40 border-border text-foreground"
                        {...register("address.complement")}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address.neighborhood">Bairro</Label>
                      <Input
                        id="address.neighborhood"
                        placeholder="Bairro"
                        className="bg-secondary/40 border-border text-foreground"
                        {...register("address.neighborhood")}
                      />
                      {errors.address?.neighborhood && (
                        <span className="text-xs text-red-500 font-medium">
                          {errors.address.neighborhood.message}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address.city">Cidade</Label>
                      <Input
                        id="address.city"
                        placeholder="Cidade"
                        className="bg-secondary/40 border-border text-foreground"
                        {...register("address.city")}
                      />
                      {errors.address?.city && (
                        <span className="text-xs text-red-500 font-medium">
                          {errors.address.city.message}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address.state">Estado</Label>
                      <Controller
                        name="address.state"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="bg-secondary/40 border-border text-foreground">
                              <SelectValue placeholder="UF" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border">
                              {statesList.map((uf) => (
                                <SelectItem key={uf} value={uf}>
                                  {uf}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.address?.state && (
                        <span className="text-xs text-red-500 font-medium">
                          {errors.address.state.message}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Seção 3: Eclesiástica */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 border-b border-border/40 pb-2 mb-4">
                    <Church className="w-4 h-4 text-accent" />
                    <h3 className="font-sans text-sm font-semibold uppercase tracking-wider text-accent">
                      Regional e Congregação
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="regional">Regional</Label>
                      <Controller
                        name="regional"
                        control={control}
                        render={({ field }) => (
                          <Select
                            onValueChange={(val) => {
                              field.onChange(val);
                              // Clear congregation if regional changes
                              setValue("congregation", "", { shouldValidate: false });
                            }}
                            value={field.value}
                          >
                            <SelectTrigger className="bg-secondary/40 border-border text-foreground">
                              <SelectValue placeholder="Selecione a Regional" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border max-h-[250px]">
                              {Object.keys(REGIONALS_DATA).map((reg) => (
                                <SelectItem key={reg} value={reg}>
                                  {reg}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.regional && (
                        <span className="text-xs text-red-500 font-medium">{errors.regional.message}</span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="congregation">Congregação</Label>
                      <Controller
                        name="congregation"
                        control={control}
                        render={({ field }) => (
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={!selectedRegional}
                          >
                            <SelectTrigger className="bg-secondary/40 border-border text-foreground disabled:opacity-50">
                              <SelectValue
                                placeholder={
                                  selectedRegional
                                    ? "Selecione a Congregação"
                                    : "Selecione a Regional primeiro"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border">
                              {selectedRegional &&
                                REGIONALS_DATA[selectedRegional]?.map((cong) => (
                                  <SelectItem key={cong} value={cong}>
                                    {cong}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.congregation && (
                        <span className="text-xs text-red-500 font-medium">
                          {errors.congregation.message}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botão de Envio */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full surface-ember text-primary-foreground font-sans font-bold py-6 text-base tracking-widest uppercase hover:-translate-y-0.5 transition-transform"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      "Cadastrar no Sorteio"
                    )}
                  </Button>
                </div>
              </form>
            )}

            {activeTab === "query" && (
              <form onSubmit={handleQuery} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-border/40 pb-2 mb-4">
                    <User className="w-4 h-4 text-accent" />
                    <h3 className="font-sans text-sm font-semibold uppercase tracking-wider text-accent">
                      Consulte seus dados
                    </h3>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="queryCpf">CPF do Participante</Label>
                    <Input
                      id="queryCpf"
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className="bg-secondary/40 border-border text-foreground"
                      value={queryCpf}
                      onChange={handleQueryCPFInput}
                      required
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isQuerying}
                    className="w-full surface-ember text-primary-foreground font-sans font-bold py-6 text-base tracking-widest uppercase hover:-translate-y-0.5 transition-transform"
                  >
                    {isQuerying ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Buscando...
                      </>
                    ) : (
                      "Consultar Inscrição"
                    )}
                  </Button>
                </div>

                {queryError && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 text-center animate-in fade-in duration-200">
                    {queryError}
                  </div>
                )}

                {queryResult && (
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-5 space-y-4 animate-in fade-in zoom-in duration-200">
                    <div className="flex justify-between items-start border-b border-border/40 pb-3 mb-1">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Participante</p>
                        <p className="text-lg font-medium text-foreground">{queryResult.fullName}</p>
                      </div>
                      {queryResult.ticketNumber && (
                        <div className="text-right">
                          <p className="text-xs uppercase tracking-wider text-accent font-semibold">Número da Sorte</p>
                          <p className="text-3xl font-display font-bold text-primary">#{queryResult.ticketNumber}</p>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">CPF</p>
                        <p className="font-medium text-foreground">{queryResult.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Congregação</p>
                        <p className="font-medium text-foreground">
                          {queryResult.congregation} ({queryResult.regional})
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
