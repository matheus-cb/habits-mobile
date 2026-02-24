# Plano de Migração: habits-dashboard → habits-app

**Data:** 2026-02-24
**Versão:** 1.0
**Autores:** Arquitetura de Software
**Status:** Em elaboração

---

## Sumário Executivo

Este documento descreve o plano técnico para replicar todas as funcionalidades do
**habits-dashboard** (aplicação web React) no **habits-app** (aplicativo móvel Expo/React Native),
utilizando o **habits-api** (Node.js/Express) como camada de integração central.

A análise identificou **4 grupos funcionais** no dashboard — autenticação, gerenciamento de hábitos,
calendário/check-ins e analytics — dos quais **2 estão completamente implementados** no app,
**1 está parcialmente implementado** e **1 está ausente**. Além disso, foi detectada **1 rota
crítica na API que está implementada no controller mas não exposta via router**.

### Decisões Arquiteturais de Alto Nível

- A API permanece como fonte de verdade; o app **não deve replicar cálculos de negócio** (streaks, completionRate)
- Preferir **offline-optimistic updates** para check-ins (fluxo crítico de UX)
- Notificações **por hábito** devem migrar da abordagem web (Notification API + localStorage) para
  notificações locais agendadas via `expo-notifications`
- Preferências e configurações persistidas em `expo-secure-store` (substituindo localStorage)

---

## 1. Análise de Funcionalidades

### 1.1 Inventário Completo — Dashboard vs App

| # | Funcionalidade | Dashboard | App Móvel | Prioridade |
|---|---------------|:---------:|:---------:|:----------:|
| 1 | Registro de usuário | ✅ | ✅ | MVP |
| 2 | Login e-mail/senha | ✅ | ✅ | MVP |
| 3 | Login social (Google/GitHub/Apple) | 🔜 roadmap | ❌ ausente | P2 |
| 4 | Persistência de sessão (Remember Me) | ✅ | ✅ | MVP |
| 5 | Perfil do usuário (`/auth/me`) | ✅ | ✅ | MVP |
| 6 | Logout | ✅ | ✅ | MVP |
| 7 | Criação de hábito | ✅ | ✅ | MVP |
| 8 | Listagem de hábitos | ✅ | ✅ | MVP |
| 9 | Edição de hábito | ✅ | ✅ | MVP |
| 10 | Exclusão de hábito | ✅ | ✅ | MVP |
| 11 | Check-in do dia atual | ✅ | ✅ | MVP |
| 12 | Check-in em data específica | ✅ | ❌ ausente | P1 |
| 13 | **Desfazer check-in (undo)** | ✅ | ❌ ausente | P1 |
| 14 | Visão geral do dia (resumo) | ✅ | ✅ | MVP |
| 15 | Calendário mensal com check-ins | ✅ | ❌ ausente | P1 |
| 16 | Navegação entre meses | ✅ | ❌ ausente | P1 |
| 17 | Painel de detalhes do dia | ✅ | ❌ ausente | P1 |
| 18 | Visibilidade por hábito no calendário | ✅ | ❌ ausente | P2 |
| 19 | Lembrete por hábito (horário específico) | ✅ | ❌ ausente | P1 |
| 20 | Lembrete global (app-wide) | ❌ web N/A | ✅ | MVP |
| 21 | Estatísticas individuais (cards) | ✅ | ✅ | MVP |
| 22 | Gráfico 30 dias por hábito | ✅ | ✅ | MVP |
| 23 | Heatmap de atividade (12 semanas) | ✅ | ❌ ausente | P1 |
| 24 | Taxa de conclusão por hábito (barras) | ✅ | ❌ ausente | P1 |
| 25 | Comparativo de streaks (gráfico) | ✅ | ❌ ausente | P2 |
| 26 | Tabela comparativa com ordenação | ✅ | ❌ ausente | P2 |
| 27 | Cards de resumo analytics | ✅ | ❌ ausente | P1 |
| 28 | Gamificação (badges de conquistas) | ❌ ausente | ✅ | P1 |
| 29 | Pull-to-refresh | ❌ web N/A | ✅ | MVP |
| 30 | Armazenamento seguro de token | ❌ localStorage | ✅ SecureStore | MVP |

