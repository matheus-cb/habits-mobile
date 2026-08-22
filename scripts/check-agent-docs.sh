#!/usr/bin/env bash
# Gate da convenção dos arquivos de contexto de agente.
#
# O AGENTS.md exige que cada regra tenha um teste apontável. A regra "AGENTS.md é
# canônico, CLAUDE.md só importa" não tinha nenhum — e é justamente a que se
# viola sem ninguém notar, porque violá-la não quebra nada em execução.
set -euo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo"

falhas=0
falhar() {
  echo "FALHA: $1" >&2
  falhas=$((falhas + 1))
}

# 1. A ponte existe e é a primeira coisa do arquivo.
primeira="$(grep -m1 -v '^[[:space:]]*$' CLAUDE.md || true)"
[ "$primeira" = "@AGENTS.md" ] ||
  falhar "CLAUDE.md deve começar com o import '@AGENTS.md'; começa com '$primeira'."

# 2. O Codex corta em project_doc_max_bytes (32 KiB) sem avisar.
bytes="$(wc -c <AGENTS.md)"
[ "$bytes" -lt 32768 ] || falhar "AGENTS.md tem $bytes bytes; o Codex corta em 32768."

# 3. Regra de projeto no CLAUDE.md é regra que o Codex nunca vê.
if grep -qE 'INV-[0-9]|^\| *\*\*INV' CLAUDE.md; then
  falhar "CLAUDE.md cita invariante (INV-nn). Invariante é regra de projeto: vai no AGENTS.md."
fi

# 4. O CLAUDE.md é uma ponte, não um segundo manual.
linhas_claude="$(wc -l <CLAUDE.md)"
[ "$linhas_claude" -le 40 ] ||
  falhar "CLAUDE.md tem $linhas_claude linhas (máx. 40)."

# 5. Acima de 200 linhas combinadas a aderência às instruções cai.
total=$((linhas_claude + $(wc -l <AGENTS.md)))
[ "$total" -le 200 ] || falhar "AGENTS.md + CLAUDE.md somam $total linhas; acima de 200 a aderência cai."

# 6. Import quebrado carrega nada e não avisa.
for arquivo in AGENTS.md CLAUDE.md; do
  while read -r alvo; do
    [ -n "$alvo" ] || continue
    [ -e "$alvo" ] || falhar "$arquivo importa '@$alvo', que não existe."
  done < <(grep -oE '(^|[^`[:alnum:]@])@[A-Za-z0-9._/-]+' "$arquivo" | sed 's/.*@//')
done

# 7. Invariante declarada sem teste que a cite pelo número é invariante
#    decorativa. Só as que VIVEM aqui são exigidas; INV-01 a INV-19 são da API.
#
#    O padrão exige a forma `it('INV-nn` ou `describe('INV-nn`: a versão anterior
#    usava `grep -F` e um comentário `// INV-21: ver adiante` a satisfazia. Provar
#    menção não é provar teste.
if [ -d tests ]; then
  faltando=""
  # A lista é DERIVADA do AGENTS.md, não literal. A versão anterior era
  # `for inv in INV-20 INV-21 INV-22`, e isso invertia o propósito da checagem:
  # declarar INV-25 no AGENTS.md não exigia teste nenhum — a tabela crescia e a
  # cobertura não, que é exatamente o que este bloco existe para impedir.
  while read -r inv; do
    grep -rqE "(it|test|describe)\\(['\"]$inv" tests/ || faltando="$faltando $inv"
  done < <(grep -oE 'INV-[0-9]{2}' AGENTS.md | sort -u)

  # INV-01 a INV-19 vivem na habits-api; os testes delas estão lá. Aparecem no
  # AGENTS.md daqui como contexto de contrato, na seção "Herdadas da API".
  for api in INV-0{1..9} INV-1{0..9}; do
    faltando="${faltando// $api/}"
  done

  [ -z "$faltando" ] ||
    falhar "invariante sem teste que a cite pelo número:$faltando."
fi

if [ "$falhas" -gt 0 ]; then
  echo "" >&2
  echo "$falhas verificação(ões) falharam. Ver AGENTS.md → 'Objetivo'." >&2
  exit 1
fi

echo "Convenção dos arquivos de contexto: ok ($bytes bytes no AGENTS.md, $total linhas no total)."
