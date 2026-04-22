export function getErrorMessage(error: unknown, fallback: string): string {
  const anyErr = error as any;

  const backendMessage = anyErr?.response?.data?.error;
  if (typeof backendMessage === 'string' && backendMessage.trim()) {
    return backendMessage.trim();
  }

  const message = anyErr?.message;
  if (
    typeof message === 'string' &&
    message.trim() &&
    !/^request failed with status code \d+$/i.test(message.trim())
  ) {
    return message.trim();
  }

  return fallback;
}

export function getHttpStatus(error: unknown): number | null {
  const status = (error as any)?.response?.status;
  return typeof status === 'number' ? status : null;
}

export function isAuthorizationError(error: unknown): boolean {
  const status = getHttpStatus(error);
  return status === 401 || status === 403;
}

export function isNotFoundError(error: unknown): boolean {
  return getHttpStatus(error) === 404;
}