**Legenda:** ✅ Implementado | ❌ Ausente | 🔜 Planejado

### 1.2 Categorização por Tipo

```
AUTENTICAÇÃO (MVP)
  ├── Registro/Login/Logout ....................... ✅ App OK
  ├── Persistência de sessão ..................... ✅ App OK
  ├── Login social ................................ 🔜 P2 (roadmap ambos)
  └── Edição de perfil ........................... ❌ Ausente nos dois

CRUD DE HÁBITOS (MVP)
  ├── Criar / Listar / Editar / Excluir ......... ✅ App OK
  └── Filtro/busca de hábitos ................... ❌ Ausente nos dois

CHECK-INS (P1 — GAP CRÍTICO)
  ├── Check-in hoje .............................. ✅ App OK
  ├── Check-in em data específica ............... ❌ App AUSENTE
  ├── Desfazer check-in ......................... ❌ App AUSENTE + API sem rota
  └── Calendário mensal ......................... ❌ App AUSENTE

ANALYTICS (P1)
  ├── Cards de resumo ........................... ❌ App AUSENTE (tela stats incompleta)
  ├── Gráfico 30 dias ........................... ✅ App OK
  ├── Heatmap 12 semanas ........................ ❌ App AUSENTE
  ├── Taxa por hábito ........................... ❌ App AUSENTE
  ├── Tabela comparativa ........................ ❌ App AUSENTE (P2)
  └── Badges de conquistas ...................... ✅ App OK (exclusivo mobile)

CONFIGURAÇÕES (P1)
  ├── Lembrete global ........................... ✅ App OK
  └── Lembrete por hábito ....................... ❌ App AUSENTE
```

---

## 2. Mapeamento de API

### 2.1 Endpoints Existentes

| Método | Rota | Autenticação | Status |
|--------|------|:------------:|:------:|
| POST | `/api/v1/auth/register` | ❌ público | ✅ OK |
| POST | `/api/v1/auth/login` | ❌ público | ✅ OK |
| GET | `/api/v1/auth/me` | ✅ Bearer JWT | ✅ OK |
| GET | `/api/v1/habits` | ✅ Bearer JWT | ✅ OK |
| POST | `/api/v1/habits` | ✅ Bearer JWT | ✅ OK |
| GET | `/api/v1/habits/:id` | ✅ Bearer JWT | ✅ OK |
| PUT | `/api/v1/habits/:id` | ✅ Bearer JWT | ✅ OK |
| DELETE | `/api/v1/habits/:id` | ✅ Bearer JWT | ✅ OK |
| POST | `/api/v1/habits/:habitId/checkin` | ✅ Bearer JWT | ✅ OK |
| GET | `/api/v1/habits/:habitId/checkins` | ✅ Bearer JWT | ✅ OK |
| GET | `/api/v1/habits/:habitId/stats` | ✅ Bearer JWT | ✅ OK |
| GET | `/api/v1/health` | ❌ público | ✅ OK |

### 2.2 Endpoints Ausentes / a Criar

| Método | Rota | Prioridade | Justificativa |
|--------|------|:----------:|---------------|
| **DELETE** | `/api/v1/habits/:habitId/checkins/:checkinId` | **P1 CRÍTICO** | Controller implementado mas rota não exposta no router |
| PUT | `/api/v1/auth/profile` | P2 | Edição de nome/e-mail do usuário |
| GET | `/api/v1/habits/:habitId/checkins?startDate=&endDate=` | P2 | Filtro por período para analytics avançado |
| GET | `/api/v1/analytics/summary` | P2 | Agregação de todas as estatísticas em uma única chamada |

### 2.3 Contratos Detalhados — Endpoints a Criar/Corrigir

#### DELETE `/api/v1/habits/:habitId/checkins/:checkinId` — P1 CRÍTICO

