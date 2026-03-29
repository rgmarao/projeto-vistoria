#!/bin/bash
# Script para enviar o projeto ao GitHub
# Execute: bash push-to-github.sh

if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ GITHUB_TOKEN não encontrado. Verifique os Secrets do projeto."
  exit 1
fi

REPO_URL="https://${GITHUB_TOKEN}@github.com/rgmarao/projeto-vistoria.git"

echo "⚙️  Configurando Git..."
git config user.email "rgmarao@users.noreply.github.com"
git config user.name "rgmarao"

echo "🔗 Configurando repositório remoto..."
git remote remove origin 2>/dev/null
git remote add origin "$REPO_URL"

echo "📦 Adicionando arquivos..."
git add -A

echo "💾 Criando commit..."
git commit -m "feat: initial commit - API Sistema de Vistoria Online"

echo "🚀 Enviando para o GitHub..."
git branch -M main
git push -u origin main

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Código enviado com sucesso!"
  echo "🌐 https://github.com/rgmarao/projeto-vistoria"
  # Remove token da URL remota por segurança
  git remote set-url origin "https://github.com/rgmarao/projeto-vistoria.git"
else
  echo "❌ Erro ao enviar. Verifique o token e tente novamente."
fi
