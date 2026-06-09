export type TipoTermo =
  | "termo_botox"
  | "termo_preenchimento"
  | "autorizacao_imagem"
  | "termo_bioestimuladores"
  | "termo_skinbooster"
  | "termo_fios_pdo"
  | "termo_peeling"
  | "termo_microagulhamento"
  | "termo_intradermoterapia"
  | "termo_peim"
  | "termo_enzimas"
  | "termo_rinomodelacao"
  | "contrato_geral";

export const TERMOS: Record<TipoTermo, { titulo: string; texto: string }> = {
  termo_botox: {
    titulo: "Termo de Consentimento — Toxina Botulínica",
    texto: `Declaro estar ciente e concordo em realizar o procedimento de aplicação de Toxina Botulínica, conforme orientação e esclarecimentos prestados pelo(a) profissional responsável.

Declaro que recebi informações adequadas sobre a aplicação da toxina botulínica e suas possíveis complicações, riscos e benefícios. Entendo que a toxina botulínica é um medicamento injetável usado para tratar determinadas condições médicas, tais como rugas faciais, distúrbios neurológicos e hiperidrose, entre outras.

Ao assinar este termo, reconheço e concordo com os seguintes pontos:

NATUREZA DO PROCEDIMENTO: Compreendo que a toxina botulínica será injetada em áreas específicas do meu corpo conforme acordado com o(a) profissional responsável, com o objetivo de melhorar ou tratar a condição mencionada.

BENEFÍCIOS E RESULTADOS ESPERADOS: Fui informado(a) de que os benefícios da aplicação de toxina botulínica podem incluir a redução das rugas e linhas de expressão, melhora dos sintomas de distúrbios neurológicos, redução da sudorese excessiva, entre outros tratamentos discutidos. Entendo que os resultados podem variar de pessoa para pessoa, e não há garantia de resultados completos ou permanentes.

RISCOS E COMPLICAÇÕES: Fui devidamente informado(a) sobre os riscos associados ao uso da toxina botulínica, que podem incluir, mas não se limitam a:
• Reações alérgicas, como coceira, vermelhidão, inchaço ou erupções cutâneas;
• Hematomas, dor ou desconforto no local da injeção;
• Fraqueza muscular temporária na área tratada;
• Assimetria facial ou alterações na expressão facial;
• Infecção no local da injeção;
• Outras complicações possíveis, que serão explicadas pelo(a) profissional.

PROCEDIMENTO ALTERNATIVO: Fui informado(a) de que existem alternativas à aplicação de toxina botulínica para tratar minha condição. Estou ciente das opções disponíveis, incluindo outros tratamentos e procedimentos, e discuti essas opções com o(a) profissional responsável.

CUIDADOS PÓS-TRATAMENTO:
• Fui devidamente instruído(a) sobre os cuidados pós-tratamento.
• Estou ciente de que podem ser necessárias sessões de acompanhamento para avaliar os resultados e realizar ajustes, se necessário.

SIGILO E PRIVACIDADE: Concordo que todas as informações relacionadas ao meu tratamento serão mantidas em sigilo de acordo com as leis e regulamentos aplicáveis.

PERGUNTAS E ESCLARECIMENTOS: Recebi a oportunidade de fazer perguntas sobre o procedimento, seus riscos e benefícios, e todas as minhas dúvidas foram respondidas satisfatoriamente.

Confirmo que li e compreendi completamente este termo de consentimento livre e esclarecido e concordo em seguir as instruções do(a) profissional responsável antes, durante e após a aplicação da toxina botulínica.`,
  },
  termo_preenchimento: {
    titulo: "Termo de Consentimento — Preenchimento Facial",
    texto: `Declaro estar ciente e concordo em realizar o procedimento de Preenchimento Facial, conforme orientação e esclarecimentos prestados pelo(a) profissional responsável.

Declaro que recebi informações adequadas sobre o procedimento de preenchimento facial e labial e suas possíveis complicações, riscos e benefícios. Entendo que o preenchimento facial e labial envolve a injeção de substâncias para melhorar o contorno, volume e aparência dos meus lábios e áreas faciais específicas.

Ao assinar este termo, reconheço e concordo com os seguintes pontos:

NATUREZA DO PROCEDIMENTO: Compreendo que o preenchimento facial e labial será realizado através da injeção de substâncias específicas nas áreas acordadas com o(a) profissional responsável, com o objetivo de melhorar a estética dos meus lábios e/ou contorno facial.

BENEFÍCIOS E RESULTADOS ESPERADOS: Fui informado(a) de que os benefícios do preenchimento facial e labial podem incluir o aumento do volume e definição dos lábios, redução de rugas e sulcos faciais, e melhora da simetria facial. No entanto, entendo que os resultados podem variar de pessoa para pessoa, e não há garantia de resultados completos ou permanentes.

RISCOS E COMPLICAÇÕES: Fui devidamente informado(a) sobre os riscos associados ao preenchimento facial e labial, que podem incluir, mas não se limitar a:
• Reações alérgicas, como coceira, vermelhidão, inchaço ou erupções cutâneas;
• Hematomas, dor ou desconforto no local da injeção;
• Infecção no local da injeção;
• Deslocamento do produto, resultando em assimetria ou alterações na aparência;
• Formação de nódulos ou granulomas;
• Necrose tecidual (raro, mas possível);
• Outras complicações possíveis, que serão explicadas pelo profissional.

PROCEDIMENTO ALTERNATIVO: Fui informado(a) de que existem alternativas ao preenchimento facial e labial para melhorar a aparência dos meus lábios e contorno facial. Estou ciente das opções disponíveis, incluindo outros tratamentos e procedimentos, e discuti essas opções com o(a) profissional responsável.

CUIDADOS PÓS-TRATAMENTO:
• Fui devidamente instruído(a) sobre os cuidados pós-tratamento.
• Estou ciente de que podem ser necessárias sessões de acompanhamento para avaliar os resultados e realizar ajustes, se necessário.

SIGILO E PRIVACIDADE: Concordo que todas as informações relacionadas ao meu tratamento serão mantidas em sigilo de acordo com as leis e regulamentos aplicáveis.

PERGUNTAS E ESCLARECIMENTOS: Recebi a oportunidade de fazer perguntas sobre o procedimento, seus riscos e benefícios, e todas as minhas dúvidas foram respondidas satisfatoriamente.

Confirmo que li e compreendi completamente este termo de consentimento livre e esclarecido e concordo em seguir as instruções do profissional responsável antes, durante e após o procedimento.`,
  },
  termo_bioestimuladores: {
    titulo: "Termo de Consentimento — Bioestimuladores de Colágeno",
    texto: `Declaro estar ciente e concordo em realizar o procedimento de aplicação de Bioestimuladores de Colágeno, conforme orientação e esclarecimentos prestados pelo(a) profissional responsável.

Declaro que recebi informações adequadas sobre o procedimento e suas possíveis complicações, riscos e benefícios. Entendo que os bioestimuladores de colágeno são substâncias injetáveis que estimulam a produção natural de colágeno pelo organismo, promovendo rejuvenescimento e melhora da qualidade da pele de forma gradual.

NATUREZA DO PROCEDIMENTO: Compreendo que o produto será injetado em áreas específicas do meu rosto/corpo conforme acordado com o(a) profissional responsável, com objetivo de estimular a neocolagênese e melhorar a firmeza e textura da pele.

BENEFÍCIOS E RESULTADOS ESPERADOS: Fui informado(a) de que os benefícios incluem melhora progressiva da firmeza, elasticidade e qualidade da pele ao longo de 2 a 6 meses. Entendo que os resultados são graduais e podem variar de pessoa para pessoa, geralmente exigindo 2 a 3 sessões.

RISCOS E COMPLICAÇÕES: Fui devidamente informado(a) sobre os riscos que podem incluir, mas não se limitam a:
• Nódulos ou granulomas na área tratada (mais comuns quando a massagem pós-procedimento não é realizada corretamente)
• Reação inflamatória crônica
• Hematomas e equimoses no local da injeção
• Edema local temporário
• Assimetria ou resultado insatisfatório
• Infecção no local da injeção
• Reação alérgica

OBRIGATORIEDADE DA MASSAGEM: Estou ciente de que a massagem na área tratada, conforme orientada pela profissional, é fundamental para a distribuição uniforme do produto e prevenção de nódulos.

CUIDADOS PÓS-TRATAMENTO: Fui devidamente instruído(a) sobre os cuidados pós-tratamento, incluindo técnica e frequência de massagem, proteção solar e restrições de atividades.

SIGILO E PRIVACIDADE: Concordo que todas as informações relacionadas ao meu tratamento serão mantidas em sigilo.

PERGUNTAS E ESCLARECIMENTOS: Recebi a oportunidade de fazer perguntas e todas as minhas dúvidas foram respondidas satisfatoriamente.

Confirmo que li e compreendi completamente este termo de consentimento livre e esclarecido.`,
  },

  termo_skinbooster: {
    titulo: "Termo de Consentimento — Skinbooster",
    texto: `Declaro estar ciente e concordo em realizar o procedimento de Skinbooster, conforme orientação e esclarecimentos prestados pelo(a) profissional responsável.

Declaro que recebi informações adequadas sobre o procedimento e suas possíveis complicações, riscos e benefícios. Entendo que o Skinbooster é um tratamento de hidratação profunda por meio de microinjeções de ácido hialurônico de baixa densidade na derme, com o objetivo de melhorar a hidratação, luminosidade e qualidade da pele.

NATUREZA DO PROCEDIMENTO: Compreendo que o ácido hialurônico será injetado em micropontos distribuídos nas áreas acordadas com o(a) profissional responsável.

BENEFÍCIOS E RESULTADOS ESPERADOS: Fui informado(a) de que os benefícios incluem hidratação intensa, melhora da luminosidade, textura e elasticidade da pele. Os resultados são progressivos e geralmente são necessárias 2 a 3 sessões iniciais.

RISCOS E COMPLICAÇÕES: Fui devidamente informado(a) sobre os riscos que podem incluir, mas não se limitam a:
• Nódulos ou irregularidades na pele (geralmente temporários)
• Hematomas e equimoses no local das injeções
• Edema local temporário
• Granulomas (raro)
• Infecção no local da injeção
• Reação alérgica ao ácido hialurônico

CUIDADOS PÓS-TRATAMENTO: Fui devidamente instruído(a) sobre os cuidados pós-procedimento, incluindo proteção solar e restrições.

SIGILO E PRIVACIDADE: Concordo que todas as informações relacionadas ao meu tratamento serão mantidas em sigilo.

PERGUNTAS E ESCLARECIMENTOS: Recebi a oportunidade de fazer perguntas e todas as minhas dúvidas foram respondidas satisfatoriamente.

Confirmo que li e compreendi completamente este termo de consentimento livre e esclarecido.`,
  },

  termo_fios_pdo: {
    titulo: "Termo de Consentimento — Fios de PDO",
    texto: `Declaro estar ciente e concordo em realizar o procedimento de Fios de PDO (Polidioxanona), conforme orientação e esclarecimentos prestados pelo(a) profissional responsável.

Declaro que recebi informações adequadas sobre o procedimento e suas possíveis complicações, riscos e benefícios. Entendo que os fios de PDO são fios absorvíveis inseridos na derme/hipoderme para promover efeito de lifting, estimulação de colágeno e remodelamento facial.

NATUREZA DO PROCEDIMENTO: Compreendo que os fios serão inseridos por meio de agulhas ou cânulas em áreas específicas do rosto/pescoço conforme planejado com o(a) profissional responsável.

BENEFÍCIOS E RESULTADOS ESPERADOS: Fui informado(a) de que os benefícios incluem efeito de lifting imediato e progressivo, melhora da firmeza e estimulação da neocolagênese. Os resultados são visíveis em 4 a 8 semanas e duram de 12 a 18 meses.

RISCOS E COMPLICAÇÕES: Fui devidamente informado(a) sobre os riscos que podem incluir, mas não se limitam a:
• Hematomas e equimoses no local da inserção
• Irregularidades e assimetria temporária
• Migração dos fios
• Infecção no local da inserção
• Lesão a vasos, nervos ou músculos
• Fio visível ou palpável sob a pele
• Resultado insatisfatório ou assimetria persistente

RESTRIÇÕES IMPORTANTES: Estou ciente das restrições pós-procedimento, especialmente não realizar massagem facial por 1 mês e evitar procedimentos com calor intenso na área.

SIGILO E PRIVACIDADE: Concordo que todas as informações relacionadas ao meu tratamento serão mantidas em sigilo.

PERGUNTAS E ESCLARECIMENTOS: Recebi a oportunidade de fazer perguntas e todas as minhas dúvidas foram respondidas satisfatoriamente.

Confirmo que li e compreendi completamente este termo de consentimento livre e esclarecido.`,
  },

  termo_peeling: {
    titulo: "Termo de Consentimento — Peeling Químico",
    texto: `Declaro estar ciente e concordo em realizar o procedimento de Peeling Químico, conforme orientação e esclarecimentos prestados pelo(a) profissional responsável.

Declaro que recebi informações adequadas sobre o procedimento e suas possíveis complicações, riscos e benefícios. Entendo que o peeling químico consiste na aplicação de substâncias ácidas na pele para promover esfoliação controlada, renovação celular e melhora de manchas, textura e cicatrizes.

NATUREZA DO PROCEDIMENTO: Compreendo que o ácido (TCA, AHA, BHA ou outro conforme indicado) será aplicado nas áreas acordadas com o(a) profissional responsável, com concentração e tempo de exposição específicos para o meu caso.

BENEFÍCIOS E RESULTADOS ESPERADOS: Fui informado(a) de que os benefícios incluem melhora de manchas, textura irregular, poros dilatados, cicatrizes superficiais e envelhecimento cutâneo. Os resultados variam conforme o tipo e profundidade do peeling utilizado.

RISCOS E COMPLICAÇÕES: Fui devidamente informado(a) sobre os riscos que podem incluir, mas não se limitam a:
• Hiperpigmentação pós-inflamatória (manchas escuras) — especialmente em fototipos mais escuros
• Hipopigmentação (manchas claras)
• Eritema (vermelhidão) prolongado
• Cicatrizes (raro, mais associado a peelings profundos)
• Herpes labial reativada (em pessoas com histórico)
• Infecção secundária
• Resultado insatisfatório

IMPORTÂNCIA DA FOTOPROTEÇÃO: Estou ciente de que o uso de protetor solar FPS 50+ é OBRIGATÓRIO por pelo menos 3 meses após o procedimento, e que a exposição solar sem proteção pode causar manchas permanentes.

SIGILO E PRIVACIDADE: Concordo que todas as informações relacionadas ao meu tratamento serão mantidas em sigilo.

PERGUNTAS E ESCLARECIMENTOS: Recebi a oportunidade de fazer perguntas e todas as minhas dúvidas foram respondidas satisfatoriamente.

Confirmo que li e compreendi completamente este termo de consentimento livre e esclarecido.`,
  },

  termo_microagulhamento: {
    titulo: "Termo de Consentimento — Microagulhamento",
    texto: `Declaro estar ciente e concordo em realizar o procedimento de Microagulhamento (Micropunção), conforme orientação e esclarecimentos prestados pelo(a) profissional responsável.

Declaro que recebi informações adequadas sobre o procedimento e suas possíveis complicações, riscos e benefícios. Entendo que o microagulhamento consiste na criação de microcanais na pele por meio de agulhas, estimulando a produção de colágeno e elastina, além de aumentar a absorção de ativos tópicos.

NATUREZA DO PROCEDIMENTO: Compreendo que o procedimento será realizado com aparelho específico de microagulhamento nas áreas acordadas com o(a) profissional responsável.

BENEFÍCIOS E RESULTADOS ESPERADOS: Fui informado(a) de que os benefícios incluem melhora de cicatrizes de acne, manchas, linhas de expressão, poros dilatados e textura da pele. Os resultados são progressivos e geralmente são necessárias 3 a 6 sessões com intervalo de 4 a 6 semanas.

RISCOS E COMPLICAÇÕES: Fui devidamente informado(a) sobre os riscos que podem incluir, mas não se limitam a:
• Vermelhidão e sensibilidade intensa nas primeiras 24 a 48 horas
• Hiperpigmentação pós-inflamatória (especialmente em fototipos mais escuros)
• Infecção (se as normas de esterilização não forem seguidas adequadamente)
• Reativação de herpes labial em pessoas com histórico
• Cicatrizes (raro)
• Resultado insatisfatório

RESTRIÇÕES IMPORTANTES: Estou ciente de que não devo usar retinol, ácidos ou esfoliantes por 7 dias após o procedimento, e que o protetor solar FPS 50+ é obrigatório.

SIGILO E PRIVACIDADE: Concordo que todas as informações relacionadas ao meu tratamento serão mantidas em sigilo.

PERGUNTAS E ESCLARECIMENTOS: Recebi a oportunidade de fazer perguntas e todas as minhas dúvidas foram respondidas satisfatoriamente.

Confirmo que li e compreendi completamente este termo de consentimento livre e esclarecido.`,
  },

  termo_intradermoterapia: {
    titulo: "Termo de Consentimento — Intradermoterapia",
    texto: `Declaro estar ciente e concordo em realizar o procedimento de Intradermoterapia (Mesoterapia), conforme orientação e esclarecimentos prestados pelo(a) profissional responsável.

Declaro que recebi informações adequadas sobre o procedimento e suas possíveis complicações, riscos e benefícios. Entendo que a intradermoterapia consiste na aplicação de microinjeções de substâncias ativas (vitaminas, minerais, aminoácidos, medicamentos) diretamente na derme para tratamento de diversas condições estéticas.

NATUREZA DO PROCEDIMENTO: Compreendo que as substâncias serão injetadas por meio de microagulhas nas áreas acordadas com o(a) profissional responsável.

BENEFÍCIOS E RESULTADOS ESPERADOS: Fui informado(a) de que os benefícios variam conforme os ativos utilizados, podendo incluir melhora da hidratação, luminosidade, lipólise localizada, queda de cabelo e celulite. Os resultados são progressivos ao longo das sessões.

RISCOS E COMPLICAÇÕES: Fui devidamente informado(a) sobre os riscos que podem incluir, mas não se limitam a:
• Hematomas e equimoses no local das injeções
• Nódulos temporários no local de aplicação
• Fibrose subcutânea (raro)
• Alteração de pigmentação da pele
• Infecção no local da injeção
• Reação alérgica às substâncias utilizadas
• Resultado insatisfatório

SIGILO E PRIVACIDADE: Concordo que todas as informações relacionadas ao meu tratamento serão mantidas em sigilo.

PERGUNTAS E ESCLARECIMENTOS: Recebi a oportunidade de fazer perguntas e todas as minhas dúvidas foram respondidas satisfatoriamente.

Confirmo que li e compreendi completamente este termo de consentimento livre e esclarecido.`,
  },

  termo_peim: {
    titulo: "Termo de Consentimento — PEIM (Microvasos)",
    texto: `Declaro estar ciente e concordo em realizar o procedimento de PEIM para tratamento de microvasos, conforme orientação e esclarecimentos prestados pelo(a) profissional responsável.

Declaro que recebi informações adequadas sobre o procedimento e suas possíveis complicações, riscos e benefícios. Entendo que o PEIM (Pulso Eletromagnético de Impulso) utiliza tecnologia específica para o tratamento de microvasos, teleangiectasias e eritemas cutâneos.

NATUREZA DO PROCEDIMENTO: Compreendo que o procedimento será realizado nas áreas vasculares acordadas com o(a) profissional responsável.

BENEFÍCIOS E RESULTADOS ESPERADOS: Fui informado(a) de que os benefícios incluem redução ou eliminação de microvasos, teleangiectasias e vermelhidão cutânea. Podem ser necessárias múltiplas sessões e os resultados variam conforme o tipo e calibre dos vasos.

RISCOS E COMPLICAÇÕES: Fui devidamente informado(a) sobre os riscos que podem incluir, mas não se limitam a:
• Escurecimento transitório dos vasos tratados (antes de desaparecer)
• Hiperpigmentação pós-inflamatória
• Eritema e edema local temporários
• Persistência dos microvasos (resposta insatisfatória)
• Reativação de herpes
• Queimadura cutânea superficial (raro)
• Reação alérgica

FOTOPROTEÇÃO OBRIGATÓRIA: Estou ciente de que o uso de protetor solar FPS 50+ é fundamental após o procedimento para evitar manchas.

SIGILO E PRIVACIDADE: Concordo que todas as informações relacionadas ao meu tratamento serão mantidas em sigilo.

PERGUNTAS E ESCLARECIMENTOS: Recebi a oportunidade de fazer perguntas e todas as minhas dúvidas foram respondidas satisfatoriamente.

Confirmo que li e compreendi completamente este termo de consentimento livre e esclarecido.`,
  },

  termo_enzimas: {
    titulo: "Termo de Consentimento — Enzimas Lipolíticas",
    texto: `Declaro estar ciente e concordo em realizar o procedimento de aplicação de Enzimas Lipolíticas, conforme orientação e esclarecimentos prestados pelo(a) profissional responsável.

Declaro que recebi informações adequadas sobre o procedimento e suas possíveis complicações, riscos e benefícios. Entendo que as enzimas lipolíticas são substâncias injetáveis que promovem a lise (destruição) de células de gordura localizada, auxiliando no tratamento de gordura localizada e celulite.

NATUREZA DO PROCEDIMENTO: Compreendo que as enzimas serão injetadas nas áreas de gordura localizada acordadas com o(a) profissional responsável.

BENEFÍCIOS E RESULTADOS ESPERADOS: Fui informado(a) de que os benefícios incluem redução de gordura localizada, melhora do contorno corporal e celulite. Os resultados são progressivos ao longo das sessões, geralmente de 4 a 8 aplicações.

RISCOS E COMPLICAÇÕES: Fui devidamente informado(a) sobre os riscos que podem incluir, mas não se limitam a:
• Hematomas e equimoses no local das injeções
• Edema e endurecimento local temporários
• Assimetria ou irregularidade no contorno
• Falta de resposta ao tratamento
• Infecção no local da injeção
• Reação alérgica às enzimas utilizadas
• Fibrose localizada (raro)

MASSAGEM PÓS-PROCEDIMENTO: Estou ciente de que a massagem na área tratada, conforme orientada pela profissional, é essencial para distribuir o produto e otimizar os resultados.

SIGILO E PRIVACIDADE: Concordo que todas as informações relacionadas ao meu tratamento serão mantidas em sigilo.

PERGUNTAS E ESCLARECIMENTOS: Recebi a oportunidade de fazer perguntas e todas as minhas dúvidas foram respondidas satisfatoriamente.

Confirmo que li e compreendi completamente este termo de consentimento livre e esclarecido.`,
  },

  termo_rinomodelacao: {
    titulo: "Termo de Consentimento — Rinomodelação",
    texto: `Declaro estar ciente e concordo em realizar o procedimento de Rinomodelação (Rinoplastia não cirúrgica), conforme orientação e esclarecimentos prestados pelo(a) profissional responsável.

Declaro que recebi informações adequadas sobre o procedimento e suas possíveis complicações, riscos e benefícios. Entendo que a rinomodelação consiste na injeção de ácido hialurônico ou outros preenchedores no nariz para corrigir assimetrias, elevar a ponta nasal ou camuflar irregularidades, sem necessidade de cirurgia.

NATUREZA DO PROCEDIMENTO: Compreendo que o preenchedor será injetado em pontos específicos do nariz conforme planejamento com o(a) profissional responsável.

BENEFÍCIOS E RESULTADOS ESPERADOS: Fui informado(a) de que os benefícios incluem melhora do contorno nasal de forma não invasiva, com resultado imediato e sem tempo de recuperação prolongado. Duração: 6 a 12 meses.

RISCOS E COMPLICAÇÕES: Fui devidamente informado(a) sobre os riscos que podem incluir, mas não se limitam a:
• Hematomas e edema local
• Assimetria
• OCLUSÃO VASCULAR: o nariz possui vasculatura densa e comunicações com artérias que irrigam olho e cérebro — injeção em vaso pode causar cegueira, acidente vascular encefálico ou necrose tecidual. Este é o risco mais grave da lista e, embora raro, é uma emergência médica. A profissional está treinada para reconhecer e agir imediatamente nesta situação.
• Infecção
• Granulomas
• Resultado insatisfatório

RESTRIÇÕES CRÍTICAS: Estou ciente de que NÃO devo pressionar, apertar ou bater no nariz após o procedimento, e de que o uso de óculos apoiados no nariz está contraindicado por 2 semanas.

EMERGÊNCIA: Em caso de dor intensa, palidez ou coloração azulada/branca do nariz após o procedimento, devo procurar atendimento médico IMEDIATAMENTE.

SIGILO E PRIVACIDADE: Concordo que todas as informações relacionadas ao meu tratamento serão mantidas em sigilo.

PERGUNTAS E ESCLARECIMENTOS: Recebi a oportunidade de fazer perguntas e todas as minhas dúvidas foram respondidas satisfatoriamente.

Confirmo que li e compreendi completamente este termo de consentimento livre e esclarecido.`,
  },

  contrato_geral: {
    titulo: "Contrato de Prestação de Serviços Estéticos",
    texto: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS ESTÉTICOS

Pelo presente instrumento, as partes abaixo identificadas estabelecem o presente Contrato de Prestação de Serviços Estéticos, que se rege pelas cláusulas e condições seguintes:

CLÁUSULA 1 — OBJETO
O presente contrato tem por objeto a prestação de serviços estéticos e de harmonização facial pela CONTRATADA (LB Beauty Clinic) à CONTRATANTE (paciente), nos procedimentos acordados entre as partes, conforme indicação técnica do(a) profissional responsável.

CLÁUSULA 2 — OBRIGAÇÕES DA CONTRATADA
A CONTRATADA se compromete a:
• Realizar os procedimentos com técnica adequada, utilizando produtos e materiais de qualidade e dentro do prazo de validade
• Manter sigilo sobre as informações da CONTRATANTE
• Orientar a CONTRATANTE sobre os cuidados pré e pós-procedimento
• Esclarecer dúvidas antes, durante e após os procedimentos

CLÁUSULA 3 — OBRIGAÇÕES DA CONTRATANTE
A CONTRATANTE se compromete a:
• Fornecer informações verdadeiras sobre seu histórico de saúde, medicamentos em uso, alergias e condições médicas relevantes
• Seguir rigorosamente as orientações pré e pós-procedimento fornecidas pela CONTRATADA
• Comparecer às consultas de retorno agendadas
• Comunicar imediatamente qualquer intercorrência ou reação incomum

CLÁUSULA 4 — RESULTADOS
A CONTRATANTE está ciente de que os resultados dos procedimentos estéticos não são garantidos, podendo variar de acordo com fatores individuais como metabolismo, tipo de pele, estilo de vida e genética. A CONTRATADA não é responsável por resultados diferentes dos esperados quando os cuidados indicados não foram seguidos.

CLÁUSULA 5 — CANCELAMENTO E REMARCAÇÃO
O cancelamento deve ser comunicado com no mínimo 24 horas de antecedência. O não comparecimento sem aviso prévio poderá implicar cobrança de taxa de cancelamento conforme política da clínica.

CLÁUSULA 6 — PROTEÇÃO DE DADOS (LGPD)
Os dados pessoais e de saúde da CONTRATANTE são coletados e tratados em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), sendo utilizados exclusivamente para fins de atendimento e registro de saúde.

CLÁUSULA 7 — FORO
Fica eleito o foro da comarca de Dourados/MS para dirimir quaisquer questões oriundas do presente contrato.

Declaro ter lido e compreendido todas as cláusulas deste contrato, concordando integralmente com seus termos.`,
  },

  autorizacao_imagem: {
    titulo: "Autorização de Uso de Imagem",
    texto: `Autorizo expressamente o uso de minha imagem para fins relacionados à clínica e profissional onde estou realizando meus procedimentos.

1. Autorizo a utilização da minha imagem em fotografias e vídeos para fins de publicidade do(a) profissional, incluindo a divulgação em materiais impressos, eletrônicos e digitais, tais como folhetos, panfletos, banners, websites, redes sociais, entre outros meios de divulgação.

2. Autorizo a divulgação das imagens em redes sociais, tais como Facebook, Instagram, Twitter, YouTube, LinkedIn, entre outras, com o objetivo de promover os serviços prestados pelo(a) profissional, compartilhar informações educativas relacionadas à saúde e destacar casos clínicos exemplares.

3. Autorizo a utilização da minha imagem em apresentações, palestras e participações em congressos, seminários e eventos científicos relacionados ao procedimento no qual estou realizando onde o(a) profissional responsável esteja representando e divulgando seus serviços.

4. Entendo que o(a) profissional responsável se compromete a utilizar as imagens de forma ética e profissional, preservando minha privacidade e confidencialidade, e não divulgando informações pessoais ou confidenciais, como nome completo, endereço, número de telefone, entre outros dados sensíveis.

5. Compreendo que minha imagem poderá ser visualizada por um público amplo, incluindo pacientes atuais e potenciais, profissionais de saúde, estudantes e demais interessados na área.

6. Estou ciente de que esta autorização é voluntária e posso revogá-la a qualquer momento, mediante solicitação por escrito ao(à) profissional responsável. No entanto, entendo que, uma vez divulgadas, as imagens já compartilhadas em redes sociais, congressos e publicidade não poderão ser controladas ou removidas da internet ou de outros meios de divulgação.

7. Concordo que o(a) profissional responsável não será responsável por qualquer uso indevido, alteração ou divulgação não autorizada das imagens por terceiros, uma vez que o(a) profissional responsável se compromete a utilizar as medidas razoáveis para proteger e preservar minha imagem.

Declaro ter lido e compreendido os termos desta autorização antes de assinar este documento.`,
  },
};
