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
│   └── hash-passwords.ts        # script one-shot para migrar senhas plain→bcrypt
├── scripts/
│   └── patch-schema.js          # troca provider sqlite→postgresql antes do build no Vercel
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
│   │       ├── clientes/[id]/
│   │       ├── servicos/[id]/
│   │       ├── profissionais/[id]/
│   │       ├── produtos/[id]/
│   │       ├── lancamentos/[id]/
│   │       ├── comissoes/
│   │       ├── comissoes/[id]/
│   │       ├── comissoes/pagar/
│   │       ├── movimentacoes-estoque/
│   │       ├── prontuarios/[clienteId]/procedimentos/
│   │       ├── prontuarios/[clienteId]/fotos/
│   │       ├── status-agenda/
│   │       ├── backup/
│   │       ├── dashboard/
│   │       ├── fluxo-caixa/
│   │       └── configuracoes/
│   ├── components/
│   │   ├── ui/                  # button, input, label, card, badge (shadcn)
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

## Deploy (Vercel + Supabase)

### Preparação do código (já feito)
- `scripts/patch-schema.js` — troca `provider = "sqlite"` → `"postgresql"` quando `DATABASE_PROVIDER=postgresql`
- `package.json` build: `node scripts/patch-schema.js && prisma generate && next build`
- `package.json` postinstall: `prisma generate` (necessário para Vercel gerar o client)
- `.env.example` — template das variáveis de produção

### Passos para o usuário
1. **GitHub** — criar repositório privado e enviar o link
2. **Supabase** — criar projeto em São Paulo, copiar a Connection String (URI)
3. **Vercel** — conectar ao GitHub, configurar variáveis de ambiente:
   - `DATABASE_PROVIDER=postgresql`
   - `DATABASE_URL=<string do Supabase>`
   - `SESSION_SECRET=<string aleatória longa>`

### Seed em produção
Após o deploy, rodar via Vercel CLI ou painel:
```bash
npx prisma db push
npx prisma db seed
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
- **Faixa de semana** no topo: 7 dias clicáveis, dia atual destacado em dourado
- Linhas cheias nas horas, linhas tracejadas nas meias horas
- Clique em slot → abre `ModalAgendamento` com hora exata
- Clique em bloco existente → abre `ModalAgendamento` para edição/exclusão
- Linha vermelha do horário atual (só hoje)
- **Botão "+" flutuante** (FAB dourado) no canto inferior direito
- **Data persistida no localStorage** — ao navegar para outra aba e voltar, mantém o dia selecionado
- Botão "Hoje" restaura para a data atual
- Link WhatsApp usa `https://web.whatsapp.com/send?phone=...&text=...` — garante emojis corretos no WhatsApp Desktop Windows
- Template da mensagem WhatsApp carregado das configurações do tenant

### `/clientes`
- Lista com busca em tempo real (debounce 300ms via `/api/clientes?q=`)
- Botão "Nova Cliente" → abre `ModalCliente`
- Clique em linha → edição via `ModalCliente`
- Modal tem abas: **Dados** e **Histórico** (últimos 10 atendimentos)
- **CPF com máscara automática** — formata para `000.000.000-00` ao digitar

### `/confirmacoes`
- Página para envio manual de confirmações WhatsApp
- Lista agendamentos do dia seguinte (ou data selecionada) com telefone e status de envio
- Gera link `web.whatsapp.com` com mensagem pré-preenchida usando template das configurações
- Admin vê todos os profissionais; profissional vê só os seus

### `/servicos`
- Lista agrupada por categoria
- CRUD via `ModalServico` (nome, categoria com autocomplete, duração em pílulas, preço, cor, precoVariavel)

### `/dashboard`
- Página inicial após login
- **Admin:** 4 KPIs do mês (receita, despesas, lucro, comissões pendentes) + agenda do dia + contas vencendo em 7 dias + aniversariantes do mês + faturamento por profissional (barras)
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

### `/financeiro`
- Filtro por mês, toggle RECEITA / DESPESA, marcar como pago/não pago
- Cards DRE no topo (receita, despesas, lucro líquido)
- Abas: Lançamentos | Gastos Clínica | Gastos Pessoal | Fluxo de Caixa

### `/comandas`
- Visão mensal de todos os atendimentos com totais por dia

### `/comissoes`
- Extrato por profissional × mês com filtros de status (pendente/pago/todos)
- KPIs: total pendente, total pago, total selecionado
- Edição individual (lápis): editar valor, percentual (recalcula automaticamente), status, data de pagamento
- Seleção em lote + "Marcar como pago" → cria Lancamento DESPESA (CLINICA_PAGA) ou RECEITA (COLABORADORA_PAGA)

### `/gastos/clinica` e `/gastos/casa`
- Planilha mensal de gastos fixos com filtro de mês, cards de totais (Total / Pago / A pagar)
- CRUD inline: adicionar, editar (clique na linha), excluir com confirmação

### `/configuracoes`
- **4 abas:**
  - **Dados da Clínica** — nome, CNPJ, telefone, endereço, link NFSe
  - **Agenda & WhatsApp** — intervalo de horários (15/30/60 min), horário de envio, template da mensagem de confirmação (editável com variáveis `{primeiro_nome}`, `{dia_semana}`, `{data_curta}`, `{hora}`)
  - **Status de Agenda** — visualização dos status cadastrados (customização avançada futura)
  - **Backup** — exporta todos os dados do sistema em JSON via `/api/backup`

### `/relatorios/performance`
- Abas **EMPRESA** | **PROFISSIONAIS**
- Filtros de período: Mês Atual / Semana Atual / Hoje / Mês Passado / Personalizado
- Aba Empresa: gráfico de barras Receita/Despesa/Lucro + KPIs
- Aba Profissionais: cards individuais com atendimentos, faturamento, ticket médio, top serviços

### `/relatorios/financeiro`
- DRE simplificado + receitas e despesas por categoria com barra de progresso
- **Exportação CSV** disponível

### `/relatorios/clientes`
- Lista de aniversariantes do mês + tabela de todas as clientes
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
| `/api/clientes` | GET, POST | Lista com `?q=busca` |
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

### `ModalCliente`
- Abas: Dados | Histórico de Atendimentos
- Campos: nome, telefone1, telefone2, email, CPF (com máscara 000.000.000-00), RG, sexo, data nascimento, endereço, observação

### `ModalServico`
- Campos: nome, categoria (autocomplete), duração (pílulas), preço, cor, precoVariavel (toggle)

### `ModalProfissional`
- Campos: nome, email, telefone, especialidade, registro profissional, cor (color picker), tipo de comissão
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

## Segurança implementada ✅

- **Senhas:** bcrypt (hash custo 10) — implementado em `bcryptjs`
- **Sessão:** cookie HttpOnly assinado com HMAC-SHA256 usando `SESSION_SECRET`
- **Multi-tenant:** isolamento por `tenantId` em todas as queries
- **Soft delete:** dados nunca apagados fisicamente
- **HTTPS:** habilitado automaticamente via `secure: process.env.NODE_ENV === "production"` no cookie

---

## O que ainda NÃO foi construído

### Infraestrutura pendente
- **Deploy** — Vercel + Supabase (etapas manuais pendentes: criar contas, configurar env vars)
- **WhatsApp real** — `whatsapp-web.js` com QR code e job diário 08:00h (envio atual é manual via link)
- **Migração de dados** — importar clientes do minhaagendaapp (usuário precisa exportar CSV)
- **Repetir Agendamento** — UI pronta no modal, lógica de recorrência não implementada

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
