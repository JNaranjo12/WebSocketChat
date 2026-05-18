import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js';
import {
    getAuth,
    signInWithEmailAndPassword
} from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyDnjHdLCfs7Hu9seioPbnfGeVy9W2Fo2LI",
    authDomain: "websocketchat-456a7.firebaseapp.com",
    projectId: "websocketchat-456a7",
    storageBucket: "websocketchat-456a7.firebasestorage.app",
    messagingSenderId: "590489218268",
    appId: "1:590489218268:web:ca387af0cab351f8845819"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const loginContainer = document.getElementById('login-container');
const chatContainer = document.getElementById('chat-container');
const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const loginError = document.getElementById('loginError');
const displayUsername = document.getElementById('displayUsername');
const statusText = document.getElementById('status');
const messages = document.getElementById('messages');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');

let socket = null;
let usernameActual = '';

const moonIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M6 .278a.77.77 0 0 1 .08.858 7.2 7.2 0 0 0-.878 3.46c0 4.02 3.25 7.28 7.26 7.28.53 0 1.04-.057 1.53-.167a.79.79 0 0 1 .81.316.73.73 0 0 1-.031.893A8.35 8.35 0 0 1 8.34 16C3.73 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.75.75 0 0 1 6 .278z"/>
    </svg>
`;

const sunIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 16 8zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.414a.5.5 0 1 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zM4.464 11.536a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.464a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707z"/>
    </svg>
`;

function actualizarIconoTema() {
    const modoOscuroActivo = document.body.classList.contains('mode-dark');
    themeToggleBtn.innerHTML = modoOscuroActivo ? sunIcon : moonIcon;
    themeToggleBtn.setAttribute(
        'aria-label',
        modoOscuroActivo ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
    );
}

function mostrarError(mensaje) {
    loginError.textContent = mensaje;
}

function habilitarChat(habilitado) {
    messageInput.disabled = !habilitado;
    sendBtn.disabled = !habilitado;
}

function obtenerHora(valor) {
    if (valor) {
        return valor;
    }

    return new Intl.DateTimeFormat('es-EC', {
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date());
}

function agregarMensaje({ author, username, autor, text, message, mensaje, timestamp, time, hora }) {
    const autorMensaje = author || username || autor || 'Anonimo';
    const textoMensaje = text || message || mensaje || '';
    const horaMensaje = obtenerHora(timestamp || time || hora);
    const esMensajePropio = autorMensaje === usernameActual;

    const fila = document.createElement('div');
    fila.className = `message-row ${esMensajePropio ? 'msg-left' : 'msg-right'}`;

    const burbuja = document.createElement('article');
    burbuja.className = 'message-bubble';

    const nombre = document.createElement('span');
    nombre.className = 'message-author';
    nombre.textContent = autorMensaje;

    const texto = document.createElement('p');
    texto.className = 'message-text';
    texto.textContent = textoMensaje;

    const horaElemento = document.createElement('time');
    horaElemento.className = 'message-time';
    horaElemento.textContent = horaMensaje;

    burbuja.append(nombre, texto, horaElemento);
    fila.appendChild(burbuja);
    messages.appendChild(fila);
    messages.scrollTop = messages.scrollHeight;
}

function iniciarConexionWebSocket() {
    socket = new WebSocket('ws://localhost:3000');
    statusText.textContent = 'Conectando...';
    habilitarChat(false);

    socket.onopen = () => {
        statusText.textContent = 'Conectado';
        habilitarChat(true);
        messageInput.focus();
    };

    socket.onmessage = (event) => {
        const mensaje = JSON.parse(event.data);
        agregarMensaje(mensaje);
    };

    socket.onerror = () => {
        statusText.textContent = 'Error de conexión';
        habilitarChat(false);
    };

    socket.onclose = () => {
        statusText.textContent = 'Desconectado';
        habilitarChat(false);
    };
}

async function iniciarSesion(event) {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    mostrarError('');

    if (!email || !password) {
        mostrarError('Ingresa email y contraseña.');
        (!email ? emailInput : passwordInput).focus();
        return;
    }

    try {
        loginBtn.disabled = true;
        await signInWithEmailAndPassword(auth, email, password);

        usernameActual = email.split('@')[0];
        displayUsername.textContent = usernameActual;
        loginContainer.classList.add('d-none');
        chatContainer.classList.remove('d-none');
        iniciarConexionWebSocket();
    } catch (error) {
        mostrarError(error.message);
    } finally {
        loginBtn.disabled = false;
    }
}

function enviarMensaje(event) {
    event.preventDefault();

    const texto = messageInput.value.trim();

    if (!texto || !socket || socket.readyState !== WebSocket.OPEN) {
        return;
    }

    socket.send(JSON.stringify({
        username: usernameActual,
        text: texto,
        timestamp: obtenerHora()
    }));

    messageInput.value = '';
    messageInput.focus();
}

loginBtn.addEventListener('click', iniciarSesion);
loginForm.addEventListener('submit', iniciarSesion);
messageForm.addEventListener('submit', enviarMensaje);

themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('mode-dark');
    document.body.classList.toggle('mode-light', !document.body.classList.contains('mode-dark'));
    document.body.classList.toggle('bg-dark', document.body.classList.contains('mode-dark'));
    document.body.classList.toggle('bg-light', !document.body.classList.contains('mode-dark'));
    actualizarIconoTema();
});

habilitarChat(false);
actualizarIconoTema();
emailInput.focus();
