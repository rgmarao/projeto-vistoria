#!/bin/bash
# Uso: bash push-to-github.sh "mensagem do commit"

if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ GITHUB_TOKEN não encontrado nos Secrets do projeto."
  exit 1
fi

COMMIT_MSG="${1:-update}"
REPO_URL="https://${GITHUB_TOKEN}@github.com/rgmarao/projeto-vistoria.git"

git config user.email "rgmarao@users.noreply.github.com"
git config user.name "rgmarao"
git remote set-url origin "$REPO_URL" 2>/dev/null || git remote add origin "$REPO_URL"

git add -A

if git diff --cached --quiet; then
  echo "ℹ️  Nenhuma alteração para commitar."
else
  git commit -m "$COMMIT_MSG"
  echo "💾 Commit criado: $COMMIT_MSG"
fi

git push origin main && echo "✅ Push concluído!" || echo "❌ Erro no push."

git remote set-url origin "https://github.com/rgmarao/projeto-vistoria.git"
