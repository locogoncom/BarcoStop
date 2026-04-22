import {API_ORIGIN} from '../config/apiConfig';

export const normalizeRemoteAssetUrl = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (/^(content:\/\/|file:\/\/|ph:\/\/|assets-library:\/\/)/i.test(trimmed)) {
    return trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      const normalizedPath = parsed.pathname.replace(/^\/api(?=\/uploads\/)/i, '');

      if (/^\/uploads\//i.test(normalizedPath)) {
        return `${API_ORIGIN}${normalizedPath}`;
      }

      return trimmed;
    } catch {
      return trimmed;
    }
  }

  if (trimmed.startsWith('/')) {
    return `${API_ORIGIN}${trimmed}`;
  }

  if (/^uploads\//i.test(trimmed)) {
    return `${API_ORIGIN}/${trimmed}`;
  }

  return trimmed;
};

export const toServerUploadPath = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (trimmed.startsWith('/uploads/')) return trimmed;
  if (/^uploads\//i.test(trimmed)) return `/${trimmed}`;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      const normalizedPath = parsed.pathname.replace(/^\/api(?=\/uploads\/)/i, '');
      if (normalizedPath.startsWith('/uploads/')) {
        return normalizedPath;
      }
    } catch {
      return undefined;
    }
  }

  return undefined;
};