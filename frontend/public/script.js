import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js';
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    signOut,
    onAuthStateChanged
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
const registerContainer = document.getElementById('register-container');
const chatContainer = document.getElementById('chat-container');

const loginForm = document.getElementById('loginForm');
const loginEmailInput = document.getElementById('loginEmailInput');
const loginPasswordInput = document.getElementById('loginPasswordInput');
const loginBtn = document.getElementById('loginBtn');
const showRegisterBtn = document.getElementById('showRegisterBtn');
const loginError = document.getElementById('loginError');

const registerForm = document.getElementById('registerForm');
const registerUsernameInput = document.getElementById('registerUsernameInput');
const registerEmailInput = document.getElementById('registerEmailInput');
const registerPasswordInput = document.getElementById('registerPasswordInput');
const registerBtn = document.getElementById('registerBtn');
const showLoginBtn = document.getElementById('showLoginBtn');
const registerError = document.getElementById('registerError');

const displayUsername = document.getElementById('displayUsername');
const statusText = document.getElementById('status');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const logoutBtn = document.getElementById('logoutBtn');
const messages = document.getElementById('messages');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');

let ws = null;
let currentUsername = '';
let pendingDisplayName = '';

function mostrarContenedor(contenedorActivo) {
    [loginContainer, registerContainer, chatContainer].forEach((container) => {
        container.classList.toggle('d-none', container !== contenedorActivo);
    });
}

function setChatEnabled(enabled) {
    messageInput.disabled = !enabled;
    sendBtn.disabled = !enabled;
}

function getEmailUsername(email) {
    return email.split('@')[0];
}

function setCurrentUser(username) {
    currentUsername = username;
    displayUsername.textContent = username;
}

function limpiarErrores() {
    loginError.textContent = '';
    registerError.textContent = '';
}

function crearBurbujaMensaje({ author, username, autor, displayName, text, message, mensaje, timestamp }) {
    const messageAuthor = author || username || autor || displayName || 'Usuario';
    const messageText = text || message || mensaje || '';
    const isOwnMessage = messageAuthor === currentUsername;

    const row = document.createElement('div');
    row.className = `message-row ${isOwnMessage ? 'msg-left' : 'msg-right'}`;

    const bubble = document.createElement('article');
    bubble.className = 'message-bubble';

    const authorElement = document.createElement('span');
    authorElement.className = 'message-author';
    authorElement.textContent = messageAuthor;

    const textElement = document.createElement('p');
    textElement.className = 'message-text';
    textElement.textContent = messageText;

    const timeElement = document.createElement('time');
    timeElement.className = 'message-time';
    timeElement.textContent = timestamp || '';

    bubble.append(authorElement, textElement, timeElement);
    row.appendChild(bubble);

    return row;
}

function agregarMensaje(data) {
    messages.appendChild(crearBurbujaMensaje(data));
    messages.scrollTop = messages.scrollHeight;
}

function iniciarConexionWebSocket() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        return;
    }

    ws = new WebSocket('ws://localhost:3000');
    statusText.textContent = 'Conectando...';
    setChatEnabled(false);

    ws.onopen = () => {
        statusText.textContent = 'Conectado';
        setChatEnabled(true);
        messageInput.focus();
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        agregarMensaje(data);
    };

    ws.onerror = () => {
        statusText.textContent = 'Error de conexion';
        setChatEnabled(false);
    };

    ws.onclose = () => {
        statusText.textContent = 'Desconectado';
        setChatEnabled(false);
        ws = null;
    };
}

async function registrarUsuario(event) {
    event.preventDefault();
    limpiarErrores();

    const username = registerUsernameInput.value.trim();
    const email = registerEmailInput.value.trim();
    const password = registerPasswordInput.value.trim();

    if (!username || !email || !password) {
        registerError.textContent = 'Completa nombre de usuario, correo y contraseña.';
        return;
    }

    try {
        registerBtn.disabled = true;
        pendingDisplayName = username;
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, { displayName: username });
    } catch (error) {
        pendingDisplayName = '';
        registerError.textContent = error.message;
    } finally {
        registerBtn.disabled = false;
    }
}

async function iniciarSesion(event) {
    event.preventDefault();
    limpiarErrores();

    const email = loginEmailInput.value.trim();
    const password = loginPasswordInput.value.trim();

    if (!email || !password) {
        loginError.textContent = 'Ingresa correo y contraseña.';
        return;
    }

    try {
        loginBtn.disabled = true;
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        loginError.textContent = error.message;
    } finally {
        loginBtn.disabled = false;
    }
}

function enviarMensaje(event) {
    event.preventDefault();

    const text = messageInput.value.trim();

    if (!text || !ws || ws.readyState !== WebSocket.OPEN) {
        return;
    }

    ws.send(JSON.stringify({
        username: currentUsername,
        text
    }));

    messageInput.value = '';
    messageInput.focus();
}

function handleAuthenticatedUser(user) {
    const username = user.displayName || pendingDisplayName || getEmailUsername(user.email || '');

    limpiarErrores();
    pendingDisplayName = '';
    setCurrentUser(username);
    mostrarContenedor(chatContainer);
    iniciarConexionWebSocket();
}

function handleSignedOutUser() {
    currentUsername = '';
    pendingDisplayName = '';
    displayUsername.textContent = '';
    messages.innerHTML = '';
    loginForm.reset();
    registerForm.reset();
    limpiarErrores();
    setChatEnabled(false);
    statusText.textContent = 'Desconectado';
    mostrarContenedor(loginContainer);
    loginEmailInput.focus();
}

function alternarTema() {
    const isDark = document.body.classList.toggle('mode-dark');
    document.body.classList.toggle('mode-light', !isDark);
    document.body.classList.toggle('bg-dark', isDark);
    document.body.classList.toggle('bg-light', !isDark);
    document.documentElement.setAttribute('data-bs-theme', isDark ? 'dark' : 'light');
    themeToggleBtn.textContent = isDark ? 'Modo claro' : 'Modo oscuro';
}

showRegisterBtn.addEventListener('click', () => {
    limpiarErrores();
    mostrarContenedor(registerContainer);
    registerUsernameInput.focus();
});

showLoginBtn.addEventListener('click', () => {
    limpiarErrores();
    mostrarContenedor(loginContainer);
    loginEmailInput.focus();
});

loginBtn.addEventListener('click', iniciarSesion);
registerBtn.addEventListener('click', registrarUsuario);
loginForm.addEventListener('submit', iniciarSesion);
registerForm.addEventListener('submit', registrarUsuario);
messageForm.addEventListener('submit', enviarMensaje);
themeToggleBtn.addEventListener('click', alternarTema);
logoutBtn.addEventListener('click', () => {
    if (ws) {
        ws.close();
    }

    return signOut(auth);
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        handleAuthenticatedUser(user);
        return;
    }

    handleSignedOutUser();
});

setChatEnabled(false);
