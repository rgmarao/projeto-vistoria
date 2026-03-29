#!/bin/bash
# Script para enviar o projeto ao GitHub
# Execute este arquivo no Shell do Replit

GITHUB_TOKEN="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"
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

echo ""
echo "✅ Código enviado com sucesso!"
echo "🌐 Repositório: https://github.com/rgmarao/projeto-vistoria"

# Remova o token do remote após o push por segurança
git remote set-url origin "https://github.com/rgmarao/projeto-vistoria.git"
echo "🔒 Token removido da URL remota por segurança."
