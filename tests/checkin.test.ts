import { format } from 'date-fns';
import { useHabitsStore } from '@/store/habits.store';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api/auth';

const HABIT_ID = 'h1';
const HOJE = format(new Date(), 'yyyy-MM-dd');

const HABITO = {
  id: HABIT_ID,
  title: 'Correr',
  userId: 'u1',
  scheduledDays: [1, 3, 5],
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

/**
 * Dublê de `fetch` roteado por URL e método.
 *
 * Fila de `mockResolvedValueOnce` quebraria assim que a ordem mudasse — e o
 * `checkin` recarrega dados, então a ordem muda.
 */
function stubApi(
  rotas: { match: (url: string, init?: RequestInit) => boolean; status: number; body?: unknown }[]
) {
  const fetchMock = jest.fn(async (url: string, init?: RequestInit) => {
    const rota = rotas.find((r) => r.match(String(url), init));
    if (!rota) throw new Error(`rota não prevista no teste: ${init?.method ?? 'GET'} ${url}`);
    return {
      status: rota.status,
      ok: rota.status >= 200 && rota.status < 300,
      json: async () => rota.body ?? {},
    };
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

const rotaCheckins = {
  match: (url: string, init?: RequestInit) =>
    url.includes('/checkins') && (init?.method ?? 'GET') === 'GET',
  status: 200,
  body: { data: [] },
};

beforeEach(() => {
  useHabitsStore.getState().reset();
  useAuthStore.setState({ user: null, isAuthenticated: true, loading: false, error: null });
});

describe('INV-22 — 409 no check-in é duplicata, não erro para o usuário', () => {
  it('INV-22: check-in bem-sucedido marca o hábito como feito hoje', async () => {
    stubApi([
      rotaCheckins,
      {
        match: (url, init) => url.includes('/checkin') && init?.method === 'POST',
        status: 201,
        body: { data: { id: 'c1', habitId: HABIT_ID, date: HOJE, createdAt: HOJE } },
      },
    ]);
    useHabitsStore.setState({ habits: [HABITO], checkinsByHabit: { [HABIT_ID]: [] } });

    await useHabitsStore.getState().checkin(HABIT_ID);

    expect(useHabitsStore.getState().isCheckedInToday(HABIT_ID)).toBe(true);
    expect(useHabitsStore.getState().error).toBeNull();
  });

  it('INV-22: adversário — 409 não deixa erro no estado e não lança', async () => {
    // O cenário real é um duplo toque no botão. O primeiro cria, o segundo recebe
    // 409. Mostrar erro nisso é punir a pessoa por uma ação que deu certo.
    stubApi([
      rotaCheckins,
      {
        match: (url, init) => url.includes('/checkin') && init?.method === 'POST',
        status: 409,
        body: { error: 'Check-in already exists for this date' },
      },
    ]);
    useHabitsStore.setState({ habits: [HABITO], checkinsByHabit: { [HABIT_ID]: [] } });

    await expect(useHabitsStore.getState().checkin(HABIT_ID)).resolves.toBeUndefined();

    expect(useHabitsStore.getState().error).toBeNull();
  });

  it('INV-22: adversário — 409 marca o hábito como feito, mesmo sem o registro local', async () => {
    // Se o 409 só silenciasse o erro sem marcar, o botão continuaria pedindo
    // check-in de algo que o servidor já tem — e a pessoa tocaria de novo, para
    // sempre.
    stubApi([
      rotaCheckins,
      {
        match: (url, init) => url.includes('/checkin') && init?.method === 'POST',
        status: 409,
        body: { error: 'Check-in already exists for this date' },
      },
    ]);
    useHabitsStore.setState({ habits: [HABITO], checkinsByHabit: { [HABIT_ID]: [] } });

    await useHabitsStore.getState().checkin(HABIT_ID);

    expect(useHabitsStore.getState().isCheckedInToday(HABIT_ID)).toBe(true);
  });

  it('INV-22: adversário — 409 repetido não duplica o registro local', async () => {
    // O 409 fabrica um registro local quando não há nenhum. Sem a checagem
    // `alreadyHas`, cada toque adicionaria mais um e a contagem local divergiria
    // do servidor.
    stubApi([
      rotaCheckins,
      {
        match: (url, init) => url.includes('/checkin') && init?.method === 'POST',
        status: 409,
        body: { error: 'Conflict' },
      },
    ]);
    useHabitsStore.setState({ habits: [HABITO], checkinsByHabit: { [HABIT_ID]: [] } });

    await useHabitsStore.getState().checkin(HABIT_ID);
    await useHabitsStore.getState().checkin(HABIT_ID);
    await useHabitsStore.getState().checkin(HABIT_ID);

    const deHoje = (useHabitsStore.getState().checkinsByHabit[HABIT_ID] ?? []).filter((c) =>
      c.date.startsWith(HOJE)
    );
    expect(deHoje).toHaveLength(1);
  });

  it('INV-22: adversário — 500 no check-in continua sendo erro e lança', async () => {
    // Tratar qualquer falha em silêncio esconderia indisponibilidade da API atrás
    // de "check-in feito", e a pessoa acreditaria ter registrado algo que não foi.
    stubApi([
      rotaCheckins,
      {
        match: (url, init) => url.includes('/checkin') && init?.method === 'POST',
        status: 500,
        body: { error: 'boom' },
      },
    ]);
    useHabitsStore.setState({ habits: [HABITO], checkinsByHabit: { [HABIT_ID]: [] } });

    await expect(useHabitsStore.getState().checkin(HABIT_ID)).rejects.toMatchObject({
      status: 500,
    });
    expect(useHabitsStore.getState().error).toBe('boom');
    expect(useHabitsStore.getState().isCheckedInToday(HABIT_ID)).toBe(false);
  });

  it('INV-22: adversário — 403 no check-in continua sendo erro', async () => {
    stubApi([
      rotaCheckins,
      {
        match: (url, init) => url.includes('/checkin') && init?.method === 'POST',
        status: 403,
        body: { error: 'You do not have access to this habit' },
      },
    ]);
    useHabitsStore.setState({ habits: [HABITO], checkinsByHabit: { [HABIT_ID]: [] } });

    await expect(useHabitsStore.getState().checkin(HABIT_ID)).rejects.toMatchObject({
      status: 403,
    });
    expect(useHabitsStore.getState().isCheckedInToday(HABIT_ID)).toBe(false);
  });

  it('INV-21: adversário — 401 no check-in derruba a sessão em vez de virar erro de check-in', async () => {
    await authApi.saveToken('tok');
    stubApi([
      rotaCheckins,
      {
        match: (url, init) => url.includes('/checkin') && init?.method === 'POST',
        status: 401,
        body: { error: 'Invalid token' },
      },
    ]);
    useHabitsStore.setState({ habits: [HABITO], checkinsByHabit: { [HABIT_ID]: [] } });

    await expect(useHabitsStore.getState().checkin(HABIT_ID)).rejects.toMatchObject({
      status: 401,
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});

describe('isCheckedInToday — a base do botão de check-in', () => {
  it('hábito sem cache de check-in devolve false, sem lançar', async () => {
    // Foi o crash do MISSING_CONTEXT_ERROR: um hábito recém-criado sem entrada no
    // cache fazia `checkins.some` estourar em `undefined`.
    useHabitsStore.setState({ habits: [HABITO], checkinsByHabit: {} });

    expect(() => useHabitsStore.getState().isCheckedInToday(HABIT_ID)).not.toThrow();
    expect(useHabitsStore.getState().isCheckedInToday(HABIT_ID)).toBe(false);
  });

  it('check-in de ontem não conta como feito hoje', () => {
    const ontem = format(new Date(Date.now() - 86_400_000), 'yyyy-MM-dd');
    useHabitsStore.setState({
      habits: [HABITO],
      checkinsByHabit: {
        [HABIT_ID]: [{ id: 'c1', habitId: HABIT_ID, date: ontem, createdAt: ontem }],
      },
    });

    expect(useHabitsStore.getState().isCheckedInToday(HABIT_ID)).toBe(false);
  });

  it('hábito criado agora já entra com cache vazio, não ausente', async () => {
    stubApi([
      {
        match: (url, init) => url.endsWith('/habits') && init?.method === 'POST',
        status: 201,
        body: { data: HABITO },
      },
    ]);

    await useHabitsStore.getState().createHabit({ title: 'Correr' });

    expect(useHabitsStore.getState().checkinsByHabit[HABIT_ID]).toEqual([]);
    expect(useHabitsStore.getState().isCheckedInToday(HABIT_ID)).toBe(false);
  });
});
