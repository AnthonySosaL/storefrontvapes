import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

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

      const itemsList = await Promise.all(
        data.items.map(async (item) => {
          // Extraer el productId desde el campo correcto
          const productId = item.price_data.product_data.name.split(" ")[1]; // Ajusta según el formato real
          try {
            const productDoc = await getDoc(doc(db, "products", productId));
            if (productDoc.exists()) {
              return `${productDoc.data().name} (Cantidad: ${item.quantity})`;
            } else {
              return `Producto desconocido (Cantidad: ${item.quantity})`;
            }
          } catch (error) {
            console.error(`Error recuperando producto ${productId}:`, error);
            return `Error al cargar producto (Cantidad: ${item.quantity})`;
          }
        })
      );

      const orderDiv = document.createElement("div");
      orderDiv.style.border = "1px solid #ccc";
      orderDiv.style.margin = "10px";
      orderDiv.style.padding = "10px";

      orderDiv.innerHTML = `
        <p>Cliente: ${data.email}</p>
        <p>Estado: ${data.status}</p>
        <p>Productos: ${itemsList.join(", ")}</p>
        <p>Fecha: ${data.createdAt.toDate()}</p>
        <button class="updateStatus" data-id="${docSnap.id}" data-status="enviado">Marcar como Enviado</button>
        <button class="updateStatus" data-id="${docSnap.id}" data-status="entregado">Marcar como Entregado</button>
      `;
      ordersDiv.appendChild(orderDiv);
    }

    attachStatusUpdateHandlers();
  } catch (error) {
    console.error("Error cargando pedidos:", error.message);
    ordersDiv.textContent = "Error cargando pedidos.";
  }
}

// Manejar la actualización del estado
function attachStatusUpdateHandlers() {
  const buttons = document.querySelectorAll(".updateStatus");
  buttons.forEach(button => {
    button.addEventListener("click", async () => {
      const orderId = button.getAttribute("data-id");
      const newStatus = button.getAttribute("data-status");

      try {
        await updateDoc(doc(db, "orders", orderId), { status: newStatus });
        alert(`Estado actualizado a: ${newStatus}`);
        loadOrders(); // Recargar pedidos
      } catch (error) {
        console.error("Error actualizando estado:", error.message);
        alert("Error actualizando el estado.");
      }
    });
  });
}
