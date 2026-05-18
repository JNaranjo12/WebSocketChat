//Invocar dotenv en la primera línea para cargar las variables
require('dotenv').config();

const express = require('express');
const WebSocket = require('ws');
const admin = require('firebase-admin');
let serviceAccount;

if (process.env.GOOGLE_CREDENTIALS) {
  // Si estamos en Render, leemos la variable de entorno
  serviceAccount = JSON.parse(process.env.GOOGLE_CREDENTIALS);
} else {
  // Si estamos en desarrollo local, leemos el archivo físico
  serviceAccount = require('./firebase-key.json');
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const app = express();
// Leer la variable de entorno
const port = process.env.PORT;

// Servir archivos estáticos
app.use(express.static('public'));

// Crear servidor HTTP
const server = app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
});

// Crear servidor WebSocket
//const wss = new WebSocket.Server({ server }); -> Reemplazamos esta línea por las siguientes para agregar validación de origen

// Leer el dominio permitido desde las variables de entorno
const allowedOrigin = process.env.ALLOWED_ORIGIN;
// Crear servidor WebSocket con validación de origen
const wss = new WebSocket.Server({ 
  server,
  verifyClient: (info, callback) => {
    // Capturar desde dónde intenta conectarse el cliente
    const origin = info.req.headers.origin;

    if (origin === allowedOrigin) {
      // Si el origen coincide, dejamos pasar la conexión (true)
      callback(true);
    } else {
      // Si es un intruso, imprimimos una alerta y rechazamos la conexión con error 403 (Prohibido)
      console.warn(`⚠️ Intento de conexión bloqueado desde origen no autorizado: ${origin}`);
      callback(false, 403, 'Forbidden');
    }
  }
});

// Almacenar conexiones activas
const clients = new Set();

wss.on('connection', async (ws, req) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const token = requestUrl.searchParams.get('token');

  if (!token) {
    ws.close(1008, 'Token ausente');
    return;
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    ws.user = decodedToken.name || decodedToken.email;
  } catch (error) {
    console.error('JWT invalido:', error);
    ws.close(1008, 'Firma JWT inválida');
    return;
  }

  clients.add(ws);
  console.log(`Cliente autenticado: ${ws.user}. Total:`, clients.size);

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);
      const serverTimestamp = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      const outgoingMessage = {
        username: ws.user,
        text: message.text,
        timestamp: serverTimestamp
      };
      
      // Reenviar mensaje a todos los clientes conectados
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(outgoingMessage));
        }
      });

      await db.collection('mensajes').add({
        username: ws.user,
        text: message.text,
        timeString: serverTimestamp,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Error procesando mensaje:', error);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('Cliente desconectado. Total:', clients.size);
  });

  ws.on('error', (error) => {
    console.error('Error WebSocket:', error);
    clients.delete(ws);
  });
});
