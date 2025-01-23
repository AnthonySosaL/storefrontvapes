import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

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
const db = getFirestore(app);

const btnCreateProduct = document.getElementById("btnCreateProduct");
const btnUpdateProduct = document.getElementById("btnUpdateProduct");
const adminResult = document.getElementById("adminResult");
const productSelect = document.getElementById("productSelect");

// Verificar autenticación
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    adminResult.textContent = "No estás autenticado. Redirigiendo...";
    setTimeout(() => (window.location.href = "index.html"), 2000);
    return;
  }

  const token = await user.getIdTokenResult();
  if (token.claims.role !== "admin") {
    adminResult.textContent = "No tienes permisos de administrador. Redirigiendo...";
    setTimeout(() => (window.location.href = "index.html"), 2000);
  }

  loadProducts(); // Cargar productos al iniciar
  loadPurchasedProducts(); // Cargar productos comprados
});

// Crear producto
btnCreateProduct.addEventListener("click", async () => {
  const name = document.getElementById("prodName").value;
  const price = parseFloat(document.getElementById("prodPrice").value);
  const stock = parseInt(document.getElementById("prodStock").value);

  try {
    await addDoc(collection(db, "products"), { name, price, stock });
    adminResult.textContent = "Producto creado con éxito!";
    loadProducts(); // Actualizar lista
  } catch (error) {
    adminResult.textContent = "Error creando producto: " + error.message;
  }
});

// Editar producto
btnUpdateProduct.addEventListener("click", async () => {
  const selectedProductId = productSelect.value;
  const name = document.getElementById("editProdName").value;
  const price = parseFloat(document.getElementById("editProdPrice").value);
  const stock = parseInt(document.getElementById("editProdStock").value);

  if (!selectedProductId) {
    adminResult.textContent = "Selecciona un producto válido.";
    return;
  }

  try {
    await updateDoc(doc(db, "products", selectedProductId), { name, price, stock });
    adminResult.textContent = "Producto actualizado con éxito!";
    loadProducts(); // Actualizar lista
  } catch (error) {
    adminResult.textContent = "Error actualizando producto: " + error.message;
  }
});

// Cargar productos en el select
async function loadProducts() {
  try {
    const productsSnapshot = await getDocs(collection(db, "products"));
    productSelect.innerHTML = '<option value="">Seleccionar producto</option>';

    productsSnapshot.forEach((doc) => {
      const data = doc.data();
      const option = document.createElement("option");
      option.value = doc.id;
      option.textContent = `${data.name} - $${data.price} (Stock: ${data.stock})`;
      productSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error cargando productos:", error.message);
    adminResult.textContent = "Error cargando productos.";
  }
}

// Cargar productos comprados
async function loadPurchasedProducts() {
  const purchasedProductsDiv = document.getElementById("purchasedProducts");

  try {
    const ordersSnapshot = await getDocs(collection(db, "orders"));
    purchasedProductsDiv.innerHTML = ""; // Limpiar contenido

    ordersSnapshot.forEach((doc) => {
      const data = doc.data();
      const div = document.createElement("div");
      div.textContent = `Cliente: ${data.email}, Productos: ${data.items.length}, Fecha: ${data.createdAt.toDate()}`;
      purchasedProductsDiv.appendChild(div);
    });
  } catch (error) {
    console.error("Error cargando productos comprados:", error.message);
    purchasedProductsDiv.textContent = "Error cargando productos comprados.";
  }
}
