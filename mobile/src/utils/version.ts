const normalizeVersion = (value: unknown): string[] => {
  if (typeof value !== 'string') return [];

  const trimmed = value.trim();
  if (!trimmed) return [];

  return trimmed.split('.');
};

const parseSegment = (segment: string): number => {
  const digitsOnly = segment.replace(/[^0-9]/g, '');
  if (!digitsOnly) return 0;

  const parsed = Number.parseInt(digitsOnly, 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const compareVersions = (currentVersion: string, targetVersion: string): number => {
  const current = normalizeVersion(currentVersion);
  const target = normalizeVersion(targetVersion);

  const maxLen = Math.max(current.length, target.length);

  for (let i = 0; i < maxLen; i += 1) {
    const currentPart = parseSegment(current[i] ?? '0');
    const targetPart = parseSegment(target[i] ?? '0');

    if (currentPart > targetPart) return 1;
    if (currentPart < targetPart) return -1;
  }

  return 0;
};
