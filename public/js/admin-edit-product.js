import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";
import { API_BASE_URL } from "./config.js"; // URL base de tu backend

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCCQONgsbGsPb6tske9HIxOJvqRz_cYikg",
  authDomain: "tiendavapes-4458b.firebaseapp.com",
  projectId: "tiendavapes-4458b",
  storageBucket: "tiendavapes-4458b.firebaseapp.com",
  messagingSenderId: "133976223765",
  appId: "1:133976223765:web:2c1580c14cb94b9ba45e1c",
  measurementId: "G-D33T0423S5",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Elementos del DOM
const productSelect = document.getElementById("productSelect");
const btnUpdateProduct = document.getElementById("btnUpdateProduct");
const resultDiv = document.getElementById("adminResult");

// Verificar autenticación del usuario
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

  loadProducts(); // Cargar productos al iniciar
});

// Función para cargar productos en el selector
async function loadProducts() {
  try {
    const snapshot = await getDocs(collection(db, "products"));
    productSelect.innerHTML = '<option value="">Seleccionar producto</option>';
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const option = document.createElement("option");
      option.value = docSnap.id;
      option.textContent = data.name;
      productSelect.appendChild(option);
    });
    resultDiv.textContent = "Productos cargados correctamente.";
  } catch (error) {
    console.error("Error cargando productos:", error.message);
    resultDiv.textContent = "Error cargando productos.";
  }
}

// Evento para cargar datos del producto seleccionado
productSelect.addEventListener("change", async () => {
  const selectedProductId = productSelect.value;
  if (!selectedProductId) return;

  try {
    const productRef = doc(db, "products", selectedProductId);
    const productSnap = await getDoc(productRef);

    if (productSnap.exists()) {
      const data = productSnap.data();
      document.getElementById("editProdName").value = data.name || "";
      document.getElementById("editProdPrice").value = data.price || 0;
      document.getElementById("editProdStock").value = data.stock || 0;
      document.getElementById("currentImage").src = `${API_BASE_URL}${data.imagePath || ""}`;
      document.getElementById("editProdStatus").value = data.status || "activo";
      resultDiv.textContent = "Datos del producto cargados.";
    } else {
      resultDiv.textContent = "El producto seleccionado no existe.";
    }
  } catch (error) {
    console.error("Error cargando producto:", error.message);
    resultDiv.textContent = "Error cargando producto.";
  }
});

// Evento para actualizar el producto y/o la imagen
btnUpdateProduct.addEventListener("click", async () => {
  const selectedProductId = productSelect.value;
  const name = document.getElementById("editProdName").value;
  const price = parseFloat(document.getElementById("editProdPrice").value);
  const stock = parseInt(document.getElementById("editProdStock").value);
  const status = document.getElementById("editProdStatus").value;
  const imageFile = document.getElementById("editProdImage").files[0];

  if (!selectedProductId) {
    resultDiv.textContent = "Selecciona un producto válido.";
    return;
  }

  if (!name || isNaN(price) || isNaN(stock)) {
    resultDiv.textContent = "Por favor, llena todos los campos correctamente.";
    return;
  }

  try {
    // Enviar datos al backend para actualización
    const response = await fetch(`${API_BASE_URL}/api/updateRoutes/updateinformation`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ productId: selectedProductId, name, price, stock, status }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Error actualizando producto");
    }

    // Subir una nueva imagen si fue seleccionada
    if (imageFile) {
      const formData = new FormData();
      formData.append("productId", selectedProductId);
      formData.append("image", imageFile);

      const imageResponse = await fetch(`${API_BASE_URL}/api/uploadRoutes/updateImage`, {
        method: "PUT",
        body: formData,
      });

      const imageData = await imageResponse.json();

      if (!imageResponse.ok) {
        throw new Error(imageData.message || "Error actualizando imagen");
      }

      // Actualizar la vista de la imagen actual
      document.getElementById("currentImage").src = `${API_BASE_URL}${imageData.imagePath}`;
    }

    resultDiv.textContent = "Producto actualizado con éxito!";
  } catch (error) {
    console.error("Error actualizando producto:", error.message);
    resultDiv.textContent = "Error actualizando producto: " + error.message;
  }
});