```
Autenticação: Bearer JWT (obrigatório)

Parâmetros de rota:
  habitId   : string (UUID)
  checkinId : string (UUID)

Regras de negócio:
  - Valida que o habit pertence ao usuário autenticado
  - Valida que o checkin pertence ao habit informado
  - Retorna 403 se o habit não pertence ao usuário
  - Retorna 404 se checkin não encontrado

Resposta de sucesso:
  HTTP 204 No Content

Erros:
  400  habitId ou checkinId não são UUIDs válidos
  401  Token ausente ou inválido
  403  Habit não pertence ao usuário
  404  Habit ou Checkin não encontrado
```

**Ação necessária na API:** Adicionar a rota em `src/routes/checkins.routes.ts`:
```typescript
router.delete(
  '/habits/:habitId/checkins/:id',
  validateParams(habitAndCheckinParamSchema),
  checkinsController.delete
);
```

#### PUT `/api/v1/auth/profile` — P2

```
Autenticação: Bearer JWT (obrigatório)

Request Body:
  {
    "name"?: string  (2-100 chars)
    "email"?: string (formato válido, único no banco)
  }

Resposta de sucesso:
  HTTP 200 OK
  {
    "status": "success",
    "data": {
      "id": "uuid",
      "name": "string",
      "email": "string",
      "updatedAt": "ISO 8601"
    }
  }

Erros:
  400  Dados de validação inválidos
  401  Não autenticado
  409  E-mail já cadastrado por outro usuário
```

#### GET `/api/v1/habits/:habitId/checkins` com filtro de data — P2

```
Query params opcionais:
  startDate : string (YYYY-MM-DD)
  endDate   : string (YYYY-MM-DD)

Comportamento atual:
  Retorna todos os check-ins (sem filtro)

Comportamento esperado com parâmetros:
  Retorna check-ins no intervalo [startDate, endDate]
  Se omitidos, mantém comportamento atual (todos)
```

### 2.4 Análise de Autenticação e Autorização

```
Mecanismo: JWT (jsonwebtoken)
Expiração: 7 dias (configurável via JWT_EXPIRES_IN)
Payload  : { userId: string, email: string }
Header   : Authorization: Bearer <token>

Armazenamento no app móvel (atual):
  expo-secure-store → Keychain (iOS) / Keystore (Android)
  ✅ Correto - mais seguro que localStorage da web

Refresh token:
  ⚠️ NÃO implementado — o token expira em 7d e o usuário é
  deslogado automaticamente (interceptor 401 no apiClient)
  Recomendação P2: implementar refresh token ou silent re-auth

Ownership validation (multi-tenant):
  ✅ API valida userId em TODOS os endpoints de hábitos e check-ins
  Padrão: habitsRepository.findByIdAndUserId(id, userId)
```

---

## 3. Adaptações no App Móvel

### 3.1 Fluxo de Dados — Dashboard vs App

```
DASHBOARD (Web)                         APP MÓVEL (React Native)
──────────────────                      ────────────────────────
React Context (AuthContext)             Zustand (auth.store.ts)
Custom Hooks (useHabits, etc.)          Zustand (habits.store.ts)
localStorage → preferências             expo-secure-store → token
                                        AsyncStorage → preferências ← PENDENTE
Notification API browser                expo-notifications local
recharts → gráficos SVG                 react-native-gifted-charts
Tailwind CSS                            NativeWind v4
React Router DOM                        Expo Router (file-based)
```

### 3.2 Funcionalidades — Adaptações UX/UI Necessárias

#### 3.2.1 Calendário Mensal (P1)

O dashboard tem um `CalendarGrid` + `DayDetailPanel` completos. No mobile:

```
DESKTOP (Dashboard)                MOBILE (App) — A CRIAR
─────────────────────              ────────────────────────────────
Grid 7×5 em tela larga             ScrollView horizontal por semana
Clique no dia → painel lateral     Tap no dia → BottomSheet modal
Dots coloridos por hábito          Dots + indicador numérico
Navegação ← Mês → com botões       Swipe gesture entre meses
Reminder por hábito no painel      Reminder por hábito no BottomSheet
Visibilidade por hábito            Toggle chips filtráveis
```

