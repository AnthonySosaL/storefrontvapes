import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { API_BASE_URL } from "./config.js";

const firebaseConfig = {
  apiKey: "AIzaSyCCQONgsbGsPb6tske9HIxOJvqRz_cYikg",
  authDomain: "tiendavapes-4458b.firebaseapp.com",
  projectId: "tiendavapes-4458b",
  storageBucket: "tiendavapes-4458b.firebasestorage.app",
  messagingSenderId: "133976223765",
  appId: "1:133976223765:web:2c1580c14cb94b9ba45e1c",
  measurementId: "G-D33T0423S5",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.addEventListener("DOMContentLoaded", () => {
  const btnCreateProduct = document.getElementById("btnCreateProduct");
  const resultDiv = document.getElementById("adminResult");

  // Verificar autenticación
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      resultDiv.textContent = "No estás autenticado. Redirigiendo...";
      setTimeout(() => (window.location.href = "index.html"), 2000);
      return;
    }

    const token = await user.getIdTokenResult();
    if (token.claims.role !== "admin") {
      resultDiv.textContent = "No tienes permisos de administrador. Redirigiendo...";
      setTimeout(() => (window.location.href = "index.html"), 2000);
      return;
    }
  });

  // Crear producto y subir imagen
  btnCreateProduct.addEventListener("click", async () => {
    const name = document.getElementById("prodName").value;
    const price = parseFloat(document.getElementById("prodPrice").value);
    const stock = parseInt(document.getElementById("prodStock").value);
    const status = document.getElementById("prodStatus").value;
    const imageFile = document.getElementById("prodImage").files[0];

    if (!name || isNaN(price) || isNaN(stock) || !status || !imageFile) {
      resultDiv.textContent = "Por favor, llena todos los campos correctamente.";
      return;
    }

    try {
      // Paso 1: Subir la imagen al backend
      const formData = new FormData();
      formData.append("image", imageFile);

      const uploadRes = await fetch(`${API_BASE_URL}/api/uploadRoutes/upload`, {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error(uploadData.message || "Error subiendo la imagen");
      }

      // Obtener el `imagePath` de la respuesta
      const imagePath = uploadData.imagePath;

      // Paso 2: Enviar los datos del producto junto con el `imagePath` a la API de creación
      const productRes = await fetch(`${API_BASE_URL}/api/createRoutes/createProduct`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, price, stock, status, imagePath }),
      });

      const productData = await productRes.json();

      if (!productRes.ok) {
        throw new Error(productData.message || "Error creando el producto");
      }

      // Mostrar éxito y limpiar el formulario
      resultDiv.textContent = "Producto creado con éxito!";
      document.getElementById("prodName").value = "";
      document.getElementById("prodPrice").value = "";
      document.getElementById("prodStock").value = "";
      document.getElementById("prodImage").value = "";
      document.getElementById("prodStatus").value = "activo";
    } catch (error) {
      resultDiv.textContent = "Error: " + error.message;
    }
  });
});
