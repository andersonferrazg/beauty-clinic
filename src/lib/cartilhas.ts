export type TipoCartilha =
  | "cartilha_botox"
  | "cartilha_preenchimento"
  | "cartilha_bioestimuladores"
  | "cartilha_skinbooster"
  | "cartilha_fios_pdo"
  | "cartilha_peeling"
  | "cartilha_microagulhamento"
  | "cartilha_intradermoterapia"
  | "cartilha_peim"
  | "cartilha_enzimas"
  | "cartilha_rinomodelacao";

export const CARTILHAS: Record<TipoCartilha, { titulo: string; texto: string }> = {
  cartilha_botox: {
    titulo: "Orientações Pós-Procedimento — Toxina Botulínica",
    texto: `Parabéns! Você realizou a aplicação de Toxina Botulínica. Para garantir o melhor resultado, siga atentamente as orientações abaixo.

NAS PRIMEIRAS 4 HORAS:
• Não toque, esfregue nem massageie a área tratada
• Não se deite nem incline a cabeça para frente
• Evite atividade física intensa
• Evite bebidas alcoólicas
• Não faça expressões faciais exageradas

NAS PRIMEIRAS 24 HORAS:
• Evite ambientes quentes: sauna, banho quente prolongado, exposição intensa ao sol
• Não use maquiagem nos locais de aplicação
• Não realize tratamentos faciais (laser, peeling, massagem facial)

DURANTE OS PRÓXIMOS 15 DIAS:
• Evite exposição solar sem protetor solar FPS 50+
• Não realize outros tratamentos faciais invasivos

MASSAGEM (se orientado pela profissional):
• Realizar 5x ao dia por 5 dias seguidos, conforme local e técnica indicados

RESULTADOS ESPERADOS:
• O efeito começa a aparecer entre 3 e 7 dias após a aplicação
• O resultado completo é visível em 14 dias
• Duração: 4 a 6 meses em média

SINAIS DE ALERTA — retorne imediatamente se apresentar:
• Dificuldade para engolir, respirar ou falar
• Queda intensa de pálpebra
• Visão dupla ou alteração visual
• Reação alérgica (inchaço intenso, urticária generalizada)

Em caso de dúvidas, entre em contato com a clínica.`,
  },

  cartilha_preenchimento: {
    titulo: "Orientações Pós-Procedimento — Preenchimento Facial",
    texto: `Parabéns! Você realizou o Preenchimento Facial. Para garantir o melhor resultado e evitar complicações, siga atentamente as orientações abaixo.

NAS PRIMEIRAS 24 HORAS:
• Aplique compressas de gelo (envolto em pano) por 15 minutos, várias vezes ao dia
• Não massageie nem pressione a área tratada (exceto se orientado)
• Evite atividade física intensa
• Evite bebidas alcoólicas
• Não use maquiagem na área tratada
• Durma de barriga para cima, com a cabeça levemente elevada

NAS PRIMEIRAS 2 SEMANAS:
• Evite exposição solar direta — use FPS 50+ obrigatoriamente
• Evite sauna, banho muito quente, procedimentos com calor (laser, radiofrequência)
• Não realize outros procedimentos faciais invasivos

DURANTE 1 MÊS:
• Evite tratamentos faciais que exijam pressão ou calor intenso na área

É NORMAL APRESENTAR:
• Inchaço, vermelhidão e pequenas equimoses (manchas roxas) — resolvem em 7 a 14 dias
• Assimetria inicial — o resultado definitivo aparece após a cicatrização completa

SINAIS DE ALERTA — retorne imediatamente se apresentar:
• Dor intensa e crescente após o procedimento
• Palidez ou coloração azulada/branca na pele (sinal de oclusão vascular — EMERGÊNCIA)
• Vermelhidão intensa com calor e pus (infecção)
• Bolhas na pele

Em caso de dúvidas, entre em contato com a clínica.`,
  },

  cartilha_bioestimuladores: {
    titulo: "Orientações Pós-Procedimento — Bioestimuladores de Colágeno",
    texto: `Parabéns! Você realizou a aplicação de Bioestimuladores de Colágeno. Siga as orientações abaixo para otimizar seus resultados.

NAS PRIMEIRAS 24 HORAS:
• Realize a massagem conforme orientação da profissional (geralmente 5 movimentos circulares, 5x ao dia)
• Não pressione nem massageie de forma diferente da orientada
• Evite atividade física intensa
• Evite bebidas alcoólicas

MASSAGEM (fundamental para este procedimento):
• Duração: 5 a 7 dias consecutivos após a aplicação
• Técnica: conforme demonstrado pela profissional
• A massagem evita a formação de nódulos e distribui o produto uniformemente

NAS PRIMEIRAS 2 SEMANAS:
• Proteja-se do sol: use FPS 50+ diariamente
• Evite sauna, vapor e calor intenso
• Não realize outros procedimentos faciais invasivos
• Não use ácidos ou retinol na área tratada

RESULTADOS ESPERADOS:
• Os bioestimuladores agem de forma gradual — o colágeno é produzido progressivamente
• Resultado visível entre 2 e 6 meses após a aplicação
• Geralmente são recomendadas 2 a 3 sessões com intervalo de 4 a 8 semanas
• Duração: 18 a 24 meses

SINAIS DE ALERTA — retorne se apresentar:
• Nódulos que não regridem após 30 dias (mesmo com massagem)
• Dor crescente ou vermelhidão intensa
• Sinais de reação alérgica

Em caso de dúvidas, entre em contato com a clínica.`,
  },

  cartilha_skinbooster: {
    titulo: "Orientações Pós-Procedimento — Skinbooster",
    texto: `Parabéns! Você realizou o Skinbooster. Siga as orientações abaixo para potencializar sua hidratação e garantir a segurança do procedimento.

NAS PRIMEIRAS 12 HORAS:
• Não toque nem esfregue as áreas de aplicação
• Não aplique maquiagem
• Evite exposição solar direta

NAS PRIMEIRAS 24 HORAS:
• Aplique compressas frias se houver inchaço
• Evite atividade física intensa
• Evite bebidas alcoólicas e alimentos muito salgados (reduzem o inchaço)
• Beba bastante água — a hidratação potencializa os resultados

NAS PRIMEIRAS 2 SEMANAS:
• Use protetor solar FPS 50+ diariamente
• Evite sauna, banho muito quente e ambientes com calor excessivo
• Não realize outros procedimentos na área tratada

CUIDADOS DIÁRIOS:
• Mantenha a rotina de skincare suave (sem exfoliantes ou ácidos por 5 dias)
• Hidratação tópica auxilia os resultados

RESULTADOS ESPERADOS:
• Melhora imediata da hidratação e luminosidade
• Resultado completo em 2 a 4 semanas
• Duração: 6 a 12 meses
• Geralmente recomendadas 2 a 3 sessões iniciais

SINAIS DE ALERTA — retorne se apresentar:
• Nódulos persistentes após 15 dias
• Vermelhidão com calor, pus ou febre (infecção)
• Dor crescente

Em caso de dúvidas, entre em contato com a clínica.`,
  },

  cartilha_fios_pdo: {
    titulo: "Orientações Pós-Procedimento — Fios de PDO",
    texto: `Parabéns! Você realizou o procedimento de Fios de PDO. Este procedimento exige cuidados específicos — siga atentamente as orientações abaixo.

NOS PRIMEIROS 3 DIAS:
• Prefira alimentos macios e frios ou em temperatura ambiente
• Evite abrir muito a boca (bocejo exagerado, gargalhada intensa)
• Não massageie nem pressione a área tratada
• Durma de barriga para cima, com a cabeça levemente elevada

NA PRIMEIRA SEMANA:
• Evite atividade física intensa
• Não faça tratamentos faciais (massagem, rolamento, pressão)
• Evite exposição solar — use FPS 50+
• Não vá à sauna ou banho muito quente

NO PRIMEIRO MÊS:
• Não realize massagem facial profunda ou drenagem na área
• Evite procedimentos com ultrassom focalizado e radiofrequência intensa
• Durma de barriga para cima sempre que possível

É NORMAL APRESENTAR:
• Leve desconforto, sensação de tensão ou irregularidade nos primeiros dias
• Pequenas equimoses (manchas roxas) que regridem em 7 a 14 dias
• Assimetria inicial — o resultado definitivo é visível após 1 mês

RESULTADOS ESPERADOS:
• Efeito de lifting e firmeza progressivo
• Resultado visível em 4 a 8 semanas
• Duração: 12 a 18 meses

SINAIS DE ALERTA — retorne imediatamente se apresentar:
• Dor intensa ou progressiva
• Fio visível ou saindo pela pele
• Sinais de infecção (vermelhidão intensa, calor, pus, febre)
• Assimetria intensa ou deformidade

Em caso de dúvidas, entre em contato com a clínica.`,
  },

  cartilha_peeling: {
    titulo: "Orientações Pós-Procedimento — Peeling Químico",
    texto: `Parabéns! Você realizou o Peeling Químico. Este procedimento exige cuidados rigorosos — leia com atenção.

ATENÇÃO — REGRA DE OURO:
• NÃO arranque, puxe nem esfolie a pele que está descamando. Aguarde a descamação natural.

NAS PRIMEIRAS 24 HORAS:
• Não molhe o rosto (evite banho quente no rosto, choro, suor)
• Não aplique maquiagem
• Evite exposição solar completamente
• Use somente os produtos indicados pela profissional

DURANTE A DESCAMAÇÃO (3 a 7 dias):
• Lave o rosto suavemente com sabonete neutro e água morna
• Aplique hidratante intensivo conforme indicado
• Não use ácidos, retinol, vitamina C ou esfoliantes
• Não vá à piscina, mar ou academia
• Protetor solar FPS 50+ é OBRIGATÓRIO mesmo em dias nublados ou dentro de casa perto de janelas

POR 3 MESES APÓS O PEELING:
• Use protetor solar FPS 50+ diariamente, reaplicando a cada 2 horas
• Evite exposição solar entre 10h e 16h
• Não realize outros procedimentos na área sem autorização

É NORMAL APRESENTAR:
• Vermelhidão, tensão e descamação nos primeiros 3 a 7 dias
• Sensação de pele sensível — é temporária

SINAIS DE ALERTA — retorne se apresentar:
• Bolhas ou vesículas
• Vermelhidão intensa com pus (infecção)
• Manchas escuras intensas repentinas
• Reação alérgica

Em caso de dúvidas, entre em contato com a clínica.`,
  },

  cartilha_microagulhamento: {
    titulo: "Orientações Pós-Procedimento — Microagulhamento",
    texto: `Parabéns! Você realizou o Microagulhamento. Siga as orientações abaixo para potencializar os resultados e evitar complicações.

NAS PRIMEIRAS 24 HORAS:
• Não use maquiagem
• Não toque o rosto sem lavar as mãos
• Use apenas os produtos indicados pela profissional (sérum e hidratante pós-procedimento)
• Evite exposição solar direta
• Não realize atividade física intensa (suor aumenta risco de infecção)
• Não vá à piscina, mar ou spa

ATÉ 7 DIAS:
• Não use ácidos (AHA, BHA), retinol, vitamina C ativa ou esfoliantes
• Use protetor solar FPS 50+ a partir do 2º dia, reaplicando a cada 2 horas
• Evite calor excessivo (sauna, banho quente prolongado)

ROTINA DE SKINCARE:
• 1º ao 3º dia: limpeza suave + hidratante indicado + FPS
• A partir do 4º dia: retome sua rotina normal gradualmente, conforme orientação

É NORMAL APRESENTAR:
• Vermelhidão intensa nas primeiras 24 a 48 horas (como uma queimação de sol leve)
• Descamação suave após 2 a 3 dias
• Sensibilidade temporária

RESULTADOS ESPERADOS:
• Melhora da textura, manchas e cicatrizes com progressividade
• Sessões a cada 4 a 6 semanas
• Resultado completo após 3 a 6 sessões

SINAIS DE ALERTA — retorne se apresentar:
• Bolhas, vermelhidão com pus ou febre (infecção)
• Herpes ativa (lesões na boca ou no rosto)
• Reação alérgica

Em caso de dúvidas, entre em contato com a clínica.`,
  },

  cartilha_intradermoterapia: {
    titulo: "Orientações Pós-Procedimento — Intradermoterapia",
    texto: `Parabéns! Você realizou a Intradermoterapia. Siga as orientações abaixo para otimizar seus resultados.

NAS PRIMEIRAS 24 HORAS:
• Não toque nem massageie a área tratada
• Evite atividade física intensa
• Evite bebidas alcoólicas
• Não aplique maquiagem no local tratado

NAS PRIMEIRAS 48 HORAS:
• Evite exposição solar direta
• Não vá à piscina, mar, sauna ou banho quente prolongado
• Não realize massagem ou procedimento estético na área

APÓS 24 HORAS:
• Massagem suave na área, conforme orientado pela profissional

PROTEÇÃO SOLAR:
• Use protetor solar FPS 50+ diariamente por pelo menos 30 dias
• Reaplique a cada 2 horas em caso de exposição solar

É NORMAL APRESENTAR:
• Pequenos nódulos no local das injeções — resolvem em 24 a 72 horas
• Leve vermelhidão e sensibilidade local — transitórias
• Pequenas equimoses (manchas roxas) em alguns casos

RESULTADOS ESPERADOS:
• Resultados progressivos ao longo das sessões
• Protocolo geralmente de 4 a 8 sessões
• Intervalo entre sessões: 7 a 15 dias conforme indicação

SINAIS DE ALERTA — retorne se apresentar:
• Nódulos que aumentam de tamanho após 72 horas
• Vermelhidão com calor intenso, pus ou febre (infecção)
• Reação alérgica

Em caso de dúvidas, entre em contato com a clínica.`,
  },

  cartilha_peim: {
    titulo: "Orientações Pós-Procedimento — PEIM (Microvasos)",
    texto: `Parabéns! Você realizou o tratamento de PEIM para microvasos. Siga as orientações abaixo.

NAS PRIMEIRAS 24 HORAS:
• Não massageie nem pressione a área tratada
• Evite atividade física intensa
• Não aplique maquiagem sobre a área tratada

CUIDADOS ESSENCIAIS:
• Protetor solar FPS 50+ é obrigatório diariamente — reaplicar a cada 2 horas
• Evite exposição solar entre 10h e 16h por pelo menos 14 dias
• Não vá à sauna ou banho muito quente por 48 horas
• Evite bebidas alcoólicas e alimentos muito picantes nos primeiros dias (vasodilatadores)

É NORMAL APRESENTAR:
• Escurecimento inicial dos vasos tratados — eles ficam mais visíveis antes de desaparecer
• Leve vermelhidão e edema local nas primeiras horas
• O desaparecimento dos vasos pode levar de 2 a 6 semanas

RESULTADOS ESPERADOS:
• Podem ser necessárias múltiplas sessões para vasos mais resistentes
• Intervalo entre sessões: 4 a 8 semanas

SINAIS DE ALERTA — retorne se apresentar:
• Bolhas ou vesículas na pele
• Hiperpigmentação (manchas escuras) intensa
• Reação alérgica generalizada
• Queimadura na pele

Em caso de dúvidas, entre em contato com a clínica.`,
  },

  cartilha_enzimas: {
    titulo: "Orientações Pós-Procedimento — Enzimas Lipolíticas",
    texto: `Parabéns! Você realizou a aplicação de Enzimas Lipolíticas. Siga as orientações abaixo para potencializar seus resultados.

NAS PRIMEIRAS 24 HORAS:
• Realize a massagem na área conforme orientação da profissional — ela é essencial para distribuir o produto
• Evite atividade física intensa
• Não aplique calor (bolsa quente, ultrassom) na área tratada

MASSAGEM:
• Realize diariamente, conforme técnica e frequência orientadas
• A massagem auxilia a eliminação da gordura tratada

CUIDADOS COMPLEMENTARES:
• Beba bastante água (mínimo 2 litros por dia) — auxilia a eliminação
• Mantenha alimentação equilibrada para potencializar os resultados
• Atividade física moderada após 48 horas acelera os resultados
• Evite bebidas alcoólicas por 48 horas

PROTEÇÃO SOLAR:
• Use protetor solar FPS 50+ nas áreas tratadas por pelo menos 15 dias

É NORMAL APRESENTAR:
• Inchaço, endurecimento e leve dor local nas primeiras 48 a 72 horas
• Equimoses (manchas roxas) em alguns casos — resolvem em 7 a 14 dias

RESULTADOS ESPERADOS:
• Resultados progressivos ao longo do protocolo
• Geralmente 4 a 8 sessões com intervalo de 7 a 15 dias
• Auxílio de drenagem linfática potencializa os resultados

SINAIS DE ALERTA — retorne se apresentar:
• Nódulos dolorosos que não regridem após 7 dias
• Vermelhidão intensa com pus ou febre (infecção)
• Reação alérgica

Em caso de dúvidas, entre em contato com a clínica.`,
  },

  cartilha_rinomodelacao: {
    titulo: "Orientações Pós-Procedimento — Rinomodelação",
    texto: `Parabéns! Você realizou a Rinomodelação. Este procedimento exige cuidados especiais — leia atentamente.

ATENÇÃO MÁXIMA — REGRA DE SEGURANÇA:
• NUNCA pressione, aperte ou bata no nariz após o procedimento
• Em caso de dor intensa, palidez ou coloração azulada do nariz: procure atendimento IMEDIATAMENTE (sinal de emergência vascular)

NAS PRIMEIRAS 24 HORAS:
• Não toque nem massageie o nariz
• Não assoe o nariz com força
• Evite espirros violentos (abra a boca ao espirrar)
• Não use óculos apoiados sobre o nariz
• Durma de barriga para cima
• Evite atividade física intensa

NAS PRIMEIRAS 2 SEMANAS:
• Não use óculos com apoio no nariz (opte por óculos suspensos com fita adesiva)
• Evite exposição solar direta — use FPS 50+
• Não realize outros procedimentos na área
• Evite compressão da face (massagem facial, máscara de dormir)

É NORMAL APRESENTAR:
• Leve inchaço e vermelhidão nas primeiras 24 a 48 horas
• Pequenas equimoses em torno do nariz — resolvem em 7 a 14 dias
• Assimetria inicial — o resultado definitivo é visível após a resolução do edema

RESULTADOS ESPERADOS:
• Melhora imediata do contorno nasal
• Resultado definitivo após resolução do edema (1 a 2 semanas)
• Duração: 6 a 12 meses

SINAIS DE ALERTA — retorne IMEDIATAMENTE se apresentar:
• Dor intensa e crescente no nariz
• Palidez, esbranquiçamento ou coloração azulada/roxa da pele do nariz (EMERGÊNCIA VASCULAR)
• Visão turva ou alteração visual
• Formigamento ou dormência intensa

Em caso de dúvidas, entre em contato com a clínica.`,
  },
};
