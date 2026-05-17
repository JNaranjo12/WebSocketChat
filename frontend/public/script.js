const loginScreen = document.getElementById('loginScreen');
const chatScreen = document.getElementById('chatScreen');
const loginForm = document.getElementById('loginForm');
const messageForm = document.getElementById('messageForm');
const usernameInput = document.getElementById('usernameInput');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const messages = document.getElementById('messages');
const statusText = document.getElementById('status');
const activeUser = document.getElementById('activeUser');
const connectionDot = document.getElementById('connectionDot');
const themeToggle = document.getElementById('themeToggle');

const BACKEND_PORT = '3000';
const THEME_KEY = 'chat-theme';

let ws;
let connected = false;
let currentUsername = '';
let reconnectTimer;

function applyTheme(theme) {
    document.documentElement.setAttribute('data-bs-theme', theme);
    themeToggle.checked = theme === 'dark';
    localStorage.setItem(THEME_KEY, theme);
}

function initializeTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const preferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    applyTheme(savedTheme || preferredTheme);
}

function setConnectionState(isConnected, message) {
    connected = isConnected;
    sendBtn.disabled = !isConnected;
    statusText.textContent = message;
    connectionDot.classList.toggle('is-connected', isConnected);
}

function getWebSocketUrl() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${location.hostname}:${BACKEND_PORT}`;
}

function connect() {
    clearTimeout(reconnectTimer);
    setConnectionState(false, 'Conectando...');

    ws = new WebSocket(getWebSocketUrl());

    ws.addEventListener('open', () => {
        setConnectionState(true, 'Conectado');
        messageInput.focus();
    });

    ws.addEventListener('message', (event) => {
        const msg = JSON.parse(event.data);
        addMessage(msg);
    });

    ws.addEventListener('close', () => {
        setConnectionState(false, 'Desconectado. Reintentando conexión...');
        reconnectTimer = setTimeout(connect, 3000);
    });

    ws.addEventListener('error', () => {
        setConnectionState(false, 'No se pudo conectar con el servidor');
    });
}

function showChat() {
    loginScreen.classList.add('d-none');
    chatScreen.classList.remove('d-none');
    activeUser.textContent = currentUsername;
    connect();
}

function addMessage({ username, text, timestamp }) {
    const isOwnMessage = username === currentUsername;
    const row = document.createElement('div');
    row.className = `message-row ${isOwnMessage ? 'own' : 'other'}`;

    const bubble = document.createElement('article');
    bubble.className = 'message-bubble';

    const meta = document.createElement('div');
    meta.className = 'message-meta';

    const user = document.createElement('span');
    user.className = 'message-username';
    user.textContent = username;

    const time = document.createElement('span');
    time.textContent = timestamp || '';

    const body = document.createElement('p');
    body.className = 'message-text';
    body.textContent = text;

    meta.append(user, time);
    bubble.append(meta, body);
    row.appendChild(bubble);
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
}

function sendMessage() {
    const text = messageInput.value.trim();

    if (!text) {
        messageInput.focus();
        return;
    }

    if (!connected || ws.readyState !== WebSocket.OPEN) {
        setConnectionState(false, 'No hay conexión al servidor');
        return;
    }

    ws.send(JSON.stringify({
        username: currentUsername,
        text
    }));

    messageInput.value = '';
    messageInput.focus();
}

loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    currentUsername = usernameInput.value.trim();

    if (!currentUsername) {
        usernameInput.focus();
        return;
    }

    showChat();
});

messageForm.addEventListener('submit', (event) => {
    event.preventDefault();
    sendMessage();
});

themeToggle.addEventListener('change', () => {
    applyTheme(themeToggle.checked ? 'dark' : 'light');
});

initializeTheme();
sendBtn.disabled = true;
usernameInput.focus();
