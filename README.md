# habits-mobile

App mobile de acompanhamento de hábitos, construído com Expo + React Native. Consome a `habits-api` e é listado no portfólio como "App de Produtividade".

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Expo SDK 54 + React Native 0.81 |
| Roteamento | Expo Router 6 (file-based) |
| Estado | Zustand 5 |
| Armazenamento seguro | expo-secure-store (Keychain/Keystore) |
| Estilização | NativeWind v4 + Tailwind CSS v3 |
| Formulários | React Hook Form + Zod |
| Gráficos | react-native-gifted-charts |
| Notificações | expo-notifications (local) |
| Utilitários de data | date-fns v4 |
| Linguagem | TypeScript strict |

---

## Pré-requisitos

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- `habits-api` rodando localmente

---

## Como rodar

```bash
# 1. Instalar dependências
npm install --legacy-peer-deps

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com a URL correta da API (ver .env.example)

# 3. Iniciar o app
npx expo start
```

### Rodar no dispositivo físico (Expo Go)

1. Instale o **Expo Go** no iPhone (App Store) ou Android (Google Play)
2. Garanta que o dispositivo e o computador estão na **mesma rede WiFi**
3. Ajuste o `.env` com o IP da máquina:
   ```
   EXPO_PUBLIC_API_URL=http://<SEU_IP>:3333/api/v1
   ```
   Descobrir IP no macOS: `ipconfig getifaddr en0`
4. Rode `npx expo start` e escaneie o QR code com o Expo Go

---

## Estrutura de pastas

```
habits-mobile/
├── app/                              # Expo Router (file-based routing)
│   ├── _layout.tsx                   # Root: carrega fontes, SplashScreen, loadUser()
│   ├── (auth)/
│   │   ├── _layout.tsx               # Redireciona autenticados para (app)
│   │   ├── login.tsx                 # Tela de login
│   │   └── register.tsx              # Tela de cadastro
│   └── (app)/
│       ├── _layout.tsx               # Redireciona não autenticados para (auth)
│       └── (tabs)/
│           ├── _layout.tsx           # Tab bar com 4 abas e ícones Ionicons
│           ├── index.tsx             # Tela Hoje
│           ├── habits.tsx            # Lista + CRUD de hábitos
│           ├── stats.tsx             # Estatísticas + conquistas
│           └── profile.tsx           # Perfil + notificações + logout
│
├── src/
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts             # apiClient<T>() com SecureStore + interceptor 401
│   │   │   ├── auth.ts               # authApi (login, register, getProfile, token)
│   │   │   └── habits.ts             # habitsApi (CRUD, checkin, stats)
│   │   └── notifications/
│   │       ├── index.ts              # requestPermissions, canal Android
│   │       └── scheduler.ts          # scheduleDailyReminder, cancelAllReminders
│   │
│   ├── store/
│   │   ├── auth.store.ts             # Zustand: user, isAuthenticated, login, register, logout, loadUser
│   │   └── habits.store.ts           # Zustand: habits[], checkinsByHabit, CRUD, checkin, isCheckedInToday
│   │
│   ├── hooks/
│   │   ├── useAuth.ts                # Selector fino sobre auth.store
│   │   ├── useHabits.ts              # Selector fino sobre habits.store
│   │   └── useHabitStats.ts          # Busca stats + checkins de um hábito
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx            # Botão com variantes: primary, secondary, danger
│   │   │   ├── Input.tsx             # Campo de texto com label e erro
│   │   │   ├── Card.tsx              # Container com sombra e borda
│   │   │   └── StreakBadge.tsx       # Widget "🔥 N" de streak
│   │   ├── habits/
│   │   │   ├── HabitCard.tsx         # Card da tela Hoje com CheckinButton
│   │   │   ├── HabitListItem.tsx     # Item da tela Hábitos com ações editar/excluir
│   │   │   ├── HabitForm.tsx         # Modal de criação/edição (RHF + Zod)
│   │   │   └── CheckinButton.tsx     # Botão animado com Animated.spring
│   │   ├── stats/
│   │   │   ├── StatsCard.tsx         # Tile de métrica (streak, total, taxa)
│   │   │   └── CompletionChart.tsx   # BarChart 30 dias (gifted-charts + date-fns)
│   │   └── gamification/
│   │       └── AchievementBadge.tsx  # Badge travada/destravada com emoji
│   │
│   ├── types/
│   │   └── index.ts                  # User, Habit, Checkin, HabitStats, AuthResponse, etc.
│   │
│   ├── schemas/
│   │   ├── auth.schema.ts            # Zod: loginSchema, registerSchema
│   │   └── habit.schema.ts           # Zod: habitSchema
│   │
│   └── constants/
│       └── achievements.ts           # 6 badges + getUnlockedAchievements(stats)
│
├── global.css                        # @tailwind base/components/utilities
├── app.json                          # scheme: habitsmobile, plugins: expo-router, expo-notifications
├── babel.config.js                   # jsxImportSource nativewind (NativeWind v4)
├── metro.config.js                   # NativeWind Metro plugin
├── tailwind.config.js                # purple-600 (#9333ea) como cor primária
├── tsconfig.json                     # paths: "@/*": ["src/*"], strict: true
└── .env                              # EXPO_PUBLIC_API_URL
```

---

## Fluxo de autenticação

