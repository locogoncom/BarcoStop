export function getErrorMessage(error: unknown, fallback: string): string {
  const anyErr = error as any;

  const backendMessage = anyErr?.response?.data?.error;
  if (typeof backendMessage === 'string' && backendMessage.trim()) {
    return backendMessage.trim();
  }

  const message = anyErr?.message;
  if (typeof message === 'string' && message.trim()) {
    return message.trim();
  }

  return fallback;
}
