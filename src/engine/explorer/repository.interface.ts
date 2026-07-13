export interface IExplorerRepository {
  /**
   * Fetches the ABI string for a given contract address.
   * Returns null if unverified or ABI is unavailable.
   */
  fetchContractAbi(address: string): Promise<string | null>;

  /**
   * Fetches the verified source code (could be single string or JSON map of files).
   * Returns null if unverified.
   */
  fetchContractSource(address: string): Promise<string | null>;

  /**
   * Resolves a proxy address to its implementation address.
   * Returns null if it is not a recognized proxy or has no implementation.
   */
  resolveProxyImplementation(address: string): Promise<string | null>;

  /**
   * Fetches the contract name from explorer metadata.
   */
  fetchContractName?(address: string): Promise<string | null>;

  /**
   * Fetches the compiler version from explorer metadata.
   */
  fetchCompilerVersion?(address: string): Promise<string | null>;
}
