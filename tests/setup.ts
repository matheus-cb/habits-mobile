/**
 * Preparação da suíte do mobile.
 *
 * Dois módulos nativos precisam de dublê porque não existem fora do dispositivo:
 * `expo-secure-store` (Keychain/Keystore) e `expo-router` (navegação). O dublê do
 * secure-store é um Map em memória, e não um `jest.fn()` vazio, de propósito:
 * INV-23 é sobre onde o token vive, e um mock sem memória não distinguiria
 * "gravou" de "não gravou".
 */
// O prefixo `mock` é exigência do Jest: a fábrica de `jest.mock` é elevada para
// o topo do módulo e só pode referenciar variáveis com esse prefixo.
const mockCofre = new Map<string, string>();

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (chave: string) => mockCofre.get(chave) ?? null),
  setItemAsync: jest.fn(async (chave: string, valor: string) => {
    mockCofre.set(chave, valor);
  }),
  deleteItemAsync: jest.fn(async (chave: string) => {
    mockCofre.delete(chave);
  }),
}));

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn(), back: jest.fn() },
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
  Redirect: () => null,
}));

/** Limpa o cofre entre testes: token deixado por um autenticaria o próximo. */
export function limparCofre(): void {
  mockCofre.clear();
}

/** Lê o cofre direto, para provar onde o token está — não só que a API foi chamada. */
export function conteudoDoCofre(): Record<string, string> {
  return Object.fromEntries(mockCofre);
}

beforeEach(() => {
  mockCofre.clear();
});
