# AGENTS.md

## Objetivo

`habits-mobile` é o app do ecossistema Habits (React Native + Expo Router). Ele
não tem regra de negócio própria: quem calcula aderência, sequência e duplicata é
a `habits-api`. O que este repositório precisa acertar é **o contrato com ela** e
**onde o token vive**.

Regra nova, invariante ou comando entra **neste arquivo**, que todo agente lê. O
`CLAUDE.md` apenas o importa e guarda o que é mecânica exclusiva do Claude Code;
`scripts/check-agent-docs.sh` verifica isso, como qualquer outra regra daqui.

Não mova regra para `.claude/rules/` nem para `AGENTS.md` de subpasta: o primeiro
o Codex não lê, o segundo o Claude Code não lê.

A numeração `INV-nn` é **compartilhada pelos três repositórios** do ecossistema
(`habits-api`, `habits-dashboard`, `habits-mobile`). INV-21 significa a mesma
coisa nos três. As invariantes de domínio (INV-01 a INV-19) vivem na API; abaixo
estão as que vivem aqui.

## Invariantes

Regras numeradas e testáveis. Use o número no nome do teste e na mensagem de
commit — assim cada regra tem um teste apontável, em vez de "temos testes".

### Próprias — verificadas aqui

Cada uma tem teste em `tests/` que cita o número no nome, e o gate exige isso.

| # | Regra | Onde vive |
|---|---|---|
| **INV-20** | O token vive em **exatamente um** lugar: gravar substitui, sair apaga | `src/lib/api/auth.ts` |
| **INV-21** | **401** derruba a sessão; **403** e **409** não | `src/lib/api/client.ts` + `src/lib/api/session.ts` |
| **INV-22** | **409** no check-in é duplicata: marca como feito, não mostra erro | `src/store/habits.store.ts` → `checkin` |
| **INV-23** | O token mora no **expo-secure-store**, nunca em AsyncStorage | `src/lib/api/auth.ts` |
| **INV-24** | NativeWind 4 exige Tailwind **3**, **instalado** e não só declarado | `package.json`, `node_modules`, `tailwind.config.js`, `babel.config.js` |

### Herdadas com faceta local — também verificadas aqui

Regra da API que tem um lado deste cliente, e esse lado **tem teste aqui**. O gate
as exige como as próprias — foi por elas terem ficado de fora que apagar o teste
`INV-11` não era notado por ninguém.

| # | Regra da API | O que se verifica aqui |
|---|---|---|
| **INV-11** | Senha nunca sai do service para a resposta | a senha não vai para o cofre |

### Herdadas da API — contexto, não cobertura

Citadas porque o comportamento daqui depende delas. Os testes estão em
`habits-api`, e o gate deste repositório as exclui de propósito: exigir teste
delas aqui seria duplicar cobertura e mentir sobre onde a garantia mora.

| # | Regra da API | Por que importa aqui |
|---|---|---|
| **INV-01** | Um check-in por hábito por dia, garantido pelo banco | é a origem do **409** que INV-22 trata |
| **INV-19** | A proposta de reagendamento é sugestão, não autorização | quando houver tela de insights, é o que ela precisa respeitar |

Quatro pontos que sustentam essas regras e não são óbvios no código:

**INV-21 não usa mais `await import`.** O tratamento de 401 importava a store
dinamicamente para quebrar o ciclo. Funcionava no bundle do Metro, mas **lança**
em runtime sem módulos ES dinâmicos — e o `catch` genérico do `apiClient` engolia
a falha: o 401 virava "Erro de conexão" e a sessão **não caía**. Defeito
silencioso, dependente de ambiente, no caminho de segurança. Agora há um registro
(`session.ts`), igual ao do dashboard: sem import dinâmico, sem ciclo, e uma
regra só para os dois clientes.

**O aviso de 401 é aguardado.** Apagar o token do SecureStore é assíncrono. Sem
`await`, o erro subia para a tela enquanto o token ainda estava no cofre.

