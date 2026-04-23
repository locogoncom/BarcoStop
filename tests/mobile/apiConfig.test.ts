describe('mobile apiConfig', () => {
  const originalEnv = process.env;

  const loadConfig = () => {
    jest.resetModules();
    return require('../../mobile/src/config/apiConfig') as {
      API_BASE_URL: string;
      API_ORIGIN: string;
      WS_URL: string;
    };
  };

  beforeEach(() => {
    process.env = {...originalEnv};
    delete process.env.BARCOSTOP_API_URL;
    delete process.env.API_BASE_URL;
    delete process.env.BARCOSTOP_WS_URL;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('usa la base por defecto de produccion', () => {
    const {API_BASE_URL, API_ORIGIN, WS_URL} = loadConfig();

    expect(API_BASE_URL).toBe('https://api.barcostop.net/api/v1');
    expect(API_ORIGIN).toBe('https://api.barcostop.net');
    expect(WS_URL).toBe('https://api.barcostop.net');
  });

  it('normaliza BARCOSTOP_API_URL al formato /v1', () => {
    process.env.BARCOSTOP_API_URL = 'https://example.test/api';

    const {API_BASE_URL, API_ORIGIN} = loadConfig();

    expect(API_BASE_URL).toBe('https://example.test/api/v1');
    expect(API_ORIGIN).toBe('https://example.test');
  });

  it('permite override de WS_URL y elimina slash final', () => {
    process.env.BARCOSTOP_API_URL = 'https://example.test/api/v1';
    process.env.BARCOSTOP_WS_URL = 'https://socket.example.test/';

    const {WS_URL} = loadConfig();

    expect(WS_URL).toBe('https://socket.example.test');
  });
});
