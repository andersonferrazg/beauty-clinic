# CLAUDE.md — Beauty Clinic

Sistema de gestão para clínica de estética **LB Beauty Clinic** (Dra. Lunna Bordin).
**Nome do sistema:** Beauty Clinic (renomeado de "Lunnaagenda" — não usar o nome antigo na UI).
Arquitetura **SaaS multi-tenant** — projetado desde o início para ser vendido como produto para outras clínicas.

---

## Como rodar o projeto

```powershell
# Banco de dados (primeira vez)
npx prisma db push
npx prisma db seed   # cria tenant, admin, profissionais e status padrão

# Servidor de desenvolvimento
npm run dev          # http://localhost:3000

# Acesso na mesma rede Wi-Fi (celular)
# http://192.168.100.8:3000
# ATENÇÃO: requer que a porta 3000 esteja liberada no Windows Firewall:
# netsh advfirewall firewall add rule name="Lunnaagenda Dev Port 3000" dir=in action=allow protocol=TCP localport=3000
# (executar PowerShell como Administrador)
```

**Credenciais do admin local:**
- Email: `anderson@lbbeautyclinic.com`
- Senha: `admin123`

**Outras contas:**
- `lunna@lbbeautyclinic.com` / `lunna123`
- `beatriz@lbbeautyclinic.com` / `beatriz123`
- `leticia@lbbeautyclinic.com` / `leticia123`

Node.js está em `C:\Program Files\nodejs\node.exe` (não está no PATH por padrão — adicionar se necessário).

---

## Variáveis de ambiente (`.env`)

```env
DATABASE_PROVIDER="sqlite"           # sqlite (local) | postgresql (produção)
DATABASE_URL="file:./dev.db"         # SQLite local | URL Supabase em produção
SESSION_SECRET="string-aleatoria"    # OBRIGATÓRIO — usado para assinar os cookies de sessão
```

**Produção (Vercel):**
```env
DATABASE_PROVIDER="postgresql"
DATABASE_URL="postgresql://USER:PASS@HOST:5432/DB?sslmode=require"
SESSION_SECRET="gerar-com-openssl-rand-hex-32"
```

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16.2.6 (App Router) |
| UI | Tailwind CSS v4 + shadcn/ui (Radix UI) |
| Banco | SQLite via Prisma ORM 6 (dev) → Supabase PostgreSQL (produção) |
| Auth | Cookie HttpOnly `sessao` assinado com HMAC-SHA256 |
| Senhas | bcryptjs (hash + compare) |
| Linguagem | TypeScript 5 |
| Ícones | lucide-react |
| Node | v20+ em `C:\Program Files\nodejs\` |

---

## Estrutura de pastas

```
lunnaagenda/
├── prisma/
│   ├── schema.prisma            # modelos de dados (provider: sqlite local, postgresql prod)
│   ├── seed.ts                  # seed inicial (tenant + admin + profissionais + status)
│   ├── seed-financeiro.ts       # seed de lançamentos mai–dez 2026
│   ├── backfill-vencimento.ts   # backfill one-shot: corrige vencimento=null + reverte mal-finalizados
│   ├── backfill-taxa.ts         # backfill one-shot: aplica taxa retroativa em lançamentos sem valorBruto
│   └── hash-passwords.ts        # script one-shot para migrar senhas plain→bcrypt
├── scripts/
│   └── patch-schema.js          # troca provider sqlite→postgresql antes do build (Railway/Vercel)
├── src/
│   ├── app/
│   │   ├── (auth)/login/        # página de login
│   │   ├── (dashboard)/         # páginas protegidas (layout com sidebar)
│   │   │   ├── agenda/
│   │   │   ├── clientes/
│   │   │   ├── confirmacoes/    # envio manual de confirmações WhatsApp
│   │   │   ├── servicos/
│   │   │   ├── profissionais/
│   │   │   ├── produtos/
│   │   │   ├── financeiro/
│   │   │   ├── gastos/clinica/
│   │   │   ├── gastos/casa/
│   │   │   ├── comandas/
│   │   │   ├── comissoes/
│   │   │   ├── mensagens/
│   │   │   ├── configuracoes/
│   │   │   ├── prontuarios/
│   │   │   └── relatorios/
│   │   │       ├── performance/
│   │   │       ├── financeiro/
│   │   │       └── clientes/
│   │   └── api/
│   │       ├── auth/login/
│   │       ├── auth/logout/
│   │       ├── agendamentos/[id]/
│   │       ├── agendamentos/busca/      # busca por nome de cliente (GET ?nome=)
│   │       ├── clientes/[id]/
│   │       ├── servicos/[id]/
│   │       ├── profissionais/[id]/
│   │       ├── produtos/[id]/
│   │       ├── lancamentos/[id]/
│   │       ├── comissoes/
│   │       ├── comissoes/[id]/
│   │       ├── comissoes/pagar/
│   │       ├── movimentacoes-estoque/
│   │       ├── msgs-predefinidas/       # CRUD de templates WhatsApp
│   │       ├── msgs-predefinidas/[id]/
│   │       ├── prontuarios/[clienteId]/procedimentos/
│   │       ├── prontuarios/[clienteId]/fotos/
│   │       ├── status-agenda/
│   │       ├── backup/
│   │       ├── dashboard/
│   │       ├── fluxo-caixa/
│   │       ├── configuracoes/
│   │       └── relatorios/
│   │           ├── top-servicos/    # GET ?mes=YYYY-MM&futuros=true|false → top5, todos, total
│   │           ├── projecao/        # GET ?mes=YYYY-MM → agendamentos futuros como lancamentos sintéticos
│   │           ├── anual/           # GET ?ano=YYYY → 12 meses {mes, receita, despesa}[]
│   │           └── melhores-clientes/ # GET ?inicio=&fim=&tipo= → ranking de clientes
│   ├── components/
│   │   ├── ui/                  # button, input, label, card, badge (shadcn)
│   │   ├── agenda/
│   │   │   ├── BuscaCliente.tsx         # busca de agendamentos por nome, agrupada por data
│   │   │   └── PickerMensagens.tsx      # seletor de templates WhatsApp com preview e substituição de vars
│   │   ├── sidebar.tsx
│   │   ├── modal-agendamento.tsx
│   │   ├── modal-cliente.tsx
│   │   ├── modal-servico.tsx
│   │   ├── modal-profissional.tsx
│   │   ├── modal-seletor-ficha.tsx
│   │   ├── modal-ficha-anamnese.tsx
│   │   ├── modal-ficha-planejamento.tsx
│   │   ├── modal-ficha-termo.tsx
│   │   ├── modal-ficha-cartilha.tsx
│   │   ├── modal-ficha-controle-sessoes.tsx
│   │   ├── modal-fotos.tsx
│   │   ├── modal-importar-documento.tsx
│   │   └── canvas-assinatura.tsx
│   └── lib/
│       ├── prisma.ts            # singleton do Prisma Client
│       ├── session.ts           # getSessao() / exigirSessao() / criarCookieSessao()
│       ├── finalizar-agendamento.ts  # lógica de receita + comissão + estoque
│       ├── templateVars.ts      # substituição de variáveis em templates WhatsApp
│       ├── termos.ts            # textos dos 12 termos de consentimento
│       ├── cartilhas.ts         # textos das 11 cartilhas pós-procedimento
│       └── utils.ts             # cn() helper (clsx + tailwind-merge)
```

---

## Autenticação e sessão

Toda a auth é feita via **cookie HttpOnly** chamado `sessao` **assinado com HMAC-SHA256**.

```typescript
// src/lib/session.ts
type Sessao = {
  usuarioId: string;
  tenantId: string;
  nome: string;
  email: string;
  isAdmin: boolean;
  profissionalId: string | null;
};
```

**Formato do cookie:** `<JSON-base64>.<hmac-sha256-hex>`
O HMAC é calculado com `SESSION_SECRET` (variável de ambiente obrigatória).
Qualquer cookie não assinado ou adulterado é rejeitado silenciosamente.

**Senhas:** armazenadas como hash bcrypt (custo 10) via `bcryptjs`.
O login usa `bcrypt.compare(senha, hash)` — nunca comparação direta.

**Em toda API route protegida:**
```typescript
import { exigirSessao } from "@/lib/session";

