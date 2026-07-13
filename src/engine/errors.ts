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
