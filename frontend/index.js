const express = require('express');
const app = express();
const PORT = 3001;
// Servir archivos estáticos desde la carpeta "public"
app.use(express.static('public'));
// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor frontend corriendo en http://localhost:${PORT}`);
});
