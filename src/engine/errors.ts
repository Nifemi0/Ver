export class ExplorerRateLimitError extends Error {
  constructor(message: string = "Explorer API rate limit exceeded") {
    super(message);
    this.name = "ExplorerRateLimitError";
  }
}

export class ExplorerTimeoutError extends Error {
  constructor(message: string = "Explorer API request timed out") {
    super(message);
    this.name = "ExplorerTimeoutError";
  }
}

export class ExplorerAPIError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = "ExplorerAPIError";
  }
}

export class ExplorerDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExplorerDataError";
  }
}
export class PreparationRejected extends Error {
  constructor(public readonly code: string, message: string) { super(message); this.name = "PreparationRejected"; }
}

export function isExecutionRevert(error: any): boolean {
  return /revert/i.test(error?.shortMessage ?? "") || Boolean(error?.walk?.((cause: any) => /ExecutionReverted|ContractFunctionReverted/.test(cause.name)));
}

export function isMissingContractMethod(error: any): boolean {
  return isExecutionRevert(error) || Boolean(error?.walk?.((cause: any) => /ContractFunctionZeroData|AbiDecodingZeroData/.test(cause.name)));
}
