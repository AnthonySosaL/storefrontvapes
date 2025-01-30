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
const ordersList = document.getElementById("ordersList");

// Verificar autenticación del usuario
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    ordersList.innerHTML = `<tr><td colspan="3" class="text-center">No estás autenticado. Redirigiendo...</td></tr>`;
    setTimeout(() => (window.location.href = "index.html"), 2000);
    return;
  }

  try {
    // Cargar pedidos del usuario autenticado
    await loadUserOrders(user.uid);
  } catch (error) {
    console.error("Error cargando las compras del usuario:", error.message);
    ordersList.innerHTML = `<tr><td colspan="3" class="text-center">Error cargando tus compras.</td></tr>`;
  }
});

// Función para cargar pedidos del usuario autenticado
async function loadUserOrders(userId) {
  const ordersQuery = query(collection(db, "orders"), where("userId", "==", userId));
  const snapshot = await getDocs(ordersQuery);
  ordersList.innerHTML = ""; // Limpiar contenido anterior

  if (snapshot.empty) {
    ordersList.innerHTML = `<tr><td colspan="3" class="text-center">No tienes compras registradas.</td></tr>`;
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

            return `<li>
                      <img src="${imagePath}" alt="${productData.name}" style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px;">
                      <span>${productData.name} (Cantidad: ${item.quantity})</span>
                    </li>`;
          } else {
            return `<li>Producto desconocido (Cantidad: ${item.quantity})</li>`;
          }
        } catch (error) {
          console.error(`Error recuperando producto ${productId}:`, error);
          return `<li>Error al cargar producto (Cantidad: ${item.quantity})</li>`;
        }
      })
    );

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${data.createdAt.toDate().toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}</td>
      <td><span class="status-badge ${data.status}">${data.status}</span></td>
      <td><ul>${itemsList.join("")}</ul></td>
    `;

    ordersList.appendChild(row);
  }
}
