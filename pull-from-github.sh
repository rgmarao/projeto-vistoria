#!/bin/bash
# Puxa as últimas alterações do GitHub para o Replit

if [ -z "$GITHUB_TOKEN" ]; then
  echo "⚠️  GITHUB_TOKEN não encontrado. Pulando git pull."
else
  git remote set-url origin "https://${GITHUB_TOKEN}@github.com/rgmarao/projeto-vistoria.git"
  git pull origin main --quiet && echo "✅ Projeto atualizado do GitHub"
  git remote set-url origin "https://github.com/rgmarao/projeto-vistoria.git"
fi
