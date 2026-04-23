describe('mobile assets utils', () => {
  const originalEnv = process.env;

  const loadAssets = () => {
    jest.resetModules();
    return require('../../mobile/src/utils/assets') as {
      normalizeRemoteAssetUrl: (value: unknown) => string | undefined;
      toServerUploadPath: (value: unknown) => string | undefined;
    };
  };

  beforeEach(() => {
    process.env = {...originalEnv};
    delete process.env.BARCOSTOP_API_URL;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('normaliza rutas relativas de uploads a URL absoluta de la API', () => {
    process.env.BARCOSTOP_API_URL = 'https://api.barcostop.net/api/v1';

    const {normalizeRemoteAssetUrl} = loadAssets();

    expect(normalizeRemoteAssetUrl('/uploads/avatars/a.png')).toBe('https://api.barcostop.net/uploads/avatars/a.png');
    expect(normalizeRemoteAssetUrl('uploads/trips/b.webp')).toBe('https://api.barcostop.net/uploads/trips/b.webp');
  });

  it('convierte URL legacy /api/v1/uploads en ruta limpia /uploads', () => {
    const {toServerUploadPath} = loadAssets();

    expect(toServerUploadPath('https://api.barcostop.net/api/v1/uploads/trips/boat.jpg')).toBe('/uploads/trips/boat.jpg');
    expect(toServerUploadPath('https://api.barcostop.net/v1/uploads/trips/boat.jpg')).toBe('/uploads/trips/boat.jpg');
  });

  it('ignora URLs no pertenecientes a uploads', () => {
    const {toServerUploadPath} = loadAssets();

    expect(toServerUploadPath('https://example.com/image.png')).toBeUndefined();
    expect(toServerUploadPath('')).toBeUndefined();
  });
});
