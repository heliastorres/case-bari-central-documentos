import { createWorker } from "tesseract.js";
import type { OcrResult } from "../types";

/**
 * OCR no próprio navegador (F06). Os dados não saem da máquina —
 * alinhado à RNF de LGPD do case (dados não podem treinar modelos públicos).
 *
 * NOTA TÉCNICA: com empacotadores (Vite), o worker padrão do tesseract.js v5
 * falha silenciosamente. Por isso apontamos worker/core/langPath para o CDN
 * oficial explicitamente.
 */

const TESS_VERSION = "5.1.1";
const CORE_VERSION = "5.1.0";

let workerPromise: ReturnType<typeof createWorker> | null = null;

function getWorker(): ReturnType<typeof createWorker> {
  if (!workerPromise) {
    workerPromise = createWorker("por", 1, {
      workerPath: `https://cdn.jsdelivr.net/npm/tesseract.js@${TESS_VERSION}/dist/worker.min.js`,
      corePath: `https://cdn.jsdelivr.net/npm/tesseract.js-core@${CORE_VERSION}`,
      langPath: "https://tessdata.projectnaptha.com/4.0.0",
      logger: () => {},
    });
  }
  return workerPromise;
}

/** Timeout de segurança: nunca deixar o item travado em "Processando…". */
function comTimeout<T>(p: Promise<T>, ms: number, msg: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(msg)), ms)
    ),
  ]);
}

export async function executarOcr(canvas: HTMLCanvasElement): Promise<OcrResult> {
  const worker = await comTimeout(
    getWorker(),
    90_000,
    "OCR: tempo excedido ao carregar o motor (verifique a conexão com o CDN do Tesseract)."
  );
  const { data } = await comTimeout(
    worker.recognize(canvas),
    120_000,
    "OCR: tempo excedido na leitura do documento."
  );
  const texto = data.text ?? "";
  const score = Math.round(data.confidence ?? 0);
  return { texto, score };
}