1. App inicia → `SplashScreen.preventAutoHideAsync()`
2. `loadUser()` lê o token do SecureStore
3. Se token existe → `GET /auth/me` → preenche o store com o usuário
4. Expo Router redireciona automaticamente:
   - Autenticado → `(app)/(tabs)`
   - Não autenticado → `(auth)/login`
5. Em qualquer resposta 401 da API → `logout()` é chamado automaticamente → redirect para login

---

## Telas

### Hoje (`/`)
- Saudação com nome do usuário e hora do dia
- Cards de resumo: total de hábitos, completos hoje, % de progresso
- FlatList com `HabitCard` para cada hábito
- Pull-to-refresh
- Empty state quando não há hábitos

### Hábitos (`/habits`)
- Lista de hábitos com ações de editar e excluir
- Botão FAB (roxo, canto superior direito) para criar novo hábito
- Modal de formulário (`HabitForm`) para criação e edição
- Alert de confirmação antes de excluir

### Estatísticas (`/stats`)
- Seletor horizontal de hábito (chips roláveis)
- 4 cards de métricas: streak atual, melhor streak, total de check-ins, taxa 30 dias
- BarChart dos últimos 30 dias (dias com check-in em roxo)
- Seção de conquistas com 6 badges (travadas/destravadas)

### Perfil (`/profile`)
- Avatar com inicial do nome + nome e email
- Toggle para ativar/desativar notificações diárias
- Seletor de horário customizado (incremento de hora e minuto em 5 em 5)
- Botão de logout com confirmação

---

## Gamificação

| Badge | ID | Critério |
|-------|-----|---------|
| 🌱 Primeiro Passo | `first_checkin` | 1 check-in no total |
| 🔥 Em Ritmo | `streak_3` | Streak atual ≥ 3 dias |
| ⚡ Uma Semana | `streak_7` | Streak atual ≥ 7 dias |
| 🏆 Mês Completo | `streak_30` | Streak atual ≥ 30 dias |
| 💎 Consistente | `checkins_50` | 50 check-ins no total |
| 🎯 Disciplinado | `rate_80` | Taxa de conclusão ≥ 80% |

---

## Decisões técnicas

**SecureStore em vez de AsyncStorage**
O JWT é armazenado no Keychain (iOS) ou Keystore (Android) via `expo-secure-store`, que criptografa os dados em repouso. O limite de 2048 bytes por chave é suficiente para o token (~300 bytes).

**Check-in duplicado (409)**
A API rejeita o segundo check-in do dia com HTTP 409. O store trata isso silenciosamente: cria um check-in local temporário para atualizar o estado da UI sem exibir erro para o usuário.

**Zustand sem Provider**
O estado global não exige `<Provider>` wrapping a árvore de componentes. Os stores são importados diretamente onde necessário, eliminando o "Provider pyramid".

**Interceptor de 401**
O `apiClient` detecta respostas 401 e chama `useAuthStore.getState().logout()` diretamente. Como o Expo Router observa o estado de autenticação nos layouts, o redirect para login acontece automaticamente.

**Android + IP local**
Em emuladores Android, `localhost` não resolve para a máquina host. Usar o IP real da máquina no `.env` (`EXPO_PUBLIC_API_URL=http://192.168.x.x:3333/api/v1`). No iOS Simulator, `localhost` funciona normalmente.

**NativeWind v4 + Tailwind v3**
NativeWind v4 requer Tailwind CSS v3 (não v4). O `global.css` é importado no `app/_layout.tsx` para ativar os estilos.

---

## Resolução de Problemas

### "Tailwind CSS has not been configured with the NativeWind preset"
O `tailwind.config.js` precisa do preset do NativeWind v4:
```js
presets: [require('nativewind/preset')],
```

### "Cannot find module 'babel-preset-expo'"
Instalar como devDependency:
```bash
npm install babel-preset-expo --save-dev --legacy-peer-deps
```

### ".plugins is not a valid Plugin property"
No NativeWind v4 o plugin `nativewind/babel` não existe. Remover do `babel.config.js`:
```js
// REMOVER esta linha:
plugins: ['nativewind/babel'],
```

### "Gradient package was not found"
O `react-native-gifted-charts` requer `expo-linear-gradient`:
```bash
npm install expo-linear-gradient --legacy-peer-deps
```

### Pacotes nativos com conflito de peer dependencies
Usar `--legacy-peer-deps` ao instalar:
```bash
npm install <pacote> --legacy-peer-deps
```

### App não consegue conectar na API (dispositivo físico)
`localhost` não funciona em dispositivos físicos ou emuladores Android. Usar o IP da máquina:
```bash
# Descobrir IP (macOS)
ipconfig getifaddr en0
```
E ajustar no `.env`: `EXPO_PUBLIC_API_URL=http://192.168.0.X:3333/api/v1`

---

## Endpoints consumidos

| Método | Rota | Uso |
|--------|------|-----|
| `POST` | `/auth/register` | Cadastro |
| `POST` | `/auth/login` | Login |
| `GET` | `/auth/me` | Carregar usuário da sessão |
| `GET` | `/habits` | Listar hábitos |
| `POST` | `/habits` | Criar hábito |
| `PUT` | `/habits/:id` | Editar hábito |
| `DELETE` | `/habits/:id` | Excluir hábito |
| `POST` | `/habits/:id/checkin` | Fazer check-in |
| `GET` | `/habits/:id/checkins` | Listar check-ins |
| `GET` | `/habits/:id/stats` | Buscar estatísticas |