**Componentes a criar:**
- `app/(app)/(tabs)/calendar.tsx` — nova aba de calendário
- `src/components/calendar/MonthCalendar.tsx` — grid mensal
- `src/components/calendar/DayBottomSheet.tsx` — painel do dia
- `src/components/calendar/HabitDot.tsx` — indicador visual
- `src/components/calendar/MonthNavigator.tsx` — controle de mês

#### 3.2.2 Desfazer Check-in (P1)

**Dashboard:** botão de toggle dentro do `DayDetailPanel`
**App atual:** o store trata 409 silenciosamente (sem undo)

Adaptação necessária:
```
HabitCard (tela Hoje):
  - Se isCheckedInToday(habitId) → mostrar botão com visual ✓
  - Long press ou swipe left → confirmar undo
  - Chamar DELETE /habits/:habitId/checkins/:checkinId
  - Optimistic update: remover do store antes da resposta

CheckinButton (componente):
  - Estado atual: ○ unchecked → ✓ checked (apenas para frente)
  - Adaptar para: ✓ checked → suporte ao tap para undo
```

#### 3.2.3 Tela de Analytics — Expansão (P1)

**Dashboard tem 6 seções; App tem 1 seletor de hábito + 4 cards + chart.**

```
PRIORIDADE P1 — adicionar à tela stats.tsx:
  ├── Cards de resumo global (total check-ins todos hábitos,
  │   melhor streak, hábito mais consistente)
  ├── Heatmap 12 semanas (adaptar ActivityHeatmap.tsx do web)
  └── Taxa de conclusão (barras horizontais por hábito)

PRIORIDADE P2 — adicionar à tela stats.tsx:
  ├── Comparativo de streaks (grouped bars)
  └── Tabela comparativa com ordenação por coluna
```

**Componentes a criar:**
- `src/components/stats/GlobalSummaryCards.tsx`
- `src/components/stats/ActivityHeatmap.tsx`
- `src/components/stats/HabitCompletionBars.tsx`
- `src/components/stats/StreakComparisonChart.tsx` (P2)

#### 3.2.4 Lembretes por Hábito (P1)

**Dashboard:** `DayDetailPanel` → time input → `localStorage`
**App:** Profile screen → lembrete único global → `expo-notifications`

Adaptação:
```
MODELO NOVO (por hábito):
  - Armazenar em AsyncStorage: { habitId → { time: "HH:MM", enabled: boolean } }
  - Agendar N notificações diárias (uma por hábito com lembrete ativo)
  - expo-notifications.scheduleNotificationAsync com trigger diário
  - Cancelar notificação anterior antes de reagendar
  - Limite: Expo permite até 64 notificações locais agendadas no iOS

UI: HabitListItem → swipe action ou menu contextual → configurar lembrete
    ou modal dedicado de configuração de hábito
```

#### 3.2.5 Sincronização Offline-First (P2)

```
ESTRATÉGIA RECOMENDADA (Optimistic Update):

1. Check-in:
   a. Atualizar store local imediatamente (UI responde)
   b. Chamar API em background
   c. Em caso de erro: reverter store + exibir toast

2. Fila de sincronização (se offline):
   a. Armazenar operação em AsyncStorage
   b. Listener de conectividade (NetInfo)
   c. Processar fila quando conexão restaurada

BIBLIOTECAS SUGERIDAS:
  @react-native-community/netinfo  → detecção de conectividade
  AsyncStorage (@react-native-async-storage/async-storage)
  → persistência local de preferências e fila
```

### 3.3 Otimizações de Performance

| Área | Problema | Solução |
|------|----------|---------|
| Analytics | Múltiplas chamadas paralelas (N habits × 2 endpoints) | Endpoint agregador `/analytics/summary` (P2) ou Promise.all com cache |
| Calendar | Checkins de todos os hábitos no mês = N requests | Cache em `habits.store.ts` indexado por `habitId+yearMonth` |
| Lista de hábitos | FlatList sem virtualização | Usar `FlatList` com `keyExtractor` e `getItemLayout` |
| Stats | Re-fetch a cada focus da tela | Cache com TTL de 5 min via `useFocusEffect` condicional |
| Imagens/Ícones | Carregamento de ícones Ionicons | Pré-carregar com `expo-font` (já feito) |