**INV-22 fabrica um registro local.** Ao receber 409 sem check-in de hoje no
cache, a store cria um com id `local-<timestamp>` e marca o dia como feito. Sem
isso o botão continuaria pedindo check-in de algo que o servidor já tem. A
checagem `alreadyHas` evita duplicar em toques repetidos.

**INV-24 falha em silêncio.** `npm i tailwindcss@latest` instala a 4, o app
compila sem erro, e os estilos simplesmente não aplicam no dispositivo. O teste
de `tests/toolchain.test.ts` é a única coisa que grita.

## Ferramentas exigidas

| Ferramenta | Versão | Por quê |
|---|---|---|
| Node | ≥ 20 | Expo SDK 54 |
| `jest-expo` | `~54.0` | o `latest` exige React 19.2.3; o SDK 54 fixa 19.1.0 |
| Tailwind | major **3** | INV-24 |

## Comandos de validação

Uma camada só: nada aqui depende de serviço externo. Os testes dublam `fetch`,
`expo-secure-store` e `expo-router` — a API não precisa estar de pé.

```bash
cp .env.example .env    # EXPO_PUBLIC_API_URL; Android precisa do IP da máquina
npm ci                  # ou `npm ci --dry-run` para só validar peers
npx tsc --noEmit
npm run lint
npm test                # Jest + jest-expo
```

Os testes não precisam do `.env` — dublam `fetch`. O `cp` é para **rodar** o app;
detalhes de rede e emulador em `docs/DESENVOLVIMENTO.md`.

`npm run verify` roda os quatro em ordem. **Não existe build verificável em CI:**
gerar binário exige EAS ou toolchain nativa, e nenhum dos dois cabe no gate.
`tsc --noEmit` é o que mais se aproxima.

## Dívida declarada

Registrada aqui para não ser confundida com descuido:

- **6 avisos de `react-hooks/exhaustive-deps`** em telas e hooks. Incluir as
  dependências que faltam causa laço de renderização. O lint **não** roda com
  `--max-warnings=0` por causa disso — e é a única razão.
- **Três `eslint-disable` de `react-hooks/set-state-in-effect`**, cada um com o
  motivo no próprio arquivo. O de `stats.tsx` contorna o `MISSING_CONTEXT_ERROR`
  que travava a aba: remover o gate reintroduz o crash.
- **Sem teste de componente nem de tela.** A suíte cobre stores, cliente HTTP e
  toolchain, que é o caminho crítico de autenticação e check-in.
- **A camada de insights da API não é consumida aqui.** O resumo de aderência e
  as propostas de reagendamento existem na API e ainda não têm tela.
- **Gamificação é local.** `src/constants/achievements.ts` calcula conquistas no
  cliente; a API não tem esse conceito.

## Definição de pronto

- Cada invariante tocada tem teste que cita o número no nome.
- Toda invariante tem também um teste **adversário**: um que tenta violá-la e
  exige que seja barrada. Teste de caminho feliz não prova fronteira.
- **Verificação nova tem caso vizinho.** Depois de escrever um gate, uma trava ou
  um guarda, construa o caso que ele **deveria** pegar e veja-o pegar — não o caso
  que motivou escrevê-lo, que já passa por construção. "Toda invariante tem teste
  adversário" vale para os gates também, e é onde ninguém pensa em aplicar: gate
  não é código de produção. Nove defeitos desta safra eram verificações que
  funcionavam no caso de origem e olhavam para a metade errada.
- `tsc --noEmit`, `lint` (zero **erros**) e `test` passam.

## Risco e revisão

- **Baixo:** texto, estilo, componente visual.
- **Médio:** telas, navegação, hooks.
- **Alto:** `src/lib/api/` e `src/store/auth.store.ts` — é onde vivem as
  invariantes de sessão. Revisão humana.
