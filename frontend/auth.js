/**
 * ═══════════════════════════════════════
 *  NeuraCorp — auth.js
 *  Lógica de autenticação (login, cadastro, recuperação)
 * ═══════════════════════════════════════
 */

const API = 'https://neuracorpwebpage.onrender.com';

// ─── UTILITÁRIOS ─────────────────────────────────────────────

function togglePw(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁';
  }
}

function showAlert(type, msg) {
  const error   = document.getElementById('alertError');
  const success = document.getElementById('alertSuccess');
  const msgEl   = document.getElementById('alertMsg');

  if (error)   error.classList.remove('show');
  if (success) success.classList.remove('show');

  if (type === 'error' && error) {
    if (msgEl) msgEl.textContent = msg;
    error.classList.add('show');
  }
  if (type === 'success' && success) {
    success.classList.add('show');
  }
}

function setLoading(btn, loading, defaultText) {
  btn.disabled = loading;
  btn.innerHTML = loading
    ? '<span class="spinner"></span>Aguarde...'
    : defaultText;
}

// ─── FORÇA DA SENHA ─────────────────────────────────────────

function checkStrength(val) {
  const segs    = ['s1', 's2', 's3', 's4'];
  const txt     = document.getElementById('strengthText');
  const colors  = ['#f87171', '#f59e0b', '#38bdf8', '#22d3a7'];
  const labels  = ['Muito fraca', 'Fraca', 'Boa', 'Forte'];

  let score = 0;
  if (val.length >= 8)           score++;
  if (/[A-Z]/.test(val))         score++;
  if (/[0-9]/.test(val))         score++;
  if (/[^A-Za-z0-9]/.test(val))  score++;

  segs.forEach((id, i) => {
    const el = document.getElementById(id);
    if (el) el.style.background = i < score ? colors[score - 1] : 'var(--border)';
  });

  if (txt) {
    txt.textContent = val.length > 0 ? (labels[score - 1] || '') : '';
    txt.style.color = score > 0 ? colors[score - 1] : 'var(--text-muted)';
  }
}

// ─── LOGIN ───────────────────────────────────────────────────

async function handleLogin(e) {
  e.preventDefault();

  const btn   = document.getElementById('btnLogin');
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;

  showAlert(null);
  setLoading(btn, true);

  try {
    const res  = await fetch(`${API}/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, senha })
    });

    let data;
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (!res.ok) {
      showAlert('error', data.erro || 'Email ou senha incorretos.');
      return;
    }

    localStorage.setItem('nc_token', data.token);
    localStorage.setItem('nc_user',  JSON.stringify(data.usuario));
  window.location.href = 'index.html';

  } catch {
    showAlert('error', 'Erro de conexão. Tente novamente.');
  } finally {
    setLoading(btn, false, 'Entrar na plataforma');
  }
}

// ─── CADASTRO ─────────────────────────────────────────────

async function handleCadastro(e) {
  e.preventDefault();

  const btn   = document.getElementById('btnCadastro');
  const nome  = document.getElementById('nome').value.trim();
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;

  if (senha.length < 8) {
    showAlert('error', 'A senha deve ter no mínimo 8 caracteres.');
    return;
  }

  showAlert(null);
  setLoading(btn, true);

  try {
    const res  = await fetch(`${API}/auth/cadastro`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ nome, email, senha })
    });

    const data = await res.json();

    if (!res.ok) {
      showAlert('error', data.erro || 'Erro ao criar conta.');
      return;
    }

    localStorage.setItem('nc_token', data.token);
    localStorage.setItem('nc_user',  JSON.stringify(data.usuario));

    showAlert('success');
    setTimeout(() => window.location.href = 'index.html', 1500);

  } catch {
    showAlert('error', 'Erro de conexão. Tente novamente.');
  } finally {
    setLoading(btn, false, 'Criar minha conta');
  }
}

// ─── RECUPERAÇÃO DE SENHA ────────────────────────────────

async function handleRecuperar(e) {
  e.preventDefault();

  const btn   = document.getElementById('btnRecuperar');
  const email = document.getElementById('email').value.trim();

  showAlert(null);
  setLoading(btn, true);

  try {
    await fetch(`${API}/recuperar-senha`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email })
    });

    // Sempre mostra sucesso por segurança
    showAlert('success');
    document.getElementById('recuperarForm')?.reset();

  } catch {
    showAlert('error', 'Erro de conexão. Tente novamente.');
  } finally {
    setLoading(btn, false, 'Enviar instruções');
  }
}

// ─── INICIALIZAÇÃO ───────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
  document.getElementById('cadastroForm')?.addEventListener('submit', handleCadastro);
  document.getElementById('recuperarForm')?.addEventListener('submit', handleRecuperar);

  document.getElementById('senha')?.addEventListener('input', (e) => {
    checkStrength(e.target.value);
  });
});