import { useMemo, useState } from "react";
import type { Arquivo, ChecklistItem } from "./types";
import { CHECKLIST, CATEGORIAS, CLIENTE } from "./lib/checklist";
import { analisarQualidade, carregarCanvas, validarArquivoBruto } from "./lib/qualidade";
import { executarOcr } from "./lib/ocr";
import { extrarDados, padronizarNome } from "./lib/extracao";
import { aplicarRegras, analisarIptu, analisarOnusMatricula, cruzarTitularidade, ITEM_DO_TIPO, statusFinal, validarTipoDocumento } from "./lib/regras";
import { arquivoAtual, itemConcluido, itensFaltando, situacaoCpf } from "./lib/condicionais";
import { Header } from "./components/Header";
import { Etapas } from "./components/Etapas";
import { ResumoEnvio } from "./components/ResumoEnvio";
import { ItemCard } from "./components/ItemCard";
import { DetalheModal } from "./components/DetalheModal";
import { Pendencias } from "./components/Pendencias";

export default function App() {
  const [arquivos, setArquivos] = useState<Record<string, Arquivo[]>>({});
  const [modal, setModal] = useState<Arquivo | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // RF01 – checklist dinâmico: o CPF depende do RG/CNH enviado
  const cpf = useMemo(() => situacaoCpf(arquivos, CLIENTE), [arquivos]);
  const faltando = useMemo(() => itensFaltando(arquivos, cpf), [arquivos, cpf]);
  // Pendências consideram só o arquivo mais recente de cada item (reenvio substitui o anterior)
  const atuais = useMemo(
    () => CHECKLIST.map((i) => arquivoAtual(arquivos, i.id)).filter((a): a is Arquivo => !!a),
    [arquivos]
  );
  const concluidos = CHECKLIST.filter((i) => itemConcluido(arquivos, i, cpf)).length;

  async function processar(item: ChecklistItem, file: File) {
    setErro(null);
    const motivoErro = validarArquivoBruto(file);
    if (motivoErro) {
      setErro(`${file.name}: ${motivoErro}`);
      return;
    }
    const id = crypto.randomUUID();
    const url = URL.createObjectURL(file);
    const provisorio: Arquivo = {
      id,
      item: item.id,
      nomeOriginal: file.name,
      nomePadronizado: "…",
      url,
      tipoMime: file.type,
      status: "processando",
      score: 0,
      quality: null,
      texto: "",
      dados: null,
      alertas: [],
      dataEnvio: new Date().toISOString(),
    };
    setArquivos((prev) => ({ ...prev, [item.id]: [...(prev[item.id] ?? []), provisorio] }));

    try {
      // F05 – qualidade da imagem (nitidez, resolução, iluminação)
      const canvas = await carregarCanvas(file);
      const quality = analisarQualidade(canvas);

      // F06 – OCR no navegador + score de confiança
      const { texto, score } = await executarOcr(canvas);

      // F07/F08 – classificação e extração
      const dados = extrarDados(texto);

      // F07 – o tipo do documento precisa bater com o item; F09 – regras de negócio
      const alertas = [
        ...validarTipoDocumento(item, dados),
        ...aplicarRegras(item, quality, score, dados, CLIENTE),
      ];
      if (item.id === "matricula") alertas.push(...analisarOnusMatricula(texto));
      if (item.id === "iptu") alertas.push(...analisarIptu(texto));
      // F10 – titularidade (não se aplica ao imóvel: o proprietário pode ser o vendedor)
      if (item.id !== "iptu" && item.id !== "matricula") alertas.push(...cruzarTitularidade(dados, CLIENTE));

      // qualidade da imagem gera recusa
      if (!quality.resolucaoOk) {
        alertas.push({ nivel: "erro", mensagem: "Resolução baixa — envie uma foto maior/nítida do original.", regra: "Imagem nítida, sem cortes, a partir do documento original." });
      }
      // PDF nato digital tem fundo 100% branco: a checagem de flash/iluminação vale só para fotos
      if (file.type !== "application/pdf" && !quality.brilhoOk) {
        alertas.push({ nivel: "erro", mensagem: "Iluminação inadequada (muito escura ou com flash/estouro).", regra: "Foto colorida, sem reflexo e com boa iluminação." });
      }
      if (quality.nitidezScore < 40) {
        alertas.push({ nivel: "erro", mensagem: "Imagem desfocada.", regra: "Imagem nítida (variância do Laplaciano)." });
      }

      const nomePadronizado = padronizarNome(
        dados.tipoDetectado,
        dados.cpfs[0] ?? CLIENTE.cpf,
        dados.nomes[0] ?? CLIENTE.nome
      );

      const final: Arquivo = {
        ...provisorio,
        status: statusFinal(alertas, score),
        score,
        quality,
        texto,
        dados,
        alertas,
        nomePadronizado,
      };
      setArquivos((prev) => ({
        ...prev,
        [item.id]: (prev[item.id] ?? []).map((a) => (a.id === id ? final : a)),
      }));
    } catch (e) {
      setErro(`${file.name}: falha ao processar (${String(e)}).`);
      setArquivos((prev) => ({
        ...prev,
        [item.id]: (prev[item.id] ?? []).filter((a) => a.id !== id),
      }));
    }
  }

  async function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    for (const f of files) {
      // F07 em modo lote: classifica o arquivo e encaixa no item certo (RF02/RF03)
      const alvo = await classificarAlvo(f);
      await processar(alvo, f);
    }
  }

  async function classificarAlvo(file: File): Promise<ChecklistItem> {
    try {
      const canvas = await carregarCanvas(file);
      const { texto } = await executarOcr(canvas);
      const dados = extrarDados(texto);
      const alvo = ITEM_DO_TIPO[dados.tipoDetectado];
      if (alvo) return CHECKLIST.find((i) => i.id === alvo)!;
    } catch {
      /* cai no primeiro obrigatório pendente */
    }
    return faltando[0] ?? CHECKLIST[0];
  }

  return (
    <div className="page">
      <Header />
      <main className="grid" onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={onDrop}>
        <div className={`dropzone-hint ${dragOver ? "visible" : ""}`}>
          Solte os arquivos — a IA classifica e distribui automaticamente
        </div>

        <section className="hero card">
          <span className="etapa-badge">Etapa 2 de 4 · Documentação</span>
          <h1>Envie os documentos do cliente</h1>
          <p className="muted">
            Proposta de <strong>{CLIENTE.nome}</strong> · CPF {CLIENTE.cpf} · {CLIENTE.estadoCivil}
          </p>
          <p className="muted small">
            Arquivos legíveis e sem cortes · PDF, JPG ou PNG até 10 MB · pendências retornam ao consultor · prazo de 3 dias úteis.
          </p>
        </section>

        <Etapas concluidos={concluidos} total={CHECKLIST.length} />

        {erro && <div className="card erro-banner">❌ {erro}</div>}

        <section className="col-main">
          {CATEGORIAS.map((cat) => (
            <div key={cat} className="categoria">
              <h2>
                {cat === "Identificacao" ? "Identificação" : cat === "Imovel" ? "Imóvel" : "Renda"}
              </h2>
              <div className="itens">
                {CHECKLIST.filter((i) => i.categoria === cat).map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    arquivos={arquivos[item.id] ?? []}
                    condicao={item.id === "cpf" ? cpf : undefined}
                    onUpload={processar}
                    onVer={setModal}
                  />
                ))}
              </div>
            </div>
          ))}
          <Pendencias
            arquivos={atuais}
            faltando={faltando}
            onEnviar={() => {}}
            onCopiar={(msg) => {
              navigator.clipboard?.writeText(msg);
              alert("Mensagem copiada!");
            }}
          />
        </section>

        <aside className="col-side">
          <ResumoEnvio arquivos={arquivos} concluido={(item) => itemConcluido(arquivos, item, cpf)} />
          <section className="card">
            <h3>Importante</h3>
            <ul className="muted small list">
              <li>A lista de documentos pode variar conforme o perfil da operação (checklist dinâmico — RF01). Ex.: o CPF só é exigido se o RG não tiver o número.</li>
              <li>Score de confiança ≥ 80% valida automaticamente; abaixo disso vai para a fila de exceção do Middle (RF05).</li>
              <li>Documentos de terceiros não ligados à proposta são bloqueados (RF07).</li>
              <li>A aprovação final depende da análise do Crédito.</li>
            </ul>
            {faltando.length > 0 && (
              <p className="small">⬜ Faltam itens obrigatórios: {faltando.map((i) => i.titulo).join(", ")}</p>
            )}
          </section>
        </aside>
      </main>

      <DetalheModal arquivo={modal} onClose={() => setModal(null)} />

      <footer className="footer muted small">
        Protótipo do case Bari — uso interno · OCR local no navegador (LGPD) · feedback em tempo real (US04/US05)
      </footer>
    </div>
  );
}