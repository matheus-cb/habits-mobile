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
# `npm ci --dry-run` antes de tudo, e é a lacuna que deixou o CI vermelho passar.
#
# O CI roda `npm ci`, que valida peers contra o lockfile e RECUSA conflito. Eu
# rodava `npm install`, que é permissivo e reconcilia. Resultado: verde aqui,
# vermelho lá, e eu reportei "verify verde" sem nunca ter executado o comando que
# o AGENTS.md lista primeiro.
#
# `--dry-run` faz a resolução completa sem apagar o `node_modules` nem baixar
# nada, então custa segundos em vez de minutos. É a diferença entre uma checagem
# que se roda sempre e uma que se pula.
passo npm ci --dry-run
passo npx tsc --noEmit
passo npm run lint
passo npm test

echo ""
if [ "$falhou" -ne 0 ]; then
  echo "RESULTADO: falhou." >&2
  exit 1
fi
echo "RESULTADO: tudo passou."
