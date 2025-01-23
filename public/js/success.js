import { API_BASE_URL } from "./config.js";

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");
  const resultDiv = document.getElementById("result");

  if (!sessionId) {
    resultDiv.textContent = "No se encontró un ID de sesión válido.";
    return;
  }

  try {
    // Llamar al backend para verificar la sesión y guardar la compra
    const response = await fetch(`${API_BASE_URL}/api/checkout/verify-session?session_id=${sessionId}`);
    const data = await response.json();

    if (data.success) {
      resultDiv.innerHTML = `
        <h2>¡Gracias por tu compra!</h2>
        <p>Tu compra se ha procesado exitosamente.</p>
        <a href="index.html">Volver a la tienda</a>
      `;
    } else if (data.message === "Pedido ya procesado.") {
      resultDiv.innerHTML = `
        <h2>Compra ya procesada</h2>
        <p>Tu compra ya ha sido registrada previamente. Gracias por tu preferencia.</p>
        <a href="index.html">Volver a la tienda</a>
      `;
    } else {
      resultDiv.textContent = `Error: ${data.error}`;
    }
  } catch (error) {
    console.error("Error verificando la sesión:", error.message);
    resultDiv.textContent = "Ocurrió un error al verificar tu compra. Por favor, inténtalo de nuevo.";
  }
});