### 3.4 Tratamento de Erros — Adaptações para Mobile

```
WEB (Dashboard)                    MOBILE (App)
────────────────                   ──────────────────────────────
Alert popup (browser)              Alert nativo (React Native Alert)
Toast messages (inline)            Toast customizado (já existe parcialmente)
Redirect /login em 401             Interceptor 401 → logout + nav para /login (✅ feito)
Mensagens em PT-BR                 ✅ Já implementado

PENDENTE NO APP:
  - Retry automático em falhas de rede (exponential backoff)
  - Mensagem específica para sem conexão (NetInfo)
  - Estado de erro granular por operação (não apenas global)
  - Feedback visual de loading por item (ex: botão check-in com spinner)
```

---

## 4. Plano de Execução

### 4.1 Visão Geral das Fases

```
FASE 0 — CORREÇÃO CRÍTICA DA API        (pré-requisito de tudo)
  └── Expor DELETE /checkins/:id         ← 30min, blocker P1

FASE 1 — CHECK-INS AVANÇADOS (MVP+)     (sem calendário ainda)
  ├── Desfazer check-in no store + UI
  └── Check-in em data específica

FASE 2 — CALENDÁRIO MÓVEL              (nova aba)
  ├── Componentes de calendário
  ├── Integração com check-in por data
  └── Painel de dia (BottomSheet)

FASE 3 — ANALYTICS EXPANDIDO           (expansão da tela stats)
  ├── Cards de resumo global
  ├── Heatmap de atividade
  └── Barras de taxa por hábito

FASE 4 — LEMBRETES POR HÁBITO          (UX diferencial)
  ├── UI de configuração por hábito
  └── Agendamento via expo-notifications

FASE 5 — QUALIDADE & EXTRAS (P2)
  ├── Offline-first com fila
  ├── Perfil editável
  ├── Filtros de analytics
  └── Tabela comparativa
```

### 4.2 Fase 0 — Correção Crítica da API

**Duração estimada:** Muito curta
**Blocker:** Sim (P1 depende desta fase)

| Tarefa | Arquivo | Ação |
|--------|---------|------|
| Expor rota DELETE checkin | `src/routes/checkins.routes.ts` | Adicionar `router.delete(...)` |
| Adicionar schema de params | `src/schemas/checkins.schema.ts` | Schema com `habitId` + `id` (UUID) |
| Testes | `tests/checkins.test.ts` | Adicionar casos: 204 OK, 404, 403 |

**Código a adicionar em `checkins.routes.ts`:**
```typescript
const checkinParamSchema = z.object({
  habitId: z.string().uuid('Invalid habit ID'),
  id: z.string().uuid('Invalid checkin ID'),
});

router.delete(
  '/habits/:habitId/checkins/:id',
  validateParams(checkinParamSchema),
  checkinsController.delete
);
```

### 4.3 Fase 1 — Check-ins Avançados

**Dependência:** Fase 0 concluída

| Tarefa | Localização | Detalhes |
|--------|-------------|----------|
| Adicionar `deleteCheckin(habitId, checkinId)` ao store | `habits.store.ts` | Optimistic update + rollback |
| Adaptar `CheckinButton` para suportar undo | `CheckinButton.tsx` | Tap quando checked → confirmação → undo |
| Adicionar `checkinByDate(habitId, date)` ao store | `habits.store.ts` | Reutiliza endpoint existente com `date` param |
| Atualizar `habitsApi.deleteCheckin` | `src/lib/api/habits.ts` | Já existe na dashboard, copiar para mobile |

**Contrato da action no store:**
```typescript
deleteCheckin: async (habitId: string, checkinId: string) => {
  // 1. Snapshot para rollback
  const prev = get().checkinsByHabit[habitId];
  // 2. Optimistic remove
  set(state => ({
    checkinsByHabit: {
      ...state.checkinsByHabit,
      [habitId]: state.checkinsByHabit[habitId]?.filter(c => c.id !== checkinId) ?? []
    }
  }));
  // 3. API call
  try {
    await habitsApi.deleteCheckin(habitId, checkinId);
  } catch (err) {
    // 4. Rollback on failure
    set(state => ({ checkinsByHabit: { ...state.checkinsByHabit, [habitId]: prev } }));
    throw err;
  }
}
```