export async function GET() {
  const sessao = await exigirSessao(); // lança 401 se não autenticado
  // todas as queries usam sessao.tenantId para isolar dados do tenant
}
```

`getSessao()` retorna `null` se não autenticado ou cookie inválido.
`exigirSessao()` lança erro 401 se não autenticado.
`criarCookieSessao(sessao)` retorna o valor assinado para setar no cookie.

---

## Deploy (Vercel + Supabase) ✅ PRODUÇÃO ATIVA

**URL de produção:** `https://beauty-clinic-beige.vercel.app`
**GitHub:** `https://github.com/andersonferrazg/beauty-clinic` (push para `main` → auto-deploy)
**Supabase project ref:** `vbtqittceshebajqpjzw`

### Histórico
- **Antes (até 2026-05-19):** Railway (`beauty-clinic-production-d893.up.railway.app`)
- **Por que migrou:** Railway está no plano TRIAL gratuito ($5 de crédito); quando o crédito acabou, deploys foram pausados ("Limited Access"). Migrado para Vercel (plano Hobby/Passatempo, gratuito).
- **Railway ainda existe** mas não é mais usado; pode ser deletado quando Anderson decidir.

### Preparação do código (já feito)
- `scripts/patch-schema.js` — troca `provider = "sqlite"` → `"postgresql"` quando `DATABASE_PROVIDER=postgresql` (já escrito pensando em Vercel, comentário no topo do arquivo)
- `package.json` build: `node scripts/patch-schema.js && prisma generate && next build`
- `package.json` postinstall: `prisma generate` (necessário para Vercel gerar o client)
- `.env.example` — template das variáveis de produção
- **Sem arquivos específicos de Vercel** — detecção automática de Next.js

### Variáveis no Vercel (configuradas em Environment Variables, ambientes "Produção e Pré-visualização")
```
DATABASE_PROVIDER=postgresql
DATABASE_URL=postgresql://postgres.vbtqittceshebajqpjzw:%2ALa191218mari@aws-1-sa-east-1.pooler.supabase.com:5432/postgres
SESSION_SECRET=<string aleatória gerada via openssl rand -hex 32>
```

**IMPORTANTE sobre o DATABASE_URL:**
- Usar **session pooler** (`pooler.supabase.com:5432`), NÃO a conexão direta (`db.xxx.supabase.co:5432`)
- A conexão direta do Supabase tem mais restrições para conexões externas
- O `*` na senha deve ser URL-encoded como `%2A`
- Formato: `postgresql://postgres.{PROJECT_REF}:{SENHA_ENCODED}@aws-1-sa-east-1.pooler.supabase.com:5432/postgres`

### Fluxo de deploy
- Vercel conectado ao GitHub (`main` branch) — **auto-deploys** a cada push
- Painel: https://vercel.com/andersonferrazg/beauty-clinic
- Cada deploy fica acessível por URL única (ex: `clínica-de-beleza-69oe6tc9w-andersonferrazg.vercel.app`); a URL "estável" é `beauty-clinic-beige.vercel.app`
- Para re-deployar manualmente: Vercel → projeto → Deployments → menu `⋯` no deploy → "Redeploy"

### Seed em produção (já executado)
O banco Supabase já tem schema e dados seed. Se precisar refazer:
```powershell
# Com DATABASE_URL apontando para o Supabase (não sqlite)
$env:DATABASE_URL="postgresql://postgres.vbtqittceshebajqpjzw:%2ALa191218mari@aws-1-sa-east-1.pooler.supabase.com:5432/postgres"
$env:DATABASE_PROVIDER="postgresql"
npx prisma db push
npx tsx prisma/seed.ts
```

---

## Multi-tenant

**Todas as tabelas principais têm `tenantId`.**
Toda query ao banco deve filtrar por `tenantId`:

```typescript
const clientes = await prisma.cliente.findMany({
  where: { tenantId: sessao.tenantId, ativo: true },
});
```

O tenant da LB Beauty Clinic foi criado via seed com slug `lb-beauty-clinic`.
O campo `ativo` existe em `Tenant`, `Usuario`, `Profissional`, `Cliente`, `Servico`, `Produto` — nunca deletar fisicamente, usar `ativo: false` (soft delete).

---

## Padrões importantes de código

### Parâmetros dinâmicos (Next.js 15+)

