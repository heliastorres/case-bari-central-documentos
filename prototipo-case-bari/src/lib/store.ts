import { useState } from "react";
import type { Arquivo } from "../types";

export function useProposta() {
  const [arquivos, setArquivos] = useState<Record<string, Arquivo[]>>({});
  return { arquivos, setArquivos };
}