import type { Alerta, Arquivo, ChecklistItem, Cliente, DadosExtraidos, DocTipo } from "../types";
import { normalizar } from "./extracao";
import { CHECKLIST } from "./checklist";

export const SCORE_MIN = 80; // RF05: >= 80% validado; < 80% fila de exceção do Middle

function idade(nascimento: string): number {
  const [d, m, a] = nascimento.split("/").map(Number);
  const hoje = new Date();
  const nasc = new Date(a, m - 1, d);
  let idd = hoje.getFullYear() - nasc.getFullYear();
  const mDiff = hoje.getMonth() - nasc.getMonth();
  if (mDiff < 0 || (mDiff === 0 && hoje.getDate() < nasc.getDate())) idd--;
  return idd;
}

function mesesAte(data: string): number {
  // retorna meses decorridos desde a data (dd/mm/aaaa ou aaaa-mm-dd)
  let d: Date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) d = new Date(data);
  else {
    const [dd, mm, aa] = data.split("/").map(Number);
    d = new Date(aa, mm - 1, dd);
  }
  return (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
}

/** Regras de negócio por item do checklist (F09). */
export function aplicarRegras(
  item: ChecklistItem,
  quality: Arquivo["quality"],
  score: number,
  dados: DadosExtraidos,
  cliente: Cliente
): Alerta[] {
  const alertas: Alerta[] = [];
  const t = normalizar(dados.tipoDetectado);
  const texto = normalizar(
    " " + dados.nomes.join(" ") + " " + (dados.cpfs.length ? "" : "") + " "
  );

  // RF06 – travas de prazo e validades
  if (item.id === "comprovante-residencia") {
    const data = dados.datas[0];
    if (!data) {
      alertas.push({ nivel: "erro", mensagem: "Data de emissão ilegível.", regra: "Residência: emitido nos últimos 90 dias." });
    } else if (mesesAte(data) > 3) {
      alertas.push({ nivel: "erro", mensagem: `Comprovante com ${Math.round(mesesAte(data))} meses (limite: 90 dias).`, regra: "Residência: emitido nos últimos 90 dias." });
    }
  }

  if (item.id === "holerite" || item.id === "extrato") {
    const anos = new Set<string>();
    const meses = new Set<string>();
    for (const d of dados.datas) {
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
        const [dd, mm, aa] = d.split("/");
        anos.add(aa);
        meses.add(`${aa}-${mm}`);
        void dd;
      }
    }
    const agora = new Date();
    const esperados = new Set<string>();
    for (let i = 1; i <= 3; i++) {
      const ref = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
      esperados.add(`${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, "0")}`);
    }
    const faltando = [...esperados].filter((m) => !meses.has(m));
    if (meses.size === 0) {
      alertas.push({ nivel: "erro", mensagem: "Não foi possível identificar 3 meses fechados de referência.", regra: "Renda: 3 meses fechados e seguidos." });
    } else {
      if (faltando.length > 0) {
        alertas.push({ nivel: "erro", mensagem: `Renda incompleta — falta(m) o(s) mês(es): ${faltando.join(", ")}.`, regra: "Renda: 3 meses fechados e seguidos." });
      }
      if (meses.size < 3) {
        alertas.push({ nivel: "erro", mensagem: `Encontrado(s) ${meses.size} mês(es) de referência (exigido: 3).`, regra: "Renda: 3 meses fechados e seguidos." });
      }
    }
    void anos;
  }

  if (item.id === "extrato") {
    const natoDigital = score >= SCORE_MIN;
    if (!natoDigital) {
      alertas.push({ nivel: "aviso", mensagem: "Extrato pode não ser nato digital (texto pouco legível — confirme se é PDF original do banco).", regra: "Extrato bancário nato digital, com logo, cliente e conta." });
    }
  }

  if (item.id === "declaracao-ir") {
    if (!dados.temRecibo) {
      alertas.push({ nivel: "erro", mensagem: "Recibo de entrega da declaração ausente.", regra: "IR: declaração + recibo de entrega do exercício vigente." });
    }
  }

  if (item.id === "rg-cnh" && t === "rg") {
    const emissao = dados.datas[0];
    if (emissao) {
      const idd = idade(cliente.nascimento);
      const mesesEmissao = mesesAte(emissao);
      const anosEmissao = mesesEmissao / 12;
      if (idd <= 25 && anosEmissao >= 15) {
        alertas.push({ nivel: "erro", mensagem: `RG emitido há ${anosEmissao.toFixed(1)} anos (cliente ${idd} anos — limite: 15).`, regra: "RG: até 25 anos → emissão < 15 anos." });
      } else if (idd > 50 && anosEmissao > 25) {
        alertas.push({ nivel: "erro", mensagem: `RG emitido há ${anosEmissao.toFixed(1)} anos (idade atual ${idd}).`, regra: "RG: > 50 anos → emissão de no máximo 25 anos antes da idade atual." });
      }
    }
  }

  if (item.id === "rg-cnh" && t === "cnh") {
    // A validade é a data mais futura impressa na CNH
    const validade = dados.datas
      .filter((d) => /^\d{2}\/\d{2}\/\d{4}$/.test(d))
      .sort((a, b) => mesesAte(a) - mesesAte(b))[0];
    if (validade && mesesAte(validade) > 0) {
      alertas.push({ nivel: "erro", mensagem: `CNH vencida em ${validade}.`, regra: "CNH: sempre a emissão mais recente, dentro da validade." });
    }
  }

  return alertas;
}

