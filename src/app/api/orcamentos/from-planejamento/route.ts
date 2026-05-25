import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao, temPermissao } from "@/lib/session";

type MarcacaoSalva = {
  id: string;
  produtoId: string;
  produtoNome: string;
  produtoCor: string;
  x: number;
  y: number;
  dosagem: number;
  unidade: string;
  regiao?: string;
};

type Grupo = {
  produtoId: string;
  produtoNome: string;
  somaDosagem: number;
  unidade: string;
  pontos: MarcacaoSalva[];
};

export async function POST(req: NextRequest) {
  const sessao = await exigirSessao();
  if (!temPermissao(sessao, "acessarFinanceiro")) {
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  }

  const { procedimentoId } = await req.json();
  if (!procedimentoId) {
    return NextResponse.json({ erro: "procedimentoId é obrigatório" }, { status: 400 });
  }

  // 1. Busca o procedimento (com cliente via prontuário)
  const procedimento = await prisma.procedimento.findFirst({
    where: { id: procedimentoId, tenantId: sessao.tenantId },
    include: { prontuario: { include: { cliente: true } } },
  });
  if (!procedimento) {
    return NextResponse.json({ erro: "Procedimento não encontrado" }, { status: 404 });
  }

  // 2. Parseia o JSON da ficha de planejamento
  if (!procedimento.anamnese) {
    return NextResponse.json({ erro: "Procedimento sem dados de planejamento" }, { status: 400 });
  }
  let dados: { marcacoes?: MarcacaoSalva[] };
  try {
    dados = JSON.parse(procedimento.anamnese);
  } catch {
    return NextResponse.json({ erro: "Dados do planejamento corrompidos" }, { status: 400 });
  }

  const marcacoes = (dados.marcacoes ?? []).filter((m) => m.produtoId && m.dosagem > 0);
  if (marcacoes.length === 0) {
    return NextResponse.json(
      { erro: "O planejamento não tem marcações com dosagem definida" },
      { status: 400 }
    );
  }

  // 3. Agrupa marcações por produto
  const gruposMap = new Map<string, Grupo>();
  for (const m of marcacoes) {
    const existente = gruposMap.get(m.produtoId);
    if (existente) {
      existente.somaDosagem += m.dosagem;
      existente.pontos.push(m);
    } else {
      gruposMap.set(m.produtoId, {
        produtoId: m.produtoId,
        produtoNome: m.produtoNome,
        somaDosagem: m.dosagem,
        unidade: m.unidade,
        pontos: [m],
      });
    }
  }
  const grupos = Array.from(gruposMap.values());

  // 4. Carrega produtos do banco pra pegar preço atualizado
  const produtos = await prisma.produto.findMany({
    where: {
      id: { in: grupos.map((g) => g.produtoId) },
      tenantId: sessao.tenantId,
    },
  });

  // 5. Monta os itens do orçamento (1 por produto agrupado)
  const itensCreate = grupos.map((g) => {
    const prod = produtos.find((p) => p.id === g.produtoId);
    const preco = prod?.precoVenda ?? 0;
    // Arredonda pra cima — cobramos a unidade completa (ex: 0.6ml vira 1ml)
    const quantidade = Math.max(1, Math.ceil(g.somaDosagem));
    const regioes = g.pontos
      .map((p) => p.regiao)
      .filter(Boolean)
      .filter((r, i, arr) => arr.indexOf(r) === i)
      .join(", ");
    const detalheRegioes = regioes ? ` (${regioes})` : "";
    return {
      produtoId: g.produtoId,
      servicoId: null,
      preco,
      quantidade,
      descricao: `${g.somaDosagem.toString().replace(".", ",")}${g.unidade} em ${g.pontos.length} ${g.pontos.length === 1 ? "ponto" : "pontos"}${detalheRegioes}`,
    };
  });

  const valorTotal = itensCreate.reduce((s, i) => s + i.preco * i.quantidade, 0);

  // 6. Cria o orçamento
  const orcamento = await prisma.orcamento.create({
    data: {
      tenantId: sessao.tenantId,
      clienteId: procedimento.prontuario.clienteId,
      profissionalId: procedimento.profissionalId,
      dataValidade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
      valorTotal,
      observacao: `Gerado a partir do planejamento visual de ${new Date(procedimento.data).toLocaleDateString("pt-BR")}.`,
      itens: { create: itensCreate },
    },
    select: { id: true },
  });

  return NextResponse.json({ orcamentoId: orcamento.id, valorTotal }, { status: 201 });
}
