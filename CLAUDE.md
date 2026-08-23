@AGENTS.md

## Claude Code

Só a mecânica desta ferramenta; as regras do projeto estão no arquivo importado
acima. O guia antigo de ambiente e arquitetura virou `docs/DESENVOLVIMENTO.md`.

- **Alto risco:** em `src/lib/api/` e `src/store/auth.store.ts` use plan mode
  antes de editar — é onde vivem as invariantes de sessão.
- **Simulador:** para ver o app, abra o painel do iOS Simulator **antes** de
  buildar. `npx expo start --ios` precisa do Xcode instalado.
- **Testes não precisam de dispositivo nem da API.** A suíte dubla `fetch`,
  `expo-secure-store` e `expo-router`. Se um teste novo passar a exigir
  dispositivo, ele não cabe neste gate.
- **Não rode `npm i tailwindcss@latest`** — ver as ferramentas exigidas no
  AGENTS.md.
