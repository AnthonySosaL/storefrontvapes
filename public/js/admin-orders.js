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

  loadOrders();
});

// Cargar pedidos realizados
async function loadOrders() {
  try {
    const snapshot = await getDocs(collection(db, "orders"));
    ordersDiv.innerHTML = `
      <div class="table-responsive">
        <table class="orders-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Productos</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="ordersTableBody"></tbody>
        </table>
      </div>
    `;

    const tbody = document.getElementById("ordersTableBody");

    if (snapshot.empty) {
      tbody.innerHTML = `<tr><td colspan="5">No hay pedidos realizados.</td></tr>`;
      return;
    }

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();

      const itemsList = await Promise.all(
        data.items.map(async (item) => {
          const productId = item.price_data.product_data.name.split(" ")[1];
          try {
            const productDoc = await getDoc(doc(db, "products", productId));
            if (productDoc.exists()) {
              return `${productDoc.data().name} x${item.quantity}`;
            } else {
              return `Producto desconocido x${item.quantity}`;
            }
          } catch {
            return `Error al cargar producto x${item.quantity}`;
          }
        })
      );

      const row = `
        <tr>
          <td>${data.email}</td>
          <td>${itemsList.join("\n")}</td> <!-- Cada producto en una nueva línea -->
          <td><span class="status-badge ${data.status}">${data.status}</span></td>
          <td>${data.createdAt.toDate()}</td>
          <td>
            <button class="btn-action updateStatus" data-id="${docSnap.id}" data-status="enviado">Enviar</button>
            <button class="btn-action updateStatus" data-id="${docSnap.id}" data-status="entregado">Entregar</button>
          </td>
        </tr>
      `;
      tbody.insertAdjacentHTML("beforeend", row);
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
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const orderId = button.getAttribute("data-id");
      const newStatus = button.getAttribute("data-status");

      // Mostrar el modal de confirmación
      const confirmationModal = new bootstrap.Modal(document.getElementById("confirmationModal"));
      confirmationModal.show();

      // Asignar evento al botón de confirmación dentro del modal
      const confirmButton = document.getElementById("confirmActionButton");
      confirmButton.onclick = async () => {
        try {
          await updateDoc(doc(db, "orders", orderId), { status: newStatus });
          loadOrders(); // Recargar pedidos
          confirmationModal.hide(); // Cerrar el modal
        } catch (error) {
          console.error("Error actualizando estado:", error.message);
          alert("Error actualizando el estado."); // O puedes manejarlo de forma diferente
        }
      };
    });
  });
}

