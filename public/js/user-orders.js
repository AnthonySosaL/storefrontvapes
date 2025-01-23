import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, getDoc, query, where } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";
import { API_BASE_URL } from "./config.js";
// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCCQONgsbGsPb6tske9HIxOJvqRz_cYikg",
  authDomain: "tiendavapes-4458b.firebaseapp.com",
  projectId: "tiendavapes-4458b",
  storageBucket: "tiendavapes-4458b.firebasestorage.app",
  messagingSenderId: "133976223765",
  appId: "1:133976223765:web:2c1580c14cb94b9ba45e1c",
  measurementId: "G-D33T0423S5",
};

// Inicializar Firebase si no está inicializado
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth = getAuth(app);
const db = getFirestore(app);
const ordersDiv = document.getElementById("ordersList");

// Verificar autenticación del usuario
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    ordersDiv.textContent = "No estás autenticado. Redirigiendo...";
    setTimeout(() => (window.location.href = "index.html"), 2000);
    return;
  }

  try {
    // Cargar pedidos del usuario autenticado
    await loadUserOrders(user.uid);
  } catch (error) {
    console.error("Error cargando las compras del usuario:", error.message);
    ordersDiv.textContent = "Error cargando tus compras.";
  }
});

// Cargar pedidos del usuario autenticado
async function loadUserOrders(userId) {
  const ordersQuery = query(collection(db, "orders"), where("userId", "==", userId));
  const snapshot = await getDocs(ordersQuery);
  ordersDiv.innerHTML = ""; // Limpiar contenido anterior

  if (snapshot.empty) {
    ordersDiv.textContent = "No tienes compras registradas.";
    return;
  }

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
  
    // Obtener detalles de los productos desde Firestore
    const itemsList = await Promise.all(
      data.items.map(async (item) => {
        const productId = item.price_data.product_data.name.split(" ")[1]; // Extraer ID del producto
        try {
          const productDoc = await getDoc(doc(db, "products", productId));
          if (productDoc.exists()) {
            const productData = productDoc.data();
            const imagePath = productData.imagePath
              ? `${API_BASE_URL}${productData.imagePath}` // Construir enlace completo
              : `${API_BASE_URL}/default-product.jpg`; // Imagen por defecto
  
            console.log(`Recuperado producto: ${productData.name}, Imagen: ${imagePath}`); // Log para verificar
  
            return `
              <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <img src="${imagePath}" alt="${productData.name}" style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px;">
                <span>${productData.name} (Cantidad: ${item.quantity})</span>
              </div>
            `;
          } else {
            return `<div>Producto desconocido (Cantidad: ${item.quantity})</div>`;
          }
        } catch (error) {
          console.error(`Error recuperando producto ${productId}:`, error);
          return `<div>Error al cargar producto (Cantidad: ${item.quantity})</div>`;
        }
      })
    );
  
    const orderDiv = document.createElement("div");
    orderDiv.style.border = "1px solid #ccc";
    orderDiv.style.margin = "10px";
    orderDiv.style.padding = "10px";
  
    orderDiv.innerHTML = `
      <p>Estado: ${data.status}</p>
      <p>Fecha de compra: ${data.createdAt.toDate()}</p>
      <p>Productos:</p>
      <ul>
        ${itemsList.join("")}
      </ul>
    `;
    ordersDiv.appendChild(orderDiv);
  }
  
}

