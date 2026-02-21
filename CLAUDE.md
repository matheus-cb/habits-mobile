# CLAUDE.md — habits-mobile

Guia de desenvolvimento para o app mobile de rastreamento de hábitos.

## Comandos

```bash
npx expo start           # Iniciar servidor de desenvolvimento (abre QR code)
npx expo start --ios     # Abrir direto no simulador iOS (requer Xcode)
npx expo start --android # Abrir direto no emulador Android (requer Android Studio)
```

## Configuração de Ambiente

Copiar `.env.example` para `.env` e ajustar a URL:

```bash
cp .env.example .env
```

| Plataforma | URL |
|---|---|
| iOS Simulator | `http://localhost:3333/api/v1` |
| Expo Go / Dispositivo físico / Android | `http://<IP_DA_MAQUINA>:3333/api/v1` |

Descobrir IP da máquina no macOS:
```bash
ipconfig getifaddr en0
```

## Rodar no dispositivo físico (Expo Go)

1. Instalar o app **Expo Go** (App Store / Google Play)
2. iPhone e Mac na mesma rede WiFi
3. Ajustar `.env` com o IP da máquina
4. Rodar `npx expo start` e escanear o QR code com o Expo Go

## Arquitetura

```
Routes (Expo Router) → Stores (Zustand) → API Client (SecureStore + 401 interceptor) → habits-api
```

- **Roteamento:** file-based com Expo Router 6 (`app/` directory)
  - `app/(auth)/` — telas públicas (login, register)
  - `app/(app)/(tabs)/` — telas autenticadas (today, habits, stats, profile)
- **Estado global:** Zustand sem Provider (`src/store/`)
- **API:** cliente genérico em `src/lib/api/client.ts` com token via SecureStore
- **Estilização:** NativeWind v4 com Tailwind CSS v3 (não v4)

## Correções Aplicadas (NativeWind v4)

O NativeWind v4 tem setup diferente do v2/v3. Correções necessárias para funcionar:

### `tailwind.config.js` — preset obrigatório
```js
module.exports = {
  presets: [require('nativewind/preset')], // obrigatório no v4
  content: [...],
  ...
}
```

### `babel.config.js` — sem plugin nativewind/babel
```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }]],
    // NÃO adicionar plugins: ['nativewind/babel'] — não existe no v4
  };
};
```

## Dependências Nativas

Ao instalar pacotes nativos, usar `--legacy-peer-deps` para evitar conflitos de peer dependencies:

```bash
npm install <pacote> --legacy-peer-deps
```

Pacotes nativos instalados além do `package.json` original:
- `babel-preset-expo` — preset Babel do Expo (devDependency)
- `expo-linear-gradient` — requerido por `react-native-gifted-charts`
- `expo-linking` — requerido pelo `expo-router`
- `react-native-reanimated` — requerido pelo `react-native-css-interop` (NativeWind)

## Path Aliases

TypeScript configurado com alias `@/*` → `src/*`:

```typescript
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
```

## Pré-requisitos

- `habits-api` rodando na porta 3333 (ver `../habits-api/`)
- Node.js 18+