/** IPTU (3.6) — leitura obrigatória de inscrição imobiliária e metragem no texto do OCR. */
export function analisarIptu(texto: string): Alerta[] {
  const t = normalizar(texto);
  const alertas: Alerta[] = [];
  if (!t.includes("inscricao imobiliaria")) {
    alertas.push({ nivel: "erro", mensagem: "IPTU sem inscrição imobiliária.", regra: "IPTU: leitura obrigatória de metragem e inscrição imobiliária." });
  }
  if (!/metragem|area do terreno|area construida|\bm2\b|m²/.test(t)) {
    alertas.push({ nivel: "erro", mensagem: "IPTU sem metragem do imóvel.", regra: "IPTU: leitura obrigatória de metragem e inscrição imobiliária." });
  }
  return alertas;
}

/** Ônus da matrícula (3.7) — analisa o texto completo do OCR. */
export function analisarOnusMatricula(texto: string): Alerta[] {
  const t = normalizar(texto);
  const alertas: Alerta[] = [];
  if (t.includes("alienacao fiduciaria") || t.includes("alienação fiduciária") || t.includes("hipoteca")) {
    alertas.push({
      nivel: "aviso",
      mensagem: "Ônus de alienação fiduciária/hipoteca vigente — operação dependerá de Portabilidade (mesmo produto) ou IQ – Interveniente Quitante (produto diferente).",
      regra: "Matrícula: alienação fiduciária/hipoteca → Portabilidade ou IQ.",
    });
  }
  if (t.includes("penhora") || t.includes("arresto") || t.includes("acao judicial") || t.includes("ação judicial")) {
    alertas.push({
      nivel: "aviso",
      mensagem: "Indício de penhora/arresto/ação — encaminhar ao Crédito/Jurídico.",
      regra: "Matrícula: penhora/arresto/ações → alerta Crédito.",
    });
  }
  if (/\bhis\b/.test(t) || t.includes("habitacao de interesse social")) {
    alertas.push({
      nivel: "erro",
      mensagem: "Imóvel com averbação de HIS (Habitação de Interesse Social) — garantia não aceita.",
      regra: "Matrícula: HIS averbada → garantia recusada.",
    });
  }
  return alertas;
}

const TIPOS_ACEITOS: Record<string, DocTipo[]> = {
  "rg-cnh": ["RG", "CNH"],
  cpf: ["CPF"],
  "certidao-estado-civil": ["Certidao"],
  // IPTU também serve como comprovante de residência quando é do imóvel onde a pessoa mora
  "comprovante-residencia": ["ComprovanteResidencia", "IPTU"],
  holerite: ["Holerite"],
  extrato: ["Extrato"],
  "declaracao-ir": ["IR", "ReciboIR"],
  iptu: ["IPTU"],
  matricula: ["Matricula"],
};