```typescript
// CORRETO — params é uma Promise no Next.js 15+
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

### Soft delete

```typescript
// Nunca usar prisma.cliente.delete() — sempre:
await prisma.cliente.update({ where: { id }, data: { ativo: false } });
```

### Timezone (BUG CORRIGIDO — não reverter)

O modal de agendamento usa campos **Data** e **Hora Início separados** (não `datetime-local`).
Isso evita o bug de fuso horário onde `datetime-local` + `.toISOString().slice(0,16)` causava desvio de 3h (UTC-3).

**Padrão correto no modal-agendamento.tsx:**
```typescript
const [dataStr, setDataStr] = useState("2026-05-15");   // date input
const [horaStr, setHoraStr] = useState("09:00");         // time input
const inicioISO = new Date(`${dataStr}T${horaStr}`).toISOString(); // ao salvar
```

**Ao carregar agendamento existente (UTC → local):**
```typescript
const d = new Date(ag.inicio);
setDataStr(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`);
setHoraStr(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
```

**Nunca usar** `datetime-local` com `.toISOString().slice(0,16)` — isso voltaria o bug.

### PATCH de agendamentos — campo `tipo` é UI-only

O body do modal inclui `tipo` ("agendamento" | "bloqueio"), mas esse campo **não existe no schema Prisma**.
O PATCH handler **desestrutura e descarta `tipo` explicitamente** — nunca passar direto ao Prisma.
O mesmo vale para `motivoBloqueio` — mapeado para `observacao` no banco.

### Profissional terceiro — não gera financeiro

Quando `Profissional.profissionalTerceiro = true`, a função `finalizar` em `src/lib/finalizar-agendamento.ts` **retorna cedo** após marcar `dataRealizado`, **sem** criar `Lancamento` de RECEITA, **sem** criar `ComissaoLancamento` e **sem** dar baixa de estoque. Isso é intencional — esses profissionais pagam aluguel do espaço por fora e não devem entrar no DRE da clínica.

Se for adicionar nova lógica em `finalizar()` (ex: integração contábil, notificação), respeitar o early-return.

### Regras financeiras críticas (não reverter)

**`Lancamento.vencimento` = data do atendimento, NÃO data de gravação:**
Em `src/lib/finalizar-agendamento.ts`, o lançamento é criado com `vencimento: agendamento.inicio`.
Isso garante que o Fluxo Diário e os relatórios mostrem a receita no dia correto do atendimento.
Se `vencimento` for `null`, o sistema cai para `criadoEm` (data de finalização), que pode ser dias depois — errado.

**`StatusAgenda.contaConfirmado = true` SOMENTE no status "Finalizado":**
O flag `contaConfirmado` determina se um agendamento gera receita real no financeiro.
Apenas "Finalizado" deve ter `contaConfirmado: true`. Qualquer outro status ("Confirmado", "Aguardando", etc.) deve ter `false`.
Se "Confirmado" receber `true`, agendamentos futuros já marcados como "Confirmado" gerarão lancamentos de receita reais — erro grave.
O seed aplica isso idempotentemente (`await prisma.statusAgenda.update({ data: { contaConfirmado: s.contaConfirmado } })`).

**Taxa por forma de pagamento (`FormaPagamento.percentualTaxa` / `configJson`):**
Ao finalizar, `finalizar-agendamento.ts` busca a `FormaPagamento` pelo nome e calcula:
- Cartão de Crédito: usa `configJson` por parcelas. `profissional.configJsonCartao` tem prioridade sobre o global.
- Demais formas: usa `percentualTaxa` plano.
- Fórmula: `taxaValor = Math.round(valorBruto × (taxaPercentual / 100) × 100) / 100`
- Lançamento grava: `valor = valorLiquido`, `valorBruto`, `taxa`, `percentualTaxa`.
- Sem taxa configurada: todos os campos ficam `null` e `valor = valorBruto`.

**Backfills já executados em produção (Supabase):**
- `prisma/backfill-vencimento.ts` — reverteu 4 agendamentos mal-finalizados ("Confirmado") e corrigiu `vencimento=null` em 12 lançamentos.
- `prisma/backfill-taxa.ts` — aplicou taxa retroativa em lançamentos Débito/Link sem `valorBruto`.
Esses scripts são idempotentes e podem ser re-executados com segurança se necessário.

### iOS Safari — sticky dentro de overflow (BUG CONHECIDO — não reverter)

`position: sticky` dentro de um container `overflow: auto` **não renderiza no iOS Safari** até o usuário interagir (tocar/arrastar). Também `overflow: hidden` em qualquer ancestral bloqueia o paint de filhos sticky.

**Solução correta:** mover o elemento sticky para FORA do container de scroll, como irmão/ancestral dele.

Na `/agenda`, os nomes das profissionais são renderizados numa segunda linha dentro da barra de navegação semanal (que é sticky no layout externo), e não dentro do `overflow-auto` do grid. Os nomes usam `pl-11` (44px) para compensar a coluna de horários (56px) menos o `px-3` (12px) do container pai.

**Nunca** tentar colocar cabeçalho de colunas como sticky dentro do grid da agenda — o iOS não vai mostrar.

### Modais responsivos (mobile-first)

Todo modal deve usar esta estrutura para funcionar bem em celular e iPad:
```jsx
<div className="... max-h-[90dvh] flex flex-col">
  <div className="flex-shrink-0 ...">/* cabeçalho */</div>
  <div className="flex-1 overflow-y-auto overscroll-contain p-2 sm:p-4">/* corpo */</div>
  <div className="flex-shrink-0 ...">/* rodapé com botões */</div>
</div>
```
- `max-h-[90dvh]` (não `vh`) — `dvh` desconta a barra de endereço do iOS Safari
- `overscroll-contain` — evita que o scroll do modal propague para a página

### localStorage e SSR (BUG CORRIGIDO — não reverter)

Nunca acessar `localStorage` dentro de `useState()` ou durante o render — causa erro de hidratação.
Sempre usar `useEffect` para leitura de `localStorage`:

```typescript
// CORRETO
const [dataAtual, setDataAtual] = useState(new Date()); // SSR-safe
useEffect(() => {
  const salvo = localStorage.getItem("agendaData");
  if (salvo) { const d = new Date(salvo + "T12:00"); if (!isNaN(d.getTime())) setDataAtual(d); }
}, []);
```

---

## Páginas construídas

### `/agenda`
- Grade visual por profissional (colunas) e slots de **30 minutos** (linhas)
- **Faixa de semana começa no DOMINGO** — fórmula: `seg.setDate(data.getDate() - data.getDay())`
- **Nomes das profissionais** exibidos numa segunda linha dentro da barra semanal fixa (sticky), fora do container de scroll — solução para o bug de iOS Safari que não renderiza `position: sticky` dentro de `overflow: auto`
- **Colunas com `min-w-[100px]`** (antes 180px) para que 2–4 profissionais caibam na tela do celular sem scroll horizontal, alinhando os nomes com as colunas
- Linhas cheias nas horas, linhas tracejadas nas meias horas — **ambas com label de horário** (horas em texto normal, meias horas em texto menor e mais claro)
- Clique em slot → abre `ModalAgendamento` com hora exata
- Clique em bloco existente → abre `ModalAgendamento` para edição/exclusão
- Linha vermelha do horário atual (só hoje)
- **Botão "+" flutuante** (FAB dourado) no canto inferior direito
- **Data persistida no localStorage** — ao navegar para outra aba e voltar, mantém o dia selecionado
- Botão "Hoje" restaura para a data atual
- Link WhatsApp usa `https://web.whatsapp.com/send?phone=...&text=...` — garante emojis corretos no WhatsApp Desktop Windows
- Template da mensagem WhatsApp carregado das configurações do tenant
- **Header mobile** (`lg:hidden`) — barra fixa no topo com ícone lupa (abre `BuscaCliente`), ícone calendário (abre `CalendarioPopup`) e botão "Hoje". Posicionado em `z-20`; hamburger do sidebar flutua sobre ele em `z-50`
- **`BuscaCliente`** — overlay de busca de agendamentos por nome de cliente. Mobile: tela cheia. Desktop: painel flutuante 420px no canto superior direito. Resultados agrupados por data (mais recente no topo), datas futuras em vermelho. Clique na data navega a agenda; clique no agendamento navega e abre o modal. Rota: `/api/agendamentos/busca?nome=`
- **Botões de dia**: `min-w-[38px] sm:min-w-[42px]`, `px-1 sm:px-2` — garante que todos os 7 dias cabem em iPhone 12 (390px)

### `/clientes`
- **Carrega TODOS os clientes** ao abrir (sem limite) via `?todos=true`; busca em tempo real usa `?q=` com debounce 300ms
- **Separadores alfabéticos** — linha dourada com a letra inicial entre cada grupo de clientes (A, B, C...)
- Botão "Nova Cliente" → abre `ModalCliente`
- Clique em linha → edição via `ModalCliente`
- Modal tem abas: **Dados** e **Histórico** (últimos 10 atendimentos)
- **CPF com máscara automática** — formata para `000.000.000-00` ao digitar
- Botão "Exportar" gera CSV com nome, telefone e aniversário
- Redireciona para `/dashboard` se o usuário não tiver `acessarClientes`

### `/confirmacoes`
- Página para envio manual de confirmações WhatsApp
- Lista agendamentos do dia seguinte (ou data selecionada) com telefone e status de envio
- Gera link `web.whatsapp.com` com mensagem pré-preenchida usando template das configurações
- Admin vê todos os profissionais; profissional vê só os seus

### `/servicos`
- Lista agrupada por categoria
- CRUD via `ModalServico` (nome, categoria com autocomplete, duração em pílulas, preço, cor, precoVariavel)
- `ModalServico`: ao criar novo serviço, avisa em amarelo se existir serviço com nome parecido (normalização NFD + Levenshtein ≤ 2 para capturar typos e abreviações como "Lash lifth" × "Lash Lift")

### `/dashboard`
- Página inicial após login
- **Admin:** 4 KPIs do mês (receita, gastos totais, lucro, comissões pendentes) + agenda do dia + contas vencendo em 7 dias + aniversariantes do mês + comparativo financeiro + faturamento por profissional (barras)
  - "Despesas mês" = `gastosClinicaMes + gastosPessoalMes` (total por vencimento — inclui a pagar)
  - "Lucro mês" = `receita − gastosClinicaMes − gastosPessoalMes`
  - Os totais de gastos vêm de `/api/dashboard` que agrega por `vencimento` (não por `pago=true`)
  - `faturamentoPorProfissional` calculado a partir das `ComissaoLancamento.valorBase` do mês
  - Aniversariantes: SQL nativo `EXTRACT(MONTH FROM dataNascimento)` no Postgres; fallback JS no SQLite
  - Queries do bloco admin paralelizadas com `Promise.all`
- **Profissional:** agenda do dia + atendimentos do mês + comissão pendente do mês

### `/profissionais`
- Cards com cor individual de cada profissional
- CRUD via `ModalProfissional`:
  - Tipo de comissão: PERCENTUAL / SALARIO_FIXO / INTEGRAL / SEM_COMISSAO
  - Direção: CLINICA_PAGA (clínica repassa) ou COLABORADORA_PAGA (colaboradora paga à clínica)
  - Frequência de acerto: Diário / Semanal / 15 dias / Mensal

### `/produtos`
- Tabela com alertas visuais: estoque baixo (amarelo), vencendo em 30 dias (laranja), vencidos (vermelho)
- Modal com 2 abas: **Dados** e **Movimentações** (histórico + registrar entrada/ajuste manual)
- **Campo "Custo"** visível apenas para admin ou usuário com `acessarFinanceiro` — a API também stripa `precoCusto` da resposta para quem não tem permissão
- Página redireciona para `/dashboard` se o usuário não tiver `acessarProdutos`

### `/financeiro`
- Filtro por mês, toggle RECEITA / DESPESA, marcar como pago/não pago
- Cards DRE no topo (receita, despesas, lucro líquido)
- Abas: Lançamentos | Gastos Clínica | Gastos Pessoal | Fluxo de Caixa

### `/comandas`
- Visão mensal de todos os atendimentos com totais por dia

### `/comissoes`
- **Admin:** extrato por profissional × mês com filtros de status, seletor de profissional, KPIs (total pendente, total pago, total selecionado), checkboxes de seleção em lote, botão "Marcar como pago" → cria Lancamento DESPESA (CLINICA_PAGA) ou RECEITA (COLABORADORA_PAGA), edição individual (lápis)
- **Profissional:** vê apenas as próprias comissões, sem seletor de profissional, sem checkboxes, sem botão "Marcar como pago" — só consulta e edição individual se tiver permissão `marcarComissaoPaga`

### `/gastos/clinica` e `/gastos/casa`
- Planilha mensal de gastos fixos com filtro de mês, cards de totais (Total / Pago / A pagar)
- CRUD inline: adicionar, editar (clique na linha), excluir com confirmação

### `/configuracoes`
- **4 abas:**
  - **Dados da Clínica** — nome, CNPJ, telefone, endereço, link NFSe
  - **Agenda & WhatsApp** — horário de funcionamento (Início/Fim, default 06:00–21:00), intervalo de horários (15/30/60 min), horário de envio, template de confirmação WhatsApp (variáveis `{primeiro_nome}`, `{dia_semana}`, `{data_curta}`, `{hora}`), **template de mensagem de aniversário** (variáveis `{primeiro_nome}`, `{tenant_nome}`) — salvo em `TenantConfig.mensagemAniversarioWpp`
  - **Status de Agenda** — visualização dos status cadastrados (customização avançada futura)
  - **Backup** — exporta todos os dados do sistema em JSON via `/api/backup`

### `/mensagens`
- CRUD completo de templates WhatsApp pré-definidos, salvos no banco por tenant
- Tela vazia oferece botão "Carregar templates padrão" (popula 4 templates de uma vez via POST)
- Editar: clique no template → botão Editar → editar nome + texto → Salvar
- Preview com bolha do WhatsApp mostrando `{nome_clinica}` substituído
- Excluir com confirmação
- Variáveis disponíveis: `{nome_cliente}`, `{primeiro_nome}`, `{nome_clinica}`, `{data}`, `{dia_semana}`, `{data_curta}`, `{hora}`, `{hora_fim}`, `{servico}`, `{profissional}`, `{valor_total}`
- 4 templates criados automaticamente via seed se o tenant ainda não tiver nenhum: Confirmação de Agendamento, Lembrete no Dia, Pós-Atendimento, Cancelamento
- Templates são isolados por tenant (multi-tenant)

### `/relatorios/performance`
- Abas **EMPRESA** | **PROFISSIONAIS**
- Filtros de período: Mês Atual / Semana Atual / Hoje / Mês Passado / Personalizado
- **Somente atendimentos finalizados** (`dataRealizado != null`) entram nos cálculos — agendamentos "Confirmados" ou de qualquer outro status não-finalizado são ignorados
- Despesas operacionais do período buscadas via `/api/lancamentos?tipo=DESPESA` para cada mês do range; exclui Gastos Casa e Comissões. Lucro = Faturamento − Despesas
- Aba Empresa: gráfico de barras Receita/Despesa/Lucro + KPIs (atendimentos, ticket médio, clientes únicos, horas)
- Aba Profissionais: cards individuais com atendimentos, faturamento, ticket médio, horas, top 3 serviços
- **Exportação CSV** disponível

### `/relatorios/financeiro`
- **3 abas:** Resumo (DRE) | Fluxo Diário | Anual
- **DRE (Resumo):**
  - Receitas finalizadas + Projeção (quando toggle ativo) separadas no cálculo
  - Breakdown por forma de pagamento (Dinheiro, PIX, Crédito, Débito, Link, Cheque, Cortesia)
  - Breakdown de receitas e despesas por categoria com barra de progresso
  - Comissões geradas × pagas × pendentes (linha separada)
  - Top 5 serviços do mês com opção "Ver todos" (modal com tabela ordenável por Qtd ou Receita)
  - Indicadores anuais: Melhor Mês, Pior Mês, Ganho Médio (baseados em `/api/relatorios/anual`)
- **Toggle "Ver projeção"** — inclui agendamentos futuros não-finalizados como receita projetada (excluídos cancelados/não-compareceram). Faixa de aviso amarela com spinner durante o carregamento. Projetos aparecem no Fluxo Diário e DRE sem alterar os valores reais
- **Fluxo Diário:** grade de 31 dias com receita/despesa/resultado por dia. Despesas mostradas por `vencimento` (não só pagas) — inclui a pagar. Clique no dia abre modal com lista de lançamentos filtráveis por forma de pagamento
- **Anual:** matriz 12 meses com receita, despesa e saldo. Seletor de ano. Indicadores Melhor/Pior/Médio calculados apenas sobre meses com receita > 0
- **Exportação CSV** disponível

### `/relatorios/clientes` — Melhores Clientes
- KPIs: Total de Clientes (ativos) e Novos no Período
  - **"Novos no período"** = clientes cujo **primeiro atendimento finalizado** ocorreu dentro do período selecionado (não pela data de cadastro, pois os 350+ clientes foram importados de uma vez)
- Ranking top 30 por Receita ou por Atendimentos
- Filtros: Mês atual / Mês passado / 3 meses / 6 meses / 12 meses / Este ano / Personalizado
- **Exportação CSV** disponível

---

## API Routes

Todas as rotas seguem o padrão REST e retornam JSON.
Todas exigem `exigirSessao()` — sem sessão retorna 401.

| Rota | Métodos | Descrição |
|---|---|---|
| `/api/auth/login` | POST | Login com bcrypt; cria cookie `sessao` assinado com HMAC |
| `/api/auth/logout` | POST | Remove cookie `sessao` |
| `/api/agendamentos` | GET, POST | Lista por `?data=YYYY-MM-DD` |
| `/api/agendamentos/[id]` | GET, PATCH, DELETE | PATCH ignora campo `tipo` (UI-only) |
| `/api/clientes` | GET, POST | Lista com `?q=busca`; `?todos=true` retorna todos sem limite (padrão: primeiros 30) |
| `/api/clientes/[id]` | GET, PATCH, DELETE | Soft delete; GET inclui últimos 10 agendamentos |
| `/api/servicos` | GET, POST | Lista todos ativos |
| `/api/servicos/[id]` | GET, PATCH, DELETE | Soft delete |
| `/api/profissionais` | GET, POST | Lista todos ativos |
| `/api/profissionais/[id]` | GET, PATCH, DELETE | Soft delete |
| `/api/produtos` | GET, POST | Lista com `?q=busca` |
| `/api/produtos/[id]` | PATCH, DELETE | Soft delete |
| `/api/lancamentos` | GET, POST | Lista com `?mes=YYYY-MM&tipo=RECEITA\|DESPESA` |
| `/api/lancamentos/[id]` | PATCH, DELETE | Hard delete |
| `/api/status-agenda` | GET, POST | Status customizáveis do tenant |
| `/api/configuracoes` | GET, PATCH | Configurações do tenant (inclui mensagemConfirmacaoWpp e urlNFSe) |
| `/api/backup` | GET | Exporta todos os dados do tenant em JSON |
| `/api/prontuarios/[clienteId]/procedimentos` | GET, POST | Fichas do prontuário |
| `/api/prontuarios/[clienteId]/fotos` | GET, POST, DELETE | Galeria de fotos |
| `/api/comissoes` | GET | Lista comissões com filtros (mes, profissionalId, pago) |
| `/api/comissoes/[id]` | PATCH | Edita valor, percentual, pago, pagoEm |
| `/api/comissoes/pagar` | POST | Marca lote como pago; cria Lancamento conforme direção |
| `/api/movimentacoes-estoque` | GET, POST | Lista por produtoId; cria ENTRADA ou AJUSTE manual |
| `/api/dashboard` | GET | KPIs, agenda, contas, aniversários em uma chamada |
| `/api/fluxo-caixa` | GET | Projeção de saldo 30/60/90 dias |
| `/api/orcamentos` | GET, POST | Lista com `?q`, `?status`, `?profissionalId`; cria orçamento |
| `/api/orcamentos/[id]` | GET, PATCH, DELETE | Busca / edita / remove orçamento |
| `/api/orcamentos/from-planejamento` | POST | Converte planejamento visual em orçamento pré-preenchido |
| `/api/tenant-publico` | GET | Nome da clínica sem auth (usado em páginas de impressão) |
| `/api/agendamentos/busca` | GET | Busca agendamentos por nome de cliente (`?nome=`, `?limite=`, máx 100). Case-insensitive no PostgreSQL |
| `/api/msgs-predefinidas` | GET, POST | Lista e cria templates WhatsApp por tenant |
| `/api/msgs-predefinidas/[id]` | PATCH, DELETE | Edita nome/texto/ordem ou remove template |
| `/api/relatorios/top-servicos` | GET | `?mes=YYYY-MM&futuros=true` → `{ top5, todos, total, totalQtd }` agrupados por serviço |
| `/api/relatorios/projecao` | GET | `?mes=YYYY-MM` → agendamentos futuros não-finalizados como lancamentos sintéticos (`projetado: true`) |
| `/api/relatorios/anual` | GET | `?ano=YYYY` → array de 12 meses com `{ mes, receita, despesa }` |
| `/api/relatorios/melhores-clientes` | GET | `?inicio=YYYY-MM-DD&fim=YYYY-MM-DD&tipo=receita\|atendimentos` → ranking top 30 + total + novos |

---

## Componentes modais

Todos os modais usam **overlay fixo** (não Radix Dialog) — `fixed inset-0 z-50`.

### `ModalAgendamento`
- Título "Criando/Editando Atendimento" + radio buttons Agendamento/Bloqueio
- **Data** e **Hora Início** como campos separados (não datetime-local — ver seção Timezone)
- Busca de cliente com autocomplete (debounce 300ms)
- Busca de serviço e produto com autocomplete por linha
- Total inline ao lado dos botões
- **Duração** como `<select>` dropdown
- Status por pílulas coloridas
- "Mais campos" colapsável (pagamento, observação)
- Botão de exclusão com confirmação inline (só em edição)
- **Painel "Emitir Nota Fiscal"** — aparece somente em agendamentos finalizados (com `lancamentoId`). Exibe 7 campos prontos para copiar (Tomador, CPF, Prestador, CNPJ, Serviços, Valor, Data) + botão "Abrir sistema de NF" se `urlNFSe` estiver configurado nas Configurações.
- **Botão WhatsApp** (ícone verde `MessageSquare`) — aparece no rodapé apenas quando há cliente com telefone cadastrado e tipo = "agendamento". Abre `PickerMensagens` com as variáveis do agendamento já preenchidas (`clienteTelefone` armazenado no state ao selecionar o cliente).

### `ModalCliente`
- Abas: Dados | Histórico de Atendimentos
- Campos: nome, telefone1, telefone2, email, CPF (com máscara 000.000.000-00), RG, sexo, data nascimento, endereço, observação

### `ModalServico`
- Campos: nome, categoria (autocomplete), duração (pílulas), preço, cor, precoVariavel (toggle)
- **Aviso de similaridade** (só na criação): carrega lista de serviços existentes ao abrir e compara o nome digitado em tempo real por normalização NFD + Levenshtein ≤ 2. Exibe aviso amarelo sem bloquear o salvamento.

### `ModalProfissional`
- **Identificação:** nome, especialidade, registro profissional (CRM/CRBM/CRF), email de contato, telefone, cor (color picker)
- **Acesso ao Sistema** (espelhando minhaagendaapp):
  - Toggle INVERSO "Não preciso de usuário/senha" (padrão = tem login)
  - E-mail de login (único por tenant)
  - Senha temporária (obrigatória na criação, opcional em edição)
  - **Permissões** — multi-select com 14 flags agrupadas em ESPECIAL / AGENDA / MÓDULOS (Administrador desabilita os outros e liga tudo)
  - Cria `Profissional` + `Usuario` + `UsuarioPermissao` em uma única transação
- **Documento:** radio CPF / CNPJ com máscara automática
- **Não Possui Agenda:** toggle inverso — quando marcado, profissional NÃO aparece como coluna na `/agenda` (útil pra recepção/admin)
- **Tipo de comissão:** PERCENTUAL / SALARIO_FIXO / INTEGRAL / SEM_COMISSAO, com direção (CLINICA_PAGA / COLABORADORA_PAGA) e frequência de acerto (Diário/Semanal/15 dias/Mensal)
- **Opções avançadas (colapsável):**
  - **Profissional terceiro** — atendimentos NÃO geram receita/comissão/baixa de estoque no financeiro da clínica (útil para profissionais que pagam aluguel)
- Preview do avatar com inicial e cor escolhida

---

## Fase 2 — Prontuário (CONCLUÍDA ✅)

### O que foi construído
- **Página `/prontuarios`** com busca de pacientes
- **Página `/prontuarios/[clienteId]`** com card de dados pessoais editável (nome, RG, CPF, endereço, telefone, sexo)
- **Galeria de Fotos** agrupada por tag (Antes/Durante/Depois/Evolução) com upload múltiplo
- **Sistema de fichas modular** — 27 tipos via "Nova Ficha":
  - **Avaliação:** Anamnese Avançada (40 perguntas), Planejamento de Procedimentos, Controle de Sessões
  - **12 Termos de Consentimento:** Botox, Preenchimento, Bioestimuladores, Skinbooster, Fios PDO, Peeling, Microagulhamento, Intradermoterapia, PEIM, Enzimas, Rinomodelação, Contrato Geral
  - **11 Cartilhas Pós-procedimento** (mesmas categorias)
  - **Documentos:** Autorização de Uso de Imagem, Digitalizar Documento em Papel
- **Assinaturas digitais** no touch via `<CanvasAssinatura>`
- **Páginas de impressão** dedicadas
- **Registro profissional** aparece sob a assinatura na impressão

### Schema implementado (Fase 2)
- `Prontuario`, `Procedimento`, `Foto`
- `Cliente` ganhou `rg` e `sexo`
- `Profissional` ganhou `registro`

---

## Fase 3 — Financeiro + Comissões + Estoque (CONCLUÍDA ✅)

### O que foi construído
- **Receitas automáticas** ao finalizar agendamento → cria `Lancamento` + `ComissaoLancamento` + baixa estoque (transação atômica em `src/lib/finalizar-agendamento.ts`)
- **Reversão** de finalização (impede se comissão já foi paga)
- **Comissões** com extrato, edição individual e pagamento em lote
- **Direção de comissão**: `CLINICA_PAGA` ou `COLABORADORA_PAGA`
- **Gastos Clínica / Gastos Pessoal** com seed de mai–dez 2026
- **Fluxo de caixa** com projeção 30/60/90 dias
- **DRE** com linha separada de comissões
- **Controle de estoque** com alertas de validade e estoque mínimo
- **Recorrência automática** de lançamentos mensais

---

## Fase 4 — Dashboard + Relatórios (CONCLUÍDA ✅)

- **Dashboard** com KPIs, agenda do dia, contas vencendo, aniversariantes, faturamento por profissional
- **Relatórios** com exportação CSV (performance, financeiro, clientes)
- **Backup completo** em JSON via `/api/backup` (botão nas Configurações)
- **PWA icons** dinâmicos via `/api/icons/[size]` (ImageResponse)

---

## Fase 5 — Correções pós-deploy + Cadastro com login (CONCLUÍDA ✅)

Commit `4db946d` — entregue após o sistema entrar em produção no Railway. Foco em alinhar o sistema com o fluxo do `minhaagendaapp` e preparar terreno multi-tenant SaaS.

### O que foi construído
- **Busca de clientes case-insensitive** (`mode: "insensitive"` no PostgreSQL) — buscar "lunna", "LUNNA" e "Lunna" retorna os mesmos resultados
- **Horário de funcionamento da agenda configurável por tenant** — novos campos `horaInicioAgenda` (default 6) e `horaFimAgenda` (default 21) em `TenantConfig`; UI em Configurações → Agenda & WhatsApp; a `/agenda` carrega do config
- **Cadastro de profissional com login no mesmo modal** — `ModalProfissional` agora cria `Profissional` + `Usuario` + `UsuarioPermissao` em transação. Espelha o fluxo do minhaagendaapp (toggle inverso "Não preciso de usuário/senha", multi-select de 14 permissões)
- **Documento CPF ou CNPJ** — novos campos `cpf` e `cnpj` (String?) em `Profissional`, com radio + máscara automática
- **"Não Possui Agenda"** — novo campo `possuiAgenda Boolean @default(true)` em `Profissional`. Quando `false`, a profissional não aparece como coluna na `/agenda` (útil pra recepção/administrativo)
- **"Profissional terceiro"** — novo campo `profissionalTerceiro Boolean @default(false)` em `Profissional`. Quando `true`, atendimentos finalizados NÃO criam `Lancamento` de RECEITA, NÃO geram `ComissaoLancamento` e NÃO baixam estoque — apenas marcam `dataRealizado`. Implementado em `src/lib/finalizar-agendamento.ts` linhas 70-77

### Schema implementado (Fase 5)
- `TenantConfig`: + `horaInicioAgenda Int @default(6)`, `horaFimAgenda Int @default(21)`
- `Profissional`: + `cpf String?`, `cnpj String?`, `possuiAgenda Boolean @default(true)`, `profissionalTerceiro Boolean @default(false)`

### Migration em produção
Schema aplicado no Supabase via `npx prisma db push` apontando para o pooler.

---

## Segurança implementada ✅

- **Senhas:** bcrypt (hash custo 10) — implementado em `bcryptjs`
- **Sessão:** cookie HttpOnly assinado com HMAC-SHA256 usando `SESSION_SECRET`
- **Multi-tenant:** isolamento por `tenantId` em todas as queries
- **Soft delete:** dados nunca apagados fisicamente
- **HTTPS:** habilitado automaticamente via `secure: process.env.NODE_ENV === "production"` no cookie
- **Guards de página (client-side):** `/clientes`, `/produtos`, `/financeiro`, `/gastos/clinica`, `/gastos/casa` redirecionam para `/dashboard` via `useEffect` se o usuário não tiver a permissão correspondente (`acessarClientes`, `acessarProdutos`, `acessarFinanceiro`, `acessarDespesas`)
- **Guards de API:** `GET /api/clientes` bloqueia listagem sem `acessarClientes`; `GET /api/produtos` stripa `precoCusto` para não-admin sem `acessarFinanceiro`; `POST /api/lancamentos` bloqueia criação de DESPESA sem `acessarDespesas`/`acessarFinanceiro`
- **Sidebar dinâmico:** cada item de menu só aparece para usuários com a permissão correspondente; seções divisoras (ex: "Relatórios") só renderizam se houver pelo menos um item visível abaixo delas

---

## Fase 6 — Orçamentos + Responsividade Mobile (CONCLUÍDA ✅)

### O que foi construído
- **`/orcamentos`** — módulo completo: lista filtrada por status/profissional/busca, badge de status colorido, dias de validade restantes, abertura de modal por `?abrir=<id>`
- **`ModalOrcamento`** — criar/editar orçamentos com itens (serviço ou produto), descontos, observação, status. **Responsivo mobile**: `max-h-[90dvh]`, `flex-col`, header/footer com `flex-shrink-0`, corpo com `flex-1 overflow-y-auto`
- **Campos novos em `Produto`**: `ehInjetavel Boolean`, `unidadeMedida String?`, `corMarcacao String?` (adicionados no schema, ainda não utilizados na UI ativa — reservados para fase futura de planejador visual)
- **UI de produto atualizada**: checkbox "É injetável", dropdown de unidade (Unidade/ml/ui/un), color picker com 6 cores pré-definidas; badge colorido na lista de produtos
- **API `GET /api/produtos?injetavel=true`** — filtro de produtos injetáveis (para uso futuro)
- **Botão "Gerar Orçamento"** na ficha de Planejamento (`modal-ficha-planejamento.tsx`):
  1. Salva a ficha no prontuário
  2. Busca `/api/servicos` e tenta casar cada procedimento marcado por nome (case-insensitive, partial match)
  3. Cria orçamento via `POST /api/orcamentos` com os itens encontrados; procedimentos sem match vão para `observacao`
  4. Navega para `/orcamentos?abrir={orcamento.id}` — abre o modal do orçamento recém-criado

### `CanvasFacePlanner` (`src/components/canvas-face-planner.tsx`)
Componente SVG de face frontal **mantido apenas para impressão de fichas antigas** (prontuários que já tinham marcações salvas em `anamnese.marcacoes`). **NÃO está mais ativo nas fichas de planejamento nem no modal de orçamento** — foi removido dos modais porque a implementação visual não ficou satisfatória. O componente exporta `Marcacao` e `ProdutoInjetavel` que são usados pela página de impressão `prontuarios/[clienteId]/ficha/[fichaId]/imprimir/page.tsx`.

### Schema implementado (Fase 6)
- `Produto`: + `ehInjetavel Boolean @default(false)`, `unidadeMedida String? @default("unidade")`, `corMarcacao String? @default("#A78BFA")`
- `Orcamento` e `ItemOrcamento`: tabelas criadas

### ⚠️ Migração em produção necessária (se ainda não feita)
```powershell
$env:DATABASE_URL="postgresql://postgres.vbtqittceshebajqpjzw:%2ALa191218mari@aws-1-sa-east-1.pooler.supabase.com:5432/postgres"
$env:DATABASE_PROVIDER="postgresql"
npx prisma db push
```

---

## Fase 7 — UX Mobile + Busca na Agenda + Mensagens WhatsApp (CONCLUÍDA ✅)

Commits `4210b3f` e `a26eacd` — melhorias de usabilidade no dia a dia, inspiradas no fluxo do minhaagendaapp.

### O que foi construído

**Agenda — melhorias mobile:**
- **Semana começa no domingo** (antes: segunda-feira) — corrige alinhamento com a semana natural
- **Header mobile unificado** — barra fixa no topo (`lg:hidden`) com lupa, calendário e botão "Hoje". Substitui botões flutuantes avulsos. Hamburger do sidebar fica em `z-50` por cima.
- **Mês acima dos dias** — linha discreta acima dos botões de dia (ex: "Maio · Junho") sem repetir por dia
- **Sábado sempre visível no iPhone 12** — largura dos botões reduzida de `min-w-[42px]` para `min-w-[38px] sm:min-w-[42px]` com `px-1 sm:px-2`

**`BuscaCliente` (`src/components/agenda/BuscaCliente.tsx`):**
- Abre pela lupa no header mobile ou ícone de busca no desktop
- Busca agendamentos por nome via `/api/agendamentos/busca`
- Resultados agrupados por data, ordenados do mais recente ao mais antigo
- Datas futuras/hoje em vermelho; passadas em escuro
- Clique na data → navega a agenda para aquele dia
- Clique no agendamento → navega + abre modal de edição

**Mensagem de aniversário editável (`TenantConfig.mensagemAniversarioWpp`):**
- Campo novo em `TenantConfig` com template personalizável
- UI em Configurações → aba Agenda & WhatsApp
- `/aniversariantes` consome o template via `/api/configuracoes` com fallback para mensagem padrão
- Variáveis: `{primeiro_nome}`, `{tenant_nome}`

**Mensagens pré-definidas WhatsApp:**
- Nova tabela `MensagemPredefinida` no banco — templates por tenant
- CRUD completo em `/mensagens` (criar, editar, excluir, preview com bolha WA)
- Tela vazia oferece "Carregar templates padrão" (4 templates)
- `src/lib/templateVars.ts` — substitui `{nome_cliente}`, `{data}`, `{hora}`, `{hora_fim}`, `{servico}`, `{profissional}`, `{nome_clinica}`, `{valor_total}` com dados reais do agendamento
- `PickerMensagens` (`src/components/agenda/PickerMensagens.tsx`) — modal com busca de templates, preview substituído e botão "Abrir WhatsApp"
- `ModalAgendamento` ganha ícone WhatsApp verde no rodapé quando há cliente com telefone

### Schema implementado (Fase 7)
- `TenantConfig`: + `mensagemAniversarioWpp String?`
- `MensagemPredefinida`: nova tabela com `id`, `tenantId`, `nome`, `texto`, `ordem`, `criadaEm`
- `Tenant`: + relação `mensagensPredefinidas MensagemPredefinida[]`

### Migration em produção
Aplicada via `npx prisma db push` apontando para o pooler Supabase (2026-05-29).

---

## Fase 8 — Relatórios financeiros completos + Correções pós-deploy (CONCLUÍDA ✅)

Commits do período pós-migração para Vercel (jun/2026). Foco em alinhar os relatórios com o MinhaAgenda e corrigir bugs de dados identificados em produção.

### Bugs corrigidos

**Bug 1 — `Lancamento.vencimento = null` (lançamentos sem data do atendimento):**
`finalizar-agendamento.ts` não gravava `vencimento`, causando uso de `criadoEm` (data de finalização) em vez da data do atendimento. Corrigido adicionando `vencimento: agendamento.inicio` na criação do lançamento.
Backfill (`prisma/backfill-vencimento.ts`) corrigiu 12 lançamentos em produção e reverteu 4 agendamentos mal-finalizados.

**Bug 2 — Status "Confirmado" com `contaConfirmado: true` (gerava receita real em agendamentos futuros):**
O seed configurava "Confirmado" com `contaConfirmado: true`, fazendo com que qualquer agendamento ao mudar para "Confirmado" criasse um lançamento financeiro real. Corrigido para `false`.
O seed agora também atualiza `contaConfirmado` no upsert, então re-rodar o seed corrige tenants já existentes.

**Bug 3 — Taxa Débito/Link não aplicada retroativamente:**
Lançamentos criados antes de o admin configurar as taxas tinham `valorBruto = null`. Backfill (`prisma/backfill-taxa.ts`) calculou e aplicou a taxa retroativamente para todas as formas com `percentualTaxa > 0`.

**Bug 4 — Dashboard: "Despesas mês" = R$0, "Lucro mês" = Receita:**
O card "Despesas mês" usava `resumoMes.despesa` (excluía Gastos Clínica/Casa) e a API aggregava apenas `pago: true`. Corrigido: card usa `gastosClinicaMes + gastosPessoalMes`; API agrega por vencimento sem filtro de pagamento.

**Bug 5 — Performance contava todos os status:**
A página somava todos os agendamentos do dia sem filtrar `dataRealizado`. Corrigido com filtro `a.dataRealizado != null`.

**Bug 6 — Fluxo Diário mostrava só despesas pagas:**
Filtro `l.pago` removido das despesas no Fluxo Diário. Agora todas as despesas aparecem no dia de vencimento.

**Bug 7 — Melhores Clientes "Novos" = total de clientes:**
`novosClientes` contava por `criadoEm` — todos os 350+ clientes foram importados na mesma data. Corrigido para contar clientes cujo **primeiro atendimento finalizado** cai no período.

### Novas funcionalidades

- **Toggle "Ver projeção"** no Relatório Financeiro — inclui agendamentos futuros como receita projetada
- **Top 5 serviços** com modal "Ver todos" (ordenável por Qtd ou Receita)
- **Fluxo Anual** — matriz 12 meses com indicadores Melhor Mês / Pior Mês / Ganho Médio
- **Performance inclui despesas operacionais** do período no balanço
- **Novas rotas de relatório:** `/api/relatorios/top-servicos`, `/api/relatorios/projecao`, `/api/relatorios/anual`

### Schema implementado (Fase 8)
- Sem mudanças de schema — apenas correções de lógica de negócio e novos endpoints.

---

## Fase 10 — Isolamento de permissões + taxas pessoais (CONCLUÍDA ✅)

Commit `00276a5` — junho/2026. Foco em fechar furos de isolamento descobertos quando Beatriz começou a testar o sistema.

### Bugs corrigidos

**A2 — /comissoes: profissional via seletor de "Todas"**
O seletor "Profissional / Todas" aparecia para todos os usuários. Como o backend já forçava `where.profissionalId = sessao.profissionalId` para não-admin, os dados estavam corretos — mas a UI era confusa e expunha nomes de outras profissionais. Corrigido: o dropdown só renderiza quando `isAdmin === true`.

O backend (`/api/comissoes`) já tinha o isolamento correto desde antes; a Fase 10 só ajustou o frontend.

**A1 — Dashboard: dados financeiros da clínica não vazam mais**
Já estava correto no backend (bloco `if (isAdmin)` controla todos os dados financeiros). Confirmado nos testes: Beatriz vê apenas Atendimentos Mês + Comissão Pendente, sem Receita/Despesa/Lucro da clínica.

### Novas funcionalidades

**C — Catálogo de permissões ampliado**
Três novas flags adicionadas ao tipo `Permissoes` em `session.ts` e ao `ModalProfissional`:
- `verComissoesPagar` — ver comissões na direção COLABORADORA_PAGA (profissional deve à clínica)
- `marcarComissaoPaga` — marcar comissão como paga/recebida
- `acessarConfiguracoesTaxas` — configurar taxas próprias de pagamento

As flags estão no banco como Boolean? default false e são lidas no login com fallback `=== true` (compatível com registros antigos sem o campo no DB).

**D — Taxas pessoais de Débito e Link para profissional**
Em `/configuracoes` → Formas de Pagamento, profissionais não-admin agora veem um bloco "Minhas taxas pessoais" com inputs editáveis para Cartão de Débito (%) e Link de Pagamento (%), além do Cartão de Crédito parcelado já existente.

Os valores ficam armazenados dentro do JSON `Profissional.configJsonCartao`:
```json
{ "maxParcelas": 12, "taxas": [...], "taxaDebito": 2.5, "taxaLink": 1.5 }
```

Em `finalizar-agendamento.ts`, ao finalizar atendimento com Débito ou Link, o sistema verifica se a profissional tem taxa própria configurada e usa ela; caso contrário, cai para a taxa global da clínica.

### Arquivos alterados (Fase 10)
| Arquivo | Mudança |
|---|---|
| `src/lib/session.ts` | + 3 novas flags no tipo `Permissoes` e `PERMISSOES_VAZIAS` |
| `src/app/api/auth/login/route.ts` | Lê as novas flags do DB com fallback `=== true` |
| `src/components/modal-profissional.tsx` | + 3 flags no tipo local + `PERMISSOES_LABELS` + leitura das flags ao editar profissional |
| `src/app/(dashboard)/comissoes/page.tsx` | Busca `/api/me/sessao` no mount; oculta seletor de profissional para não-admin |
| `src/app/(dashboard)/configuracoes/page.tsx` | Bloco "Minhas taxas pessoais" (Débito + Link) na seção do profissional; salva em `/api/me/config-cartao` |
| `src/lib/finalizar-agendamento.ts` | Usa `taxaDebito`/`taxaLink` do `configJsonCartao` do profissional quando presente |

---

## Fase 13 — Auditoria de Segurança + Limpeza de Dados (CONCLUÍDA ✅)

Sessão de junho/2026. Foco em fechar furos de isolamento descobertos quando Beatriz e Letícia começaram a testar o sistema em produção.

### Guards de página e API

Pages sensíveis agora verificam permissões no `useEffect` e redirecionam para `/dashboard` se o usuário não tiver acesso (ver seção "Segurança implementada" para lista completa).

API routes bloqueiam ações não autorizadas: listagem de clientes, custo de produtos e criação de despesas exigem permissão explícita.

### Sidebar — correções de visibilidade

- **"Cobranças" renomeado para "Financeiro"** no menu lateral
- **Seção "Relatórios"** só renderiza se o usuário tiver acesso a pelo menos um item abaixo dela — corrige o header órfão que aparecia para Beatriz/Letícia
- Header mobile da `/agenda` ajustado com `pl-14 pr-3` — o botão hamburger não ficava mais coberto pelo header de ações

### Comissões — isolamento visual

Profissional vê: subtitle "Minhas comissões", somente as próprias entradas, KPI próprio. Sem seletor de profissional, sem checkboxes de lote, sem botão "Marcar como pago". Backend já isolava os dados desde antes; esta fase corrigiu a UI.

### Limpeza de dados de produção

**Deduplicação de serviços (99 → ~63 ativos):**
- Rodada 1 — `prisma/dedup-servicos.ts`: inativou 32 duplicatas por normalização (NFD + lowercase + colapso de espaços); repontou vínculos de `ItemAgendamento` e `ItemOrcamento` para o serviço canônico
- Rodada 2 — `prisma/merge-duplicatas-manuais.ts`: inativou 4 duplicatas com nomes com typos/abreviações ("Lash lifth" → "Lash Lift", "Remoção unha" → "Remoção de Unha", etc.)

**Profissional teste removida:** "Dra. Lunna Bordin teste" removida do banco de produção junto com o usuário vinculado.

**Permissões da Beatriz corrigidas:** `beatrizddos1408@gmail.com` — `acessarClientes` e `acessarProdutos` definidos como `false`.

### Prevenção de novas duplicatas

`ModalServico` — ao abrir para **criar**, carrega a lista de serviços existentes e compara o nome digitado em tempo real (NFD + Levenshtein ≤ 2). Exibe aviso amarelo sem bloquear o salvamento.

### Arquivos alterados (Fase 13)
| Arquivo | Mudança |
|---|---|
| `src/components/sidebar.tsx` | Renomear "Cobranças"→"Financeiro"; fix divisor "Relatórios" órfão |
| `src/app/(dashboard)/agenda/page.tsx` | Header mobile com `pl-14 pr-3` (espaço para hamburger) |
| `src/app/(dashboard)/produtos/page.tsx` | Guard de permissão + `podeVerCusto` + ocultar coluna e campo Custo |
| `src/app/(dashboard)/clientes/page.tsx` | Guard → redirect se `!acessarClientes` |
| `src/app/(dashboard)/financeiro/page.tsx` | Guard → redirect se `!acessarFinanceiro` |
| `src/app/(dashboard)/gastos/clinica/page.tsx` | Guard → redirect se `!acessarDespesas` |
| `src/app/(dashboard)/gastos/casa/page.tsx` | Guard → redirect se `!acessarDespesas` |
| `src/app/(dashboard)/comissoes/page.tsx` | UI condicional: subtitle, KPI SELECIONADO, checkboxes, botão pagar |
| `src/app/api/clientes/route.ts` | Block GET listing sem `acessarClientes` |
| `src/app/api/produtos/route.ts` | Strip `precoCusto` para não-admin/não-financeiro |
| `src/app/api/lancamentos/route.ts` | Block POST DESPESA sem permissão |
| `src/components/modal-servico.tsx` | Aviso de similaridade ao criar serviço (NFD + Levenshtein) |
| `prisma/dedup-servicos.ts` | Script de deduplicação automática (dry-run + `--apply`) |
| `prisma/merge-duplicatas-manuais.ts` | Script de merge manual das 4 duplicatas restantes |
| `prisma/fix-beatriz-permissions.ts` | Script para corrigir permissões da Beatriz em produção |
| `prisma/remove-prof-teste.ts` | Script para remover profissional de teste em produção |

---

## O que ainda NÃO foi construído

### Pendente para SaaS multi-tenant
- **Logo/marca dinâmica por tenant** — hoje "BC" e "LB Beauty Clinic" estão hardcoded no Login, Sidebar, ícone PWA, páginas de impressão e templates WhatsApp. Schema já tem `Tenant.logoUrl` e `Tenant.nome` — falta usar. (Parte A: iniciais dinâmicas + nome dinâmico. Parte B: upload de imagem.)
- **Página pública de signup** — cadastro self-service de nova clínica (cria Tenant + admin)
- **Billing recorrente** — Stripe / Pagar.me / Asaas para mensalidade SaaS
- **Painel super-admin** — visão de todos os tenants, status de pagamento, uso
- **Subdomínios por clínica** — `clinica-x.beautyclinic.com.br` em vez de URL única

### Infraestrutura/features pendentes
- **WhatsApp real** — envio automático via Cloud API (Meta) ou Baileys; hoje é 100% manual via link. Toggle `TenantConfig.whatsappAtivo` já existe no schema, pronto para ligar quando a integração for implementada.
- **Agendamento online público** — página `/agendar/[slug]` para cliente marcar horário sem login. Toggle `TenantConfig.agendamentoOnlineAtivo` já existe. Planejado com wizard 4 passos + notificação in-app (sino).
- **Impressão do prontuário** — logo maior + fonte mais elegante (Playfair Display ou similar) nas páginas `(print)/`
- **Repetir Agendamento** — lógica de recorrência não implementada

---

## Contexto do negócio

**Clínica:** LB Beauty Clinic — Florianópolis/SC

**Profissionais:**
| Nome | Área | Serviços principais |
|---|---|---|
| Dra. Lunna Bordin | Biomedicina | Botox, harmonização facial, preenchimento |
| Beatriz de Lima | Estética | Limpeza de pele, extensão de cílios, sobrancelha (henna), massagens |
| Letícia Bordin | Estética | Extensão de unhas |

**Admin:** Anderson (marido da Dra. Lunna) — vê tudo, acesso total.

**Regra de privacidade:** Cada profissional vê **somente sua própria agenda e suas próprias clientes**. Admin vê tudo.

**Sistema anterior:** `portal.minhaagendaapp.com.br/agenda` — este sistema substitui e supera ele.

**Visão de longo prazo:** Vender para outras clínicas de estética como SaaS com mensalidade.

---

## Paleta de cores

```
#B89968  dourado principal (primary)
#9a7d50  dourado escuro (hover, texto secundário)
#5a4530  marrom escuro (texto principal)
#e8dcc4  bege claro (bordas, separadores)
#faf5ee  bege muito claro (fundo cards, hover)
#f5f0e8  bege fundo (backgrounds)
#f4f6f8  cinza muito claro (fundo da agenda — igual ao minhaagendaapp)
```
