import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

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

// Verificar autenticación
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    ordersDiv.textContent = "No estás autenticado. Redirigiendo...";
    setTimeout(() => (window.location.href = "index.html"), 2000);
    return;
  }

  const token = await user.getIdTokenResult();
  if (token.claims.role !== "admin") {
    ordersDiv.textContent = "No tienes permisos de administrador. Redirigiendo...";
    setTimeout(() => (window.location.href = "index.html"), 2000);
    return;
  }

  loadOrders(); // Cargar pedidos
});

// Cargar pedidos realizados
async function loadOrders() {
  try {
    const snapshot = await getDocs(collection(db, "orders"));
    ordersDiv.innerHTML = ""; // Limpiar contenido anterior

    if (snapshot.empty) {
      ordersDiv.textContent = "No hay pedidos realizados.";
      return;
    }

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      console.log("Pedido recibido:", data);

      const itemsList = await Promise.all(
        data.items.map(async (item) => {
          // Recuperar nombre del producto desde Firebase
          const productId = item.price_data.product_data.name.split(" ")[1]; // Extraer ID del producto
          try {
            const productDoc = await getDoc(doc(db, "products", productId));
            if (productDoc.exists()) {
              return `${productDoc.data().name} (Cantidad: ${item.quantity})`;
            } else {
              return `Producto desconocido (Cantidad: ${item.quantity})`;
            }
          } catch (error) {
            console.error(`Error recuperando producto ${productId}:`, error);
            return `Producto desconocido (Cantidad: ${item.quantity})`;
          }
        })
      );

      const orderDiv = document.createElement("div");
      orderDiv.textContent = `Cliente: ${data.email}, Productos: ${itemsList.join(", ")}, Fecha: ${data.createdAt.toDate()}`;
      ordersDiv.appendChild(orderDiv);
    }
  } catch (error) {
    console.error("Error cargando pedidos:", error.message);
    ordersDiv.textContent = "Error cargando pedidos.";
  }
}

  
