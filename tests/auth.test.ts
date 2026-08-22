import * as SecureStore from 'expo-secure-store';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/store/auth.store';
import { ApiError, apiClient } from '@/lib/api/client';
import { conteudoDoCofre } from './setup';

/** Resposta de `fetch` com corpo JSON. */
function resposta(status: number, body: unknown = {}) {
  return { status, ok: status >= 200 && status < 300, json: async () => body } as Response;
}

function stubFetch(...respostas: Response[]) {
  const fetchMock = jest.fn();
  for (const r of respostas) fetchMock.mockResolvedValueOnce(r);
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

const USUARIO = { id: 'u1', name: 'Matheus', email: 'a@b.c', createdAt: '2026-01-01' };

beforeEach(() => {
  useAuthStore.setState({ user: null, isAuthenticated: false, loading: true, error: null });
});

describe('INV-23 — o token do mobile mora no SecureStore', () => {
  it('INV-23: gravar o token chama o SecureStore e nada mais', async () => {
    await authApi.saveToken('tok-123');

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('token', 'tok-123');
    expect(conteudoDoCofre()).toEqual({ token: 'tok-123' });
  });

  it('INV-23: adversário — o token não vaza para nenhum global do processo', async () => {
    // O nome anterior prometia "nem para AsyncStorage", e nenhuma asserção aqui
    // olhava para AsyncStorage. A cobertura existe, em `toolchain.test.ts`, e por
    // um caminho melhor: a ausência da própria dependência. Um nome que promete
    // mais do que a asserção prova convida a próxima pessoa a confiar nele.
    await authApi.saveToken('tok-123');

    const globais = JSON.stringify(
      Object.fromEntries(
        Object.entries(global as unknown as Record<string, unknown>).filter(
          ([, valor]) => typeof valor === 'string'
        )
      )
    );
    expect(globais).not.toContain('tok-123');
    expect((global as unknown as { localStorage?: unknown }).localStorage).toBeUndefined();
  });

  it('INV-20/INV-23: o token vive em exatamente um lugar, e sair o apaga', async () => {
    await authApi.saveToken('tok-123');
    expect(await authApi.getToken()).toBe('tok-123');

    await authApi.removeToken();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('token');
    expect(conteudoDoCofre()).toEqual({});
    expect(await authApi.getToken()).toBeNull();
  });

  it('INV-20: gravar de novo substitui, não acumula', async () => {
    await authApi.saveToken('primeiro');
    await authApi.saveToken('segundo');

    expect(conteudoDoCofre()).toEqual({ token: 'segundo' });
  });
});

describe('INV-21 — 401 derruba a sessão', () => {
  it('INV-21: uma resposta 401 zera o usuário e apaga o token', async () => {
    await authApi.saveToken('tok');
    useAuthStore.setState({ user: USUARIO, isAuthenticated: true, loading: false });
    stubFetch(resposta(401, { error: 'Invalid token' }));

    await expect(apiClient('/habits')).rejects.toBeInstanceOf(ApiError);

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(conteudoDoCofre()).toEqual({});
  });

  it('INV-21: adversário — o logout acontece mesmo que quem chamou engula o erro', async () => {
    // Várias telas engolem o erro para mostrar mensagem. Se o logout viesse depois
    // do throw, a pessoa continuaria numa tela autenticada com credencial que o
    // servidor já recusou, vendo erro em toda ação.
    await authApi.saveToken('tok');
    useAuthStore.setState({ user: USUARIO, isAuthenticated: true, loading: false });
    stubFetch(resposta(401, {}));

    try {
      await apiClient('/habits');
    } catch {
      // engolido de propósito
    }

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('INV-21: adversário — 403 NÃO derruba a sessão', async () => {
    // 403 é "sem acesso a este recurso", não "credencial inválida". Derrubar a
    // sessão expulsaria a pessoa por tocar num hábito que não é dela.
    await authApi.saveToken('tok');
    useAuthStore.setState({ user: USUARIO, isAuthenticated: true, loading: false });
    stubFetch(resposta(403, { error: 'Forbidden' }));

    await expect(apiClient('/habits/x')).rejects.toMatchObject({ status: 403 });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(conteudoDoCofre()).toEqual({ token: 'tok' });
  });

  it('INV-21: adversário — 409 e 500 não derrubam a sessão', async () => {
    await authApi.saveToken('tok');
    useAuthStore.setState({ user: USUARIO, isAuthenticated: true, loading: false });
    stubFetch(resposta(409, {}), resposta(500, {}));

    await expect(apiClient('/x')).rejects.toMatchObject({ status: 409 });
    await expect(apiClient('/y')).rejects.toMatchObject({ status: 500 });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });
});

describe('carga inicial da sessão', () => {
  it('sem token, loadUser termina anônimo e não chama a API', async () => {
    const fetchMock = stubFetch();

    await useAuthStore.getState().loadUser();

    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      isAuthenticated: false,
      loading: false,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('com token válido, loadUser autentica a partir do GET /auth/me', async () => {
    await authApi.saveToken('tok');
    stubFetch(resposta(200, { data: USUARIO }));

    await useAuthStore.getState().loadUser();

    expect(useAuthStore.getState()).toMatchObject({
      user: USUARIO,
      isAuthenticated: true,
      loading: false,
    });
  });

  it('INV-21: adversário — token expirado na carga inicial deixa anônimo e apaga o token', async () => {
    // O caminho mais comum: a pessoa abre o app depois de sete dias e o JWT
    // expirou. Não pode ficar preso em tela de carregamento nem em estado
    // "autenticado" com token morto.
    await authApi.saveToken('expirado');
    stubFetch(resposta(401, { error: 'Token expired' }));

    await useAuthStore.getState().loadUser();

    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      isAuthenticated: false,
      loading: false,
    });
    expect(conteudoDoCofre()).toEqual({});
  });

  it('INV-11: adversário — a senha do login não é guardada em lugar nenhum', async () => {
    stubFetch(resposta(200, { data: { accessToken: 'tok', user: USUARIO } }));

    await useAuthStore.getState().login({ email: 'a@b.c', password: 'senha-secreta' });

    expect(JSON.stringify(conteudoDoCofre())).not.toContain('senha-secreta');
    expect(JSON.stringify(useAuthStore.getState())).not.toContain('senha-secreta');
  });

  it('erro de rede na carga inicial não deixa o app preso em loading', async () => {
    await authApi.saveToken('tok');
    global.fetch = jest.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;

    await useAuthStore.getState().loadUser();

    expect(useAuthStore.getState().loading).toBe(false);
  });
});
