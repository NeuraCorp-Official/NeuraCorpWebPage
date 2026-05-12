const API = 'https://neura-ia-r5lj.onrender.com';

const input    = document.getElementById('textInput');
const btn      = document.getElementById('btnEnviar');
const chat     = document.getElementById('chat');
const statMsgs = document.getElementById('stat-msgs');
const memList  = document.getElementById('memories-list');
const sessList = document.getElementById('sessions-list');

let msgCount = 0;

// ── Teclado
input.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); }
  if (e.key === 'Escape') input.value = '';
});

// ── Criar mensagem
function criarMsg(texto, tipo) {
  if (tipo === 'system') {
    const div = document.createElement('div');
    div.className = 'neura-msg-system';
    div.textContent = texto;
    chat.appendChild(div);
  } else {
    const wrap = document.createElement('div');
    wrap.className = tipo === 'user' ? 'neura-msg-user' : 'neura-msg-neura';
    wrap.innerHTML = `
      <div class="neura-msg-label">${tipo === 'user' ? 'VOCÊ' : 'NEURA'}</div>
      <div class="neura-msg-text">${texto}</div>
    `;
    chat.appendChild(wrap);
  }
  chat.scrollTop = chat.scrollHeight;
}

function mostrarTyping() {
  const div = document.createElement('div');
  div.className = 'neura-msg-neura';
  div.id = 'typing';
  div.innerHTML = `
    <div class="neura-msg-label">NEURA</div>
    <div class="neura-msg-text">
      <div class="typing-dots"><span></span><span></span><span></span></div>
    </div>
  `;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function removerTyping() {
  const el = document.getElementById('typing');
  if (el) el.remove();
}

// ── Enviar
async function enviar() {
  const texto = input.value.trim();
  if (!texto) return;

  criarMsg(texto, 'user');
  input.value = '';
  input.disabled = true;
  btn.disabled   = true;

  mostrarTyping();

  try {
    const res = await fetch(`${API}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensagem: texto })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    removerTyping();
    criarMsg(data.resposta, 'neura');

    msgCount++;
    if (statMsgs) statMsgs.textContent = msgCount;

    setTimeout(() => { carregarMemorias(); carregarSessoes(); }, 1500);

  } catch (err) {
    removerTyping();
    criarMsg('// Neura offline ou sem conexão', 'system');
    console.error(err);
  } finally {
    input.disabled = false;
    btn.disabled   = false;
    input.focus();
  }
}

// ── Limpar chat
function limparChat() {
  chat.innerHTML = '';
  criarMsg('// chat limpo · nova conversa iniciada', 'system');
  msgCount = 0;
  if (statMsgs) statMsgs.textContent = 0;
}

// ── Memórias
async function carregarMemorias() {
  if (!memList) return;
  try {
    const res  = await fetch(`${API}/sessions`);
    const data = await res.json();
    if (!data.length) return;

    const resMem = await fetch(`${API}/sessions/${data[0].id}/memories`);
    const mems   = await resMem.json();

    if (!mems.length) {
      memList.innerHTML = '<div class="neura-panel-empty">// nenhuma memória ainda</div>';
      return;
    }

    memList.innerHTML = mems
      .map(m => `<div class="neura-mem-item">→ ${m.texto}</div>`)
      .join('');
  } catch (err) { console.error(err); }
}

// ── Sessões
async function carregarSessoes() {
  if (!sessList) return;
  try {
    const res  = await fetch(`${API}/sessions`);
    const data = await res.json();

    const statSessoes = document.getElementById('stat-sessoes');
    if (statSessoes) statSessoes.textContent = data.length;

    if (!data.length) {
      sessList.innerHTML = '<div class="neura-panel-empty">// nenhuma sessão anterior</div>';
      return;
    }

    sessList.innerHTML = '';

    data.slice(0, 8).forEach(s => {
      const hora = s.criado_em
        ? new Date(s.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : '--:--';
      const nome = s.nome || `Sessão ${hora}`;

      const entry = document.createElement('div');
      entry.className = 'neura-session-entry';
      entry.dataset.id = s.id;
      entry.innerHTML = `
        <div class="neura-session-name-row">
          <span class="neura-session-name">${nome}</span>
          <button class="neura-rename-btn" title="Renomear">✎</button>
        </div>
        <div class="neura-session-meta">${hora} · ${s.data || ''} · ${s.total_msgs} msg</div>
      `;

      const nameEl    = entry.querySelector('.neura-session-name');
      const renameBtn = entry.querySelector('.neura-rename-btn');
      const fn        = () => iniciarRenomear(entry, s.id, nome);

      nameEl.addEventListener('dblclick', fn);
      renameBtn.addEventListener('click', fn);
      sessList.appendChild(entry);
    });

  } catch (err) {
    sessList.innerHTML = '<div class="neura-panel-empty">// erro ao carregar</div>';
  }
}

// ── Renomear sessão
function iniciarRenomear(entry, sessionId, nomeAtual) {
  const nameEl = entry.querySelector('.neura-session-name');

  const inputEl = document.createElement('input');
  inputEl.className   = 'neura-rename-input';
  inputEl.value       = nomeAtual.startsWith('Sessão') ? '' : nomeAtual;
  inputEl.placeholder = 'Nome da sessão...';
  inputEl.maxLength   = 40;
  nameEl.replaceWith(inputEl);
  inputEl.focus();

  const confirmar = async () => {
    const novo = inputEl.value.trim();
    if (!novo) { inputEl.replaceWith(nameEl); return; }
    try {
      await fetch(`${API}/sessions/${sessionId}/rename`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: novo })
      });
      nameEl.textContent = novo;
    } catch (err) { console.error(err); }
    inputEl.replaceWith(nameEl);
  };

  inputEl.addEventListener('blur', confirmar);
  inputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter')  confirmar();
    if (e.key === 'Escape') inputEl.replaceWith(nameEl);
  });
}

// ── Init
carregarSessoes();
carregarMemorias();