### 4.4 Fase 2 — Calendário Móvel

**Dependência:** Fase 1 concluída

| Tarefa | Arquivo a criar/modificar | Prioridade |
|--------|--------------------------|:----------:|
| Nova aba Calendário | `app/(app)/(tabs)/_layout.tsx` | P1 |
| Tela calendário | `app/(app)/(tabs)/calendar.tsx` | P1 |
| Componente grade mensal | `src/components/calendar/MonthCalendar.tsx` | P1 |
| Navegador de mês | `src/components/calendar/MonthNavigator.tsx` | P1 |
| Dot por hábito | `src/components/calendar/HabitDot.tsx` | P1 |
| Painel do dia (BottomSheet) | `src/components/calendar/DayBottomSheet.tsx` | P1 |
| Toggle de visibilidade de hábito | `src/components/calendar/HabitVisibilityFilter.tsx` | P2 |
| Persistência de preferências de visibilidade | `src/store/habits.store.ts` + AsyncStorage | P2 |

**Estrutura de dados do calendário:**
```typescript
// Cache no store: calendarCache[yearMonth][date] = checkin[]
// Exemplo: calendarCache["2026-02"]["2026-02-24"] = [checkin1, checkin2]

// Carregamento: ao navegar para um mês, buscar checkins de todos os hábitos
// para o período (startDate=início do mês, endDate=fim do mês)
// Requer implementação do filtro por data na API (Fase 5)
// Workaround enquanto API não tem filtro: filtrar client-side após GET /checkins
```

**Layout ASCII do calendário mobile:**
```
┌─────────────────────────────────┐
│  < Fevereiro 2026 >             │
│  Dom Seg Ter Qua Qui Sex Sáb    │
│   1   2   3   4   5   6   7    │
│   ●   ●       ●●  ●            │
│   8   9  10  11  12  13  14    │
│   ●●      ●   ●   ●           │
│  15  16  17  18  19  20  21    │
│       ●   ●●  ●                │
│ [24] 25  26  27  28            │  ← hoje com borda
│   ●●  ●                        │
└─────────────────────────────────┘
│ Seg, 24 de fevereiro            │  ← DayBottomSheet
│ ─────────────────────────────   │
│ 🔵 Ler       [✓ Feito] Desfazer │
│ 🟢 Exercício [✓ Feito] Desfazer │
│ 🔴 Meditação [Marcar]           │
│ ─────────────────────────────   │
│ 🔔 Lembrete: 07:30  [Alterar]   │
└─────────────────────────────────┘
```

### 4.5 Fase 3 — Analytics Expandido

**Dependência:** Fase 1 (para dados de check-ins no store)

| Componente | Arquivo | Dados necessários |
|------------|---------|-------------------|
| Cards de resumo global | `GlobalSummaryCards.tsx` | Todos habits + stats agregados |
| Heatmap 12 semanas | `ActivityHeatmap.tsx` | Todos checkins (últimos 84 dias) |
| Barras de conclusão | `HabitCompletionBars.tsx` | stats.completionRate por hábito |
| Comparativo streaks (P2) | `StreakComparisonChart.tsx` | stats.currentStreak + bestStreak |

**Lógica do heatmap (adaptação do web para mobile):**
```
Dashboard: SVG com CSS hover
Mobile: grid de Views com TouchableOpacity + Tooltip
Cores: 4 intensidades baseadas em contagem por dia
  0 check-ins → bg-zinc-800
  1 check-in  → bg-purple-900
  2 check-ins → bg-purple-600
  3+ check-ins→ bg-purple-400
```

**Otimização de carregamento — Promise.all:**
```typescript
// No hook useAnalytics do mobile (a criar):
const [allStats, allCheckins] = await Promise.all([
  Promise.all(habits.map(h => habitsApi.getStats(h.id))),
  Promise.all(habits.map(h => habitsApi.getCheckins(h.id))),
]);
```

