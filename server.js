// frontend/server.js
const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// Servir la carpeta "public"
app.use(express.static(path.join(__dirname, "public")));

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Frontend corriendo en http://localhost:${PORT}`);
});
