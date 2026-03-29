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
import unidadesRoutes from './routes/unidades.js';


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
app.use("/api/unidades", unidadesRoutes);   // ✅ específica (multer: antes das genéricas)
app.use("/api/vistorias", vistoriasRoutes); // ✅ específica primeiro
app.use('/api', ocorrenciasRoutes);         // genérica
app.use('/api', areasRoutes);               // genérica
app.use('/api', fotosRoutes);               // genérica por último

// Rota não encontrada
app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

// Handler de erros globais
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Erro interno do servidor" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