### 4.6 Fase 4 — Lembretes por Hábito

**Dependência:** Fases 1-2 concluídas (UX de calendário define onde configurar)

| Tarefa | Detalhes |
|--------|----------|
| Migrar modelo de lembrete | De global para `Record<habitId, { time: string, enabled: boolean }>` |
| Persistência | AsyncStorage key: `habit_reminders` |
| Agendamento | `expo-notifications.scheduleNotificationAsync` por hábito |
| UI de configuração | Dentro do DayBottomSheet (Calendário) e/ou tela de edição do hábito |
| Cancelamento | Armazenar `notificationId` retornado e cancelar antes de reagendar |

**Limitações a considerar:**
- iOS: máximo 64 notificações locais agendadas — com muitos hábitos, priorizar os 64 mais relevantes
- Android: sem limite prático, mas bateria/doze mode pode atrasar
- Permissão: já solicitada no registro; verificar novamente antes de agendar

### 4.7 Fase 5 — Qualidade e Extras (P2)

| Item | Esforço | Detalhes |
|------|:-------:|----------|
| Offline-first com fila de sync | Alto | AsyncStorage + NetInfo listener |
| Filtro de data na API | Médio | Query params `startDate/endDate` em `/checkins` |
| Endpoint de analytics consolidado | Médio | `GET /analytics/summary` — todos stats em 1 req |
| Perfil editável | Médio | `PUT /auth/profile` na API + tela no app |
| Refresh token | Médio | Novo endpoint + lógica no interceptor |
| Login social | Alto | OAuth providers + integração na API |
| Tabela comparativa ordenável | Baixo | Adaptar lógica de sort do dashboard |
| Filtros de período no analytics | Baixo | Date picker + query params |

---

## 5. Dependências entre Tarefas

```
Fase 0 (API: expor DELETE checkin)
    │
    ▼
Fase 1 (Check-ins avançados no app) ──────────────┐
    │                                              │
    ▼                                              ▼
Fase 2 (Calendário móvel)            Fase 3 (Analytics expandido)
    │
    ▼
Fase 4 (Lembretes por hábito)
    │
    ▼
Fase 5 (Qualidade & Extras P2)
```

### Dependências de Dados

```
Para heatmap → precisa de todos os check-ins (GET /checkins por hábito × N)
Para calendário → precisa de check-ins filtrados por mês (client-side até API ter filtro)
Para undo → precisa de checkinId (garantido pelo GET /checkins que já retorna id)
Para lembretes por hábito → precisa de lista de hábitos (✅ já no store)
```

---

## 6. Testes Necessários

### 6.1 API (habits-api)

| Caso de teste | Descrição | Prioridade |
|--------------|-----------|:----------:|
| `DELETE /habits/:habitId/checkins/:id` 204 | Undo check-in bem-sucedido | P1 |
| `DELETE /habits/:habitId/checkins/:id` 404 | Check-in inexistente | P1 |
| `DELETE /habits/:habitId/checkins/:id` 403 | Check-in de outro usuário | P1 |
| `DELETE /habits/:habitId/checkins/:id` 401 | Sem autenticação | P1 |
| `GET /habits/:habitId/checkins?startDate=&endDate=` | Filtro por período | P2 |

### 6.2 App Móvel (habits-mobile)

| Área | Tipo de teste | Ferramenta sugerida |
|------|--------------|---------------------|
| Stores Zustand | Unit tests | Jest + @testing-library/react-native |
| Componente CheckinButton (undo) | Component test | Jest + RTL |
| Fluxo de calendário | Integration test | Jest + RTL |
| API client (mock) | Unit test | Jest + MSW (mock service worker) |
| Notificações | Mock test | jest-expo + mock expo-notifications |

---

## 7. Riscos e Recomendações

### 7.1 Riscos Identificados

