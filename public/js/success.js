import { API_BASE_URL } from "./config.js";

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");
  const resultDiv = document.getElementById("result");

  if (!sessionId) {
    resultDiv.innerHTML = "<p class='error-message'>No se encontró un ID de sesión válido.</p>";
    return;
  }

  try {
    // Llamar al backend para verificar la sesión y guardar la compra
    const response = await fetch(`${API_BASE_URL}/api/checkout/verify-session?session_id=${sessionId}`);
    const data = await response.json();

    if (data.success) {
      resultDiv.innerHTML = `
        <p class="success-text">Tu compra ha sido procesada exitosamente.</p>
      `;
    } else if (data.message === "Pedido ya procesado.") {
      resultDiv.innerHTML = `
        <p class="success-text">Tu compra ya ha sido registrada previamente. Gracias por tu preferencia.</p>
      `;
    } else {
      resultDiv.innerHTML = `<p class="error-message">Error: ${data.error}</p>`;
    }
  } catch (error) {
    console.error("Error verificando la sesión:", error.message);
    resultDiv.innerHTML = "<p class='error-message'>Ocurrió un error al verificar tu compra. Por favor, inténtalo de nuevo.</p>";
  }
});
