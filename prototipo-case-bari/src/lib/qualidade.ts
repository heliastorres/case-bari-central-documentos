import type { QualityResult } from "../types";

export const ACCEPTED_MIME = ["application/pdf", "image/jpeg", "image/png"];
export const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export function validarArquivoBruto(file: File): string | null {
  if (!ACCEPTED_MIME.includes(file.type)) {
    return `Formato não aceito (${file.type || "desconhecido"}). Aceitos: PDF, JPG e PNG.`;
  }
  if (file.size > MAX_BYTES) {
    return `Arquivo acima de 10 MB (${(file.size / 1024 / 1024).toFixed(1)} MB).`;
  }
  return null;
}

/** Renderiza a 1ª página de um PDF ou carrega a imagem em um <canvas> em escala de análise. */
export async function carregarCanvas(file: File): Promise<HTMLCanvasElement> {
  if (file.type === "application/pdf") {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    const buf = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: buf }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas;
  }
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0);
  return canvas;
}

/**
 * Validação de qualidade da imagem (F05): nitidez (variância do Laplaciano),
 * resolução mínima e iluminação (brilho médio + pixels estourados).
 */
export function analisarQualidade(canvas: HTMLCanvasElement): QualityResult {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const img = ctx.getImageData(0, 0, w, h).data;
  const cinza = new Float64Array(w * h);
  for (let i = 0; i < w * h; i++) {
    cinza[i] = 0.299 * img[i * 4] + 0.587 * img[i * 4 + 1] + 0.114 * img[i * 4 + 2];
  }
  // Laplaciano
  let soma = 0;
  let soma2 = 0;
  let n = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      const lap =
        -4 * cinza[idx] +
        cinza[idx - 1] +
        cinza[idx + 1] +
        cinza[idx - w] +
        cinza[idx + w];
      soma += lap;
      soma2 += lap * lap;
      n++;
    }
  }
  const media = soma / n;
  const variancia = soma2 / n - media * media;
  // nitidez 0-100: variância >= 600 = 100 (documentos nítidos em foto real)
  const nitidezScore = Math.max(0, Math.min(100, Math.round((variancia / 600) * 100)));

  let brilhoSoma = 0;
  let estourados = 0;
  for (let i = 0; i < w * h; i++) {
    const b = cinza[i];
    brilhoSoma += b;
    if (b >= 252) estourados++;
  }
  const brilhoMedio = brilhoSoma / (w * h);
  const estouroPct = (estourados / (w * h)) * 100;

  return {
    nitidezScore,
    resolucaoOk: Math.min(w, h) >= 800,
    largura: w,
    altura: h,
    // Média < 40 = muito escura; estouro > 25% = flash/reflexo (fundo branco de scan é normal)
    brilhoOk: brilhoMedio >= 40 && estouroPct < 25,
    brilhoMedio: Math.round(brilhoMedio),
    estouroPct: Math.round(estouroPct * 100) / 100,
  };
}