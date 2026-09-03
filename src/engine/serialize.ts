/** Convert nested viem ABI values at every JSON-facing boundary. */
export function serializeAbiValue(value: any): any {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(serializeAbiValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, serializeAbiValue(item)]));
  }
  return value;
}
