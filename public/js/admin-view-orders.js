import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

// Configuración de Firebase (igual que antes)
const firebaseConfig = {
    apiKey: "AIzaSyCCQONgsbGsPb6tske9HIxOJvqRz_cYikg",
    authDomain: "tiendavapes-4458b.firebaseapp.com",
    projectId: "tiendavapes-4458b",
    storageBucket: "tiendavapes-4458b.firebasestorage.app",
    messagingSenderId: "133976223765",
    appId: "1:133976223765:web:2c1580c14cb94b9ba45e1c",
    measurementId: "G-D33T0423S5",
};

// Inicialización de Firebase (igual que antes)
let app;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApps()[0];
}

const auth = getAuth(app);
const db = getFirestore(app);

const ordersList = document.getElementById("ordersList");

// Verificación de autenticación (igual que antes)
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "index.html";
        return;
    }

    const token = await user.getIdTokenResult();
    if (token.claims.role !== "admin") {
        window.location.href = "index.html";
        return;
    }

    loadOrders();
});

// Función para cargar pedidos (modificada para tabla)
async function loadOrders() {
    try {
        const snapshot = await getDocs(collection(db, "orders"));
        ordersList.innerHTML = "";

        if (snapshot.empty) {
            ordersList.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">No hay pedidos realizados</td>
                </tr>
            `;
            return;
        }

        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            const row = document.createElement("tr");
            
            // Formatear fecha
            const orderDate = data.createdAt.toDate().toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            // Obtener nombres de productos
            const itemsList = await Promise.all(
                data.items.map(async (item) => {
                    const productId = item.price_data.product_data.name.split(" ")[1];
                    try {
                        const productDoc = await getDoc(doc(db, "products", productId));
                        return productDoc.exists() ? 
                            `${productDoc.data().name} x${item.quantity}` : 
                            `Producto no disponible x${item.quantity}`;
                    } catch (error) {
                        console.error(`Error con producto ${productId}:`, error);
                        return `Error x${item.quantity}`;
                    }
                })
            );

            // Crear fila de tabla
            row.innerHTML = `
                <td>${data.email}</td>
                <td>${itemsList.join(", ")}</td>
                <td>${orderDate}</td>
                <td><span class="status-badge ${data.status}">${data.status}</span></td>
            `;

            ordersList.appendChild(row);
        }
    } catch (error) {
        console.error("Error cargando pedidos:", error);
        ordersList.innerHTML = `
            <tr>
                <td colspan="4" class="result-message error">Error cargando pedidos</td>
            </tr>
        `;
    }
}