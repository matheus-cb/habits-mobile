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
  # As DUAS listas derivam do AGENTS.md — as exigidas e as ignoradas.
  #
  # A versão anterior derivava só as exigidas e mantinha a exclusão literal
  # (`for api in INV-0{1..9} INV-1{0..9}`). Isso embutia a premissa de que a faixa
  # da API é para sempre 01–19: no dia em que a API criar INV-25 e este repo a
  # citar como herdada, o gate exigiria um teste que, por decisão documentada,
  # vive na API — reprovando por seguir a regra.
  #
  # E deixava um buraco pior: INV-11 tem teste local de propósito, e a faixa fazia
  # o gate ignorá-lo. Apagar aquele teste não era notado por ninguém, embora a
  # tabela afirmasse que a cobertura existe aqui.
  #
  # Agora a faixa numérica não é regra em lugar nenhum: é consequência de qual
  # seção da tabela cada invariante ocupa.
  invariantes_da_secao() {
    # Só LINHAS DE TABELA contam, não a seção inteira. Duas iterações erradas
    # antes desta, ambas encontradas testando o caso vizinho e não o caso de
    # origem: a primeira resetava a seção só em `###`, e a segunda ainda incluía a
    # prosa depois da tabela — os parágrafos que explicam INV-21 e INV-22 faziam
    # essas duas aparecerem também como "herdadas", e uma nota solta ao fim do
    # arquivo era classificada como herdada em vez de órfã.
    #
    # É a tabela que DECLARA de quem a invariante é. Parágrafo é comentário.
    awk -v alvo="$1" '
      /^#{2,3} / { dentro = (/^### / && index($0, alvo) > 0) }
      dentro && /^\| \*\*INV-[0-9][0-9]\*\*/ { print }
    ' AGENTS.md | grep -oE 'INV-[0-9]{2}' | sort -u || true
  }

  todas="$(grep -oE 'INV-[0-9]{2}' AGENTS.md | sort -u)"
  proprias="$(invariantes_da_secao 'Próprias')"
  faceta="$(invariantes_da_secao 'faceta local')"
  herdadas="$(invariantes_da_secao 'contexto, não cobertura')"
  exigidas="$(printf '%s\n%s\n' "$proprias" "$faceta" | grep -v '^$' | sort -u)"

  faltando=""
  for inv in $exigidas; do
    grep -rqE "(it|test|describe)\\(['\"]$inv" tests/ || faltando="$faltando $inv"
  done
  [ -z "$faltando" ] ||
    falhar "invariante sem teste que a cite pelo número:$faltando."

  # Invariante fora de seção é invariante que ninguém decidiu de quem é: nem
  # exigida, nem declarada como herdada. Sem isto, acrescentar uma linha na
  # introdução do arquivo a tornaria invisível para as duas listas.
  orfas=""
  for inv in $todas; do
    printf '%s\n%s\n%s\n' "$proprias" "$faceta" "$herdadas" | grep -qx "$inv" ||
      orfas="$orfas $inv"
  done
  [ -z "$orfas" ] ||
    falhar "invariante fora de seção da tabela:$orfas. Declare se é própria, de faceta local, ou herdada."
fi

if [ "$falhas" -gt 0 ]; then
  echo "" >&2
  echo "$falhas verificação(ões) falharam. Ver AGENTS.md → 'Objetivo'." >&2
  exit 1
fi

echo "Convenção dos arquivos de contexto: ok ($bytes bytes no AGENTS.md, $total linhas no total)."