/** Item onde cada tipo de documento deve ser enviado (usado na sugestão e no arrastar e soltar). */
export const ITEM_DO_TIPO: Partial<Record<DocTipo, string>> = {
  CNH: "rg-cnh",
  RG: "rg-cnh",
  CPF: "cpf",
  Certidao: "certidao-estado-civil",
  ComprovanteResidencia: "comprovante-residencia",
  Holerite: "holerite",
  Extrato: "extrato",
  IR: "declaracao-ir",
  ReciboIR: "declaracao-ir",
  IPTU: "iptu",
  Matricula: "matricula",
};

const NOME_TIPO: Record<DocTipo, string> = {
  CNH: "CNH",
  RG: "RG",
  CPF: "cartão CPF",
  Certidao: "certidão de estado civil",
  ComprovanteResidencia: "comprovante de residência",
  Holerite: "holerite",
  Extrato: "extrato bancário",
  IR: "declaração de IR",
  ReciboIR: "declaração de IR",
  IPTU: "IPTU",
  Matricula: "matrícula do imóvel",
  Desconhecido: "documento não identificado",
};

/** F07 – o documento enviado precisa ser do tipo que o item do checklist pede. */
export function validarTipoDocumento(item: ChecklistItem, dados: DadosExtraidos): Alerta[] {
  const aceitos = TIPOS_ACEITOS[item.id] ?? [];
  const tipo = dados.tipoDetectado;
  if (aceitos.includes(tipo)) return [];
  const esperado = [...new Set(aceitos.map((t) => NOME_TIPO[t]))].join(" ou ");
  if (tipo === "Desconhecido") {
    return [{
      nivel: "aviso",
      mensagem: `Não foi possível identificar o tipo do documento (esperado: ${esperado}).`,
      regra: "Classificação automática (RF03): tipo não reconhecido vai para revisão do Middle.",
    }];
  }
  const regra = "Classificação automática (RF03): o documento precisa corresponder ao item do checklist.";
  if (item.id === "rg-cnh" && tipo === "CPF") {
    return [{
      nivel: "erro",
      mensagem: "O cartão CPF não substitui um documento com foto. Envie RG ou CNH aqui e o cartão CPF no item \"CPF\".",
      regra: "Identificação: RG + CPF ou CNH (o CPF complementa, não substitui).",
    }];
  }
  const destino = CHECKLIST.find((i) => i.id === ITEM_DO_TIPO[tipo]);
  return [{
    nivel: "erro",
    mensagem: `Documento enviado no item errado: parece ser ${NOME_TIPO[tipo]}, mas este item pede ${esperado}.` +
      (destino ? ` Envie no item "${destino.titulo}".` : ""),
    regra,
  }];
}

/** F10 – cruzamento de titularidade (RF07). */
export function cruzarTitularidade(dados: DadosExtraidos, cliente: Cliente): Alerta[] {
  const alertas: Alerta[] = [];
  const nomeCliente = normalizar(cliente.nome);
  const cpfCliente = cliente.cpf.replace(/\D/g, "");
  const nomesDoc = dados.nomes.map(normalizar);
  const temNome = nomesDoc.some((n) => n.includes(nomeCliente) || nomeCliente.includes(n));
  const temCpf = dados.cpfs.includes(cpfCliente);
  if (!temNome && !temCpf) {
    alertas.push({
      nivel: "erro",
      mensagem: `Documento não pertence a nenhum participante da proposta (titular: ${cliente.nome}).`,
      regra: "RF07 – filtro de titularidade: documentos de terceiros são bloqueados.",
    });
  }
  return alertas;
}

export function statusFinal(alertas: Alerta[], score: number): "validado" | "revisao" | "recusado" {
  if (alertas.some((a) => a.nivel === "erro")) return "recusado";
  if (score < SCORE_MIN || alertas.some((a) => a.nivel === "aviso")) return "revisao";
  return "validado";
}