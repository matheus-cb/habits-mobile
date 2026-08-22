#!/usr/bin/env bash
# Validação local. Uma camada só: nada aqui depende de serviço externo — os testes
# dublam `fetch`, `expo-secure-store` e `expo-router`.
#
# Não há passo de build: gerar binário exige EAS ou toolchain nativa, e nenhum dos
# dois cabe num gate. `tsc --noEmit` é o que mais se aproxima.
set -uo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo"

falhou=0
passo() {
  echo ""
  echo "▶ $*"
  if ! "$@"; then
    echo "✗ falhou: $*" >&2
    falhou=1
  fi
}

passo ./scripts/check-agent-docs.sh
passo npx tsc --noEmit
passo npm run lint
passo npm test

echo ""
if [ "$falhou" -ne 0 ]; then
  echo "RESULTADO: falhou." >&2
  exit 1
fi
echo "RESULTADO: tudo passou."