| Risco | Probabilidade | Impacto | Mitigação |
|-------|:-------------:|:-------:|-----------|
| Limite de 64 notificações no iOS | Alta | Médio | Priorizar hábitos com maior frequência de uso |
| Performance do heatmap em React Native (84 Views) | Média | Alto | Usar `react-native-svg` em vez de Views nativas |
| N+1 requests no analytics (1 por hábito) | Alta | Médio | Promise.all + endpoint agregador na Fase 5 |
| BottomSheet de calendário UX ruim em telas pequenas | Média | Médio | Testar em iPhone SE (375px) antes de lançar |
| Token sem refresh (expira em 7d) | Alta | Baixo | Mostrar aviso proativo antes de expirar (Fase 5) |
| Dados de checkin inconsistentes (optimistic + rollback) | Baixa | Alto | Testar cenário de falha de rede explicitamente |

### 7.2 Recomendações

1. **Implementar Fase 0 imediatamente** — a rota de DELETE check-in está com controller funcional
   mas sem rota exposta. É um bug latente que afeta o undo do dashboard.

2. **Não replicar cálculos de streak no cliente** — o `StatsService` da API já faz isso corretamente.
   O app deve sempre buscar `GET /stats` ao invés de calcular localmente.

3. **Adotar `FlashList`** (de Shopify) em vez de `FlatList` para listas longas de hábitos —
   melhoria significativa de performance em React Native.

4. **Planejar o calendário mobile como aba de navegação inferior** — não como modal ou drawer.
   Isso mantém a navegação previsível e é o padrão de UX em apps de hábitos como Streaks e Habitica.

5. **Versionar a API antes de adicionar novos endpoints** — manter `/api/v1/` e garantir
   que novos endpoints não quebrem clientes existentes (dashboard web).

---

## Apêndice A — Comparativo Técnico de Stack

| Aspecto | Dashboard (Web) | App Móvel |
|---------|:---------------:|:---------:|
| Framework | React 19 | React Native 0.81 / Expo 54 |
| Roteamento | React Router DOM 7 | Expo Router 6 (file-based) |
| Estado global | React Context | Zustand |
| Formulários | useState manual | React Hook Form + Zod |
| Estilo | Tailwind CSS | NativeWind v4 |
| Gráficos | Recharts (SVG) | react-native-gifted-charts |
| Armazenamento local | localStorage | expo-secure-store + AsyncStorage |
| Notificações | Web Notification API | expo-notifications (local) |
| Autenticação token | sessionStorage / localStorage | expo-secure-store (Keychain) |
| Validação | Não especificado (manual) | Zod + React Hook Form |
| Linguagem | TypeScript 5.9 | TypeScript 5.9 |
| Build | Vite 7 | Metro Bundler |

## Apêndice B — Estrutura de Arquivos Proposta (Novas Adições)

```
habits-mobile/
├── app/
│   └── (app)/
│       └── (tabs)/
│           └── calendar.tsx              ← NOVO (Fase 2)
├── src/
│   ├── components/
│   │   ├── calendar/                     ← NOVO (Fase 2)
│   │   │   ├── MonthCalendar.tsx
│   │   │   ├── MonthNavigator.tsx
│   │   │   ├── HabitDot.tsx
│   │   │   ├── DayBottomSheet.tsx
│   │   │   └── HabitVisibilityFilter.tsx
│   │   └── stats/
│   │       ├── GlobalSummaryCards.tsx    ← NOVO (Fase 3)
│   │       ├── ActivityHeatmap.tsx       ← NOVO (Fase 3)
│   │       ├── HabitCompletionBars.tsx   ← NOVO (Fase 3)
│   │       └── StreakComparisonChart.tsx ← NOVO (Fase 3, P2)
│   ├── hooks/
│   │   ├── useCalendar.ts               ← NOVO (Fase 2)
│   │   └── useAnalytics.ts              ← NOVO (Fase 3)
│   └── store/
│       └── habits.store.ts              ← MODIFICAR (Fases 1-4)

habits-api/
└── src/
    └── routes/
        └── checkins.routes.ts           ← MODIFICAR (Fase 0)
```

---

*Documento gerado automaticamente a partir da análise dos repositórios habits-dashboard,
habits-api e habits-mobile em 2026-02-24.*
