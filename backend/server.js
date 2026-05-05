/**
 * ═══════════════════════════════════════════════════════════
 *  NeuraCorp — Server
 *  Backend principal com Express + MongoDB (Mongoose)
 *  Sistema de auth (JWT) pronto para login/cadastro
 * ═══════════════════════════════════════════════════════════
 */

const express    = require("express");
const mongoose   = require("mongoose");
const bcrypt     = require("bcryptjs");
const jwt        = require("jsonwebtoken");
const cors       = require("cors");
require("dotenv").config();

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ─── CONEXÃO MONGODB ──────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/neuracorp";

mongoose.connect(MONGO_URI)
  .then(() => console.log("🗄️  MongoDB conectado:"))
  .catch((err) => {
    console.error("❌ Erro ao conectar MongoDB:", err.message);
    process.exit(1);
  });

// ─── SCHEMAS & MODELS ─────────────────────────────────────────────────────────

/**
 * Usuário
 * Modelo base — você vai expandir quando trouxer o código de login/cadastro
 */
const userSchema = new mongoose.Schema({
  nome: {
    type:     String,
    required: [true, "Nome é obrigatório"],
    trim:     true,
    maxlength: [80, "Nome muito longo"],
  },
  email: {
    type:     String,
    required: [true, "Email é obrigatório"],
    unique:   true,
    lowercase: true,
    trim:     true,
    match:    [/^\S+@\S+\.\S+$/, "Email inválido"],
  },
  senha: {
    type:     String,
    required: [true, "Senha é obrigatória"],
    minlength: [8, "Senha deve ter no mínimo 8 caracteres"],
    select:   false, // nunca retorna a senha nas queries por padrão
  },
  role: {
    type:    String,
    enum:    ["user", "admin", "moderator"],
    default: "user",
  },
  ativo: {
    type:    Boolean,
    default: true,
  },
  createdAt: {
    type:    Date,
    default: Date.now,
  },
  updatedAt: Date,
});

// Hash da senha antes de salvar
userSchema.pre("save", async function (next) {
  if (!this.isModified("senha")) return next();
  const salt = await bcrypt.genSalt(12);
  this.senha = await bcrypt.hash(this.senha, salt);
  this.updatedAt = new Date();
  next();
});

// Método para verificar senha
userSchema.methods.verificarSenha = async function (senhaInformada) {
  return bcrypt.compare(senhaInformada, this.senha);
};

const User = mongoose.model("User", userSchema);

// ─── UTILITÁRIOS ──────────────────────────────────────────────────────────────

/** Gera token JWT */
function gerarToken(userId) {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || "neuracorp_secret_dev",
    { expiresIn: process.env.JWT_EXPIRES || "7d" }
  );
}

/** Middleware de autenticação JWT */
function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ erro: "Token não fornecido" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "neuracorp_secret_dev");
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ erro: "Token inválido ou expirado" });
  }
}

/** Middleware de role/permissão */
function autorizar(...roles) {
  return async (req, res, next) => {
    const user = await User.findById(req.userId);
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ erro: "Acesso negado" });
    }
    next();
  };
}

// ─── ROTAS: AUTH ──────────────────────────────────────────────────────────────

/**
 * POST /auth/cadastro
 * Registra um novo usuário
 * Body: { nome, email, senha }
 */
app.post("/auth/cadastro", async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: "Nome, email e senha são obrigatórios" });
    }

    const jaExiste = await User.findOne({ email });
    if (jaExiste) {
      return res.status(409).json({ erro: "Email já cadastrado" });
    }

    const usuario = await User.create({ nome, email, senha });
    const token   = gerarToken(usuario._id);

    res.status(201).json({
      mensagem: "Conta criada com sucesso",
      token,
      usuario: {
        id:    usuario._id,
        nome:  usuario.nome,
        email: usuario.email,
        role:  usuario.role,
      },
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      const erros = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ erro: erros.join(", ") });
    }
    console.error("Erro no cadastro:", err);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
});

/**
 * POST /auth/login
 * Autentica um usuário existente
 * Body: { email, senha }
 */
app.post("/auth/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: "Email e senha são obrigatórios" });
    }

    const usuario = await User.findOne({ email }).select("+senha");
    if (!usuario) {
      return res.status(401).json({ erro: "Credenciais inválidas" });
    }

    if (!usuario.ativo) {
      return res.status(403).json({ erro: "Conta desativada. Entre em contato com o suporte." });
    }

    const senhaCorreta = await usuario.verificarSenha(senha);
    if (!senhaCorreta) {
      return res.status(401).json({ erro: "Credenciais inválidas" });
    }

    const token = gerarToken(usuario._id);

    res.json({
      mensagem: "Login realizado com sucesso",
      token,
      usuario: {
        id:    usuario._id,
        nome:  usuario.nome,
        email: usuario.email,
        role:  usuario.role,
      },
    });
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
});

/**
 * POST /recuperar-senha
 * Inicia fluxo de recuperação de senha
 * Body: { email }
 */
app.post("/recuperar-senha", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ erro: "Email é obrigatório" });
    }

    // Aqui você integrará o serviço de email (ex: Nodemailer, SendGrid)
    console.log("📧 Pedido de recuperação para:", email);

    // Sempre retorna a mesma mensagem por segurança (não expõe se o email existe)
    res.json({ mensagem: "Se o email existir, enviaremos as instruções de recuperação." });
  } catch (err) {
    console.error("Erro na recuperação:", err);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
});

// ─── ROTAS: USUÁRIOS (PROTEGIDAS) ────────────────────────────────────────────

/**
 * GET /usuarios/perfil
 * Retorna o perfil do usuário autenticado
 */
app.get("/usuarios/perfil", autenticar, async (req, res) => {
  try {
    const usuario = await User.findById(req.userId);
    if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado" });
    res.json({ usuario });
  } catch (err) {
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
});

/**
 * GET /usuarios
 * Lista todos os usuários (apenas admin)
 */
app.get("/usuarios", autenticar, autorizar("admin"), async (req, res) => {
  try {
    const usuarios = await User.find({ ativo: true }).select("-senha");
    res.json({ total: usuarios.length, usuarios });
  } catch (err) {
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
});

// ─── ROTA DE SAÚDE ───────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status:  "online",
    sistema: "NeuraCorp API",
    versao:  "2.0.0",
    banco:   mongoose.connection.readyState === 1 ? "conectado" : "desconectado",
    uptime:  `${Math.floor(process.uptime())}s`,
  });
});

// ─── ROTAS NÃO ENCONTRADAS ────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ erro: `Rota ${req.method} ${req.path} não encontrada` });
});

// ─── SERVIDOR ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n⬡  NeuraCorp Server`);
  console.log(`🔥  Rodando na porta ${PORT}`);
  console.log(`🌐  http://localhost:${PORT}/health\n`);
});