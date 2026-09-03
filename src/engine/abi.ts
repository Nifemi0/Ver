/** Canonical identity preserves overloads and tuple/array component order. */
export function abiType(parameter: any): string {
  if (parameter.type?.startsWith("tuple")) {
    return `(${(parameter.components ?? []).map(abiType).join(",")})${parameter.type.slice(5)}`;
  }
  return parameter.type;
}

export function abiSignature(item: any): string {
  return `${item.name ?? item.type}(${(item.inputs ?? []).map(abiType).join(",")})`;
}

/** Sort object keys, never ordered arrays such as function parameters. */
export function canonicalJson(value: any): string {
  const normalize = (v: any): any => Array.isArray(v) ? v.map(normalize)
    : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map(k => [k, normalize(v[k])])) : v;
  return JSON.stringify(normalize(value));
}

/** Later ABI wins only for an identical signature; overloads remain distinct. */
export function mergeAbis(...abis: any[][]): any[] {
  const entries = new Map<string, any>();
  for (const abi of abis) for (const item of abi) {
    if (!item || typeof item.type !== "string") throw new Error("Invalid ABI item");
    entries.set(`${item.type}:${abiSignature(item)}`, item);
  }
  return [...entries.entries()].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([, item]) => item);
}

export function hasSource(source: string | null): boolean {
  if (!source || source.includes("Pseudo-ABI generated")) return false;
  let text = source.trim();
  if (text.startsWith("{{")) text = text.slice(1, -1);
  if (text.startsWith("{")) {
    try {
      const sources = JSON.parse(text).sources;
      return !!sources && Object.values(sources).some((file: any) => hasSource(file.content));
    } catch { return false; }
  }
  text = text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "").trim();
  return text.length > 0;
}

export function hasAbi(raw: string | null): boolean {
  try { const abi = JSON.parse(raw ?? "null"); return Array.isArray(abi) && abi.length > 0 && abi.every(item => item && typeof item.type === "string"); }
  catch { return false; }
}
