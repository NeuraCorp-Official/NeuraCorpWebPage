/**
 * ═══════════════════════════════════════
 *  NeuraCorp — site.js
 *  Gerencia estado de autenticação em todas as páginas
 *  Inclui esse arquivo em todos os HTMLs do site
 * ═══════════════════════════════════════
 */

// ─── ESTADO ──────────────────────────────────────────────────

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('nc_user'));
  } catch {
    return null;
  }
}

function getToken() {
  return localStorage.getItem('nc_token');
}

function isLoggedIn() {
  return !!(getToken() && getUser());
}

function logout() {
  localStorage.removeItem('nc_token');
  localStorage.removeItem('nc_user');
  window.location.href = 'login.html';
}

// ─── AVATAR ──────────────────────────────────────────────────

function getInitials(nome) {
  if (!nome) return 'NC';
  const partes = nome.trim().split(' ');
  if (partes.length === 1) return partes[0][0].toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

// ─── TOPBAR ──────────────────────────────────────────────────

function renderTopbar() {
  const area = document.getElementById('authArea');
  if (!area) return;

  if (isLoggedIn()) {
    const user     = getUser();
    const initials = getInitials(user.nome);
    const nome     = user.nome?.split(' ')[0] || 'Usuário';

    area.innerHTML = `
      <div class="topbar-user" id="userMenu" onclick="toggleUserMenu()">
        <div class="avatar" style="background: linear-gradient(135deg, #38bdf8, #818cf8)">
          ${initials}
        </div>
        ${nome}
        <span style="font-size:10px; opacity:0.5; margin-left:2px">▾</span>
      </div>
      <div class="user-dropdown" id="userDropdown">
        <div class="dropdown-header">
          <div class="avatar-lg">${initials}</div>
          <div>
            <div class="dropdown-name">${user.nome}</div>
            <div class="dropdown-email">${user.email}</div>
          </div>
        </div>
        <div class="dropdown-divider"></div>
        <a class="dropdown-item" href="#">⚙ Configurações</a>
        <a class="dropdown-item" href="#">👤 Meu Perfil</a>
        <div class="dropdown-divider"></div>
        <a class="dropdown-item dropdown-logout" onclick="logout()">↩ Sair</a>
      </div>
    `;
  } else {
    area.innerHTML = `
      <a href="login.html" class="btn-auth btn-ghost-sm">Entrar</a>
      <a href="cadastro.html" class="btn-auth btn-primary-sm">Criar conta</a>
    `;
  }
}

// ─── DROPDOWN DO USUÁRIO ─────────────────────────────────────

function toggleUserMenu() {
  const dropdown = document.getElementById('userDropdown');
  if (!dropdown) return;
  dropdown.classList.toggle('open');
}

// Fecha ao clicar fora
document.addEventListener('click', (e) => {
  const menu     = document.getElementById('userMenu');
  const dropdown = document.getElementById('userDropdown');
  if (dropdown && menu && !menu.contains(e.target)) {
    dropdown.classList.remove('open');
  }
});

// ─── PROTEÇÃO DE ELEMENTOS ───────────────────────────────────

function protegerElementos() {
  // Adiciona proteção a qualquer elemento com data-protected
  document.querySelectorAll('[data-protected]').forEach(el => {
    el.addEventListener('click', (e) => {
      if (!isLoggedIn()) {
        e.preventDefault();
        e.stopPropagation();
        redirecionarCadastro();
      }
    });
  });
}

function redirecionarCadastro() {
  window.location.href = 'cadastro.html';
}

// ─── ESTILOS DINÂMICOS ───────────────────────────────────────

function injetarEstilos() {
  if (document.getElementById('site-auth-styles')) return;

  const style = document.createElement('style');
  style.id = 'site-auth-styles';
  style.textContent = `
    /* Botões da topbar quando deslogado */
    .btn-auth {
      display: inline-flex;
      align-items: center;
      padding: 7px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
      cursor: pointer;
    }
    .btn-ghost-sm {
      background: transparent;
      color: var(--text-secondary, #7da8cc);
      border: 1px solid var(--border, #0f2544);
    }
    .btn-ghost-sm:hover {
      border-color: var(--accent, #38bdf8);
      color: var(--accent, #38bdf8);
    }
    .btn-primary-sm {
      background: var(--accent, #38bdf8);
      color: #020913;
      border: 1px solid transparent;
    }
    .btn-primary-sm:hover {
      opacity: 0.9;
      transform: translateY(-1px);
      box-shadow: 0 0 16px rgba(56,189,248,0.35);
    }

    /* Dropdown do usuário */
    #userMenu { position: relative; cursor: pointer; }

    .user-dropdown {
      display: none;
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      width: 240px;
      background: #070f1d;
      border: 1px solid #0f2544;
      border-radius: 14px;
      padding: 8px;
      z-index: 999;
      box-shadow: 0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(56,189,248,0.06);
      animation: dropIn 0.2s ease;
    }
    .user-dropdown.open { display: block; }

    @keyframes dropIn {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .dropdown-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 10px 14px;
    }
    .avatar-lg {
      width: 40px; height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #38bdf8, #818cf8);
      display: flex; align-items: center; justify-content: center;
      font-size: 14px;
      font-weight: 700;
      color: #020913;
      flex-shrink: 0;
    }
    .dropdown-name {
      font-size: 14px;
      font-weight: 600;
      color: #e2f0ff;
    }
    .dropdown-email {
      font-size: 11px;
      color: #4a7a9b;
      margin-top: 2px;
    }
    .dropdown-divider {
      height: 1px;
      background: #0f2544;
      margin: 4px 0;
    }
    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 9px 12px;
      border-radius: 8px;
      font-size: 13px;
      color: #7da8cc;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.15s;
    }
    .dropdown-item:hover {
      background: rgba(56,189,248,0.08);
      color: #38bdf8;
    }
    .dropdown-logout {
      color: #f87171 !important;
    }
    .dropdown-logout:hover {
      background: rgba(248,113,113,0.08) !important;
      color: #f87171 !important;
    }
  `;
  document.head.appendChild(style);
}

// ─── INICIALIZAÇÃO ───────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  injetarEstilos();
  renderTopbar();
  protegerElementos();
});