//Invocar dotenv en la primera línea para cargar las variables
require('dotenv').config();

const express = require('express');
const WebSocket = require('ws');

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
const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:3001';
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

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('Cliente conectado. Total:', clients.size);

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      const timestamp = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      const outgoingMessage = {
        username: message.username,
        text: message.text,
        timestamp
      };
      
      // Reenviar mensaje a todos los clientes conectados
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(outgoingMessage));
        }
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
