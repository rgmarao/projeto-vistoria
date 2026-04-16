import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Rotas
import authRoutes from "./routes/auth.js";
import fotosRoutes from './routes/fotos.js';
import vistoriasRoutes from "./routes/vistorias.js";
import ocorrenciasRoutes from "./routes/ocorrencias.js";
import areasRoutes from './routes/areas.js';
import empresasRoutes from './routes/empresas.js';
import usuariosRoutes from './routes/usuarios.js';
import perfisRoutes from './routes/perfis.js';
import relatoriosRoutes from './routes/relatorios.js';
import itensRoutes from './routes/itens.js';
import gruposRoutes from './routes/grupos.js';
import unidadesRoutes from './routes/unidades.js';
import planosAcaoRoutes from './routes/planosAcao.js';

const app = express();

// Middlewares globais
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Arquivos estáticos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "../public")));

// Rota de health check
app.get("/", (req, res) => {
  res.json({
    message: "✅ API Sistema de Vistoria Online",
    status: "running",
    version: "1.0.0",
  });
});

// Rotas da API
app.use("/api/auth", authRoutes);
app.use("/api/empresas", empresasRoutes);   // ✅ específica primeiro
app.use("/api/vistorias", vistoriasRoutes); // ✅ específica primeiro
app.use("/api/usuarios", usuariosRoutes);   // ✅ específica primeiro
app.use("/api/unidades", unidadesRoutes);   // ✅ específica primeiro
app.use('/api', ocorrenciasRoutes);         // genérica
app.use('/api', areasRoutes);               // genérica
app.use('/api', fotosRoutes);               // genérica por último
app.use("/api/perfis", perfisRoutes);
app.use('/api', relatoriosRoutes);
app.use('/api/itens', itensRoutes);
app.use('/api/grupos', gruposRoutes);
app.use('/api/planos-acao', planosAcaoRoutes);

// Rota não encontrada
app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

// Handler de erros globais
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Erro interno do servidor" });
});

export default app;
