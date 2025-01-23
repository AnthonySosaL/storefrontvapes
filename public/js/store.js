import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getFirestore, collection, getDocs , doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";
import { API_BASE_URL } from "./config.js";


const firebaseConfig = {
    apiKey: "AIzaSyCCQONgsbGsPb6tske9HIxOJvqRz_cYikg",
    authDomain: "tiendavapes-4458b.firebaseapp.com",
    projectId: "tiendavapes-4458b",
    storageBucket: "tiendavapes-4458b.firebasestorage.app",
    messagingSenderId: "133976223765",
    appId: "1:133976223765:web:2c1580c14cb94b9ba45e1c",
    measurementId: "G-D33T0423S5"
  };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null; // Declarar variable global

const productsList = document.getElementById("productsList");
const resultDiv = document.getElementById("result");
const cartModal = document.getElementById("cartModal");
const btnShowCart = document.getElementById("btnShowCart");
const btnCloseModal = document.getElementById("btnCloseModal");
const cartItemsDiv = document.getElementById("cartItems");
const btnCheckout = document.getElementById("btnCheckout");

btnShowCart.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) {
    alert("Debes iniciar sesión para ver tu carrito.");
    return;
  }

  try {
    // Llamar a la función para cargar el carrito
    await loadCart(user.uid);
    cartModal.style.display = "block"; // Mostrar el modal
  } catch (error) {
    console.error("Error al cargar el carrito:", error.message);
  }
});

btnCloseModal.addEventListener("click", () => {
  cartModal.style.display = "none"; // Ocultar el modal
});

btnCheckout.addEventListener("click", () => {
  // Redirigir al carrito completo
  window.location.href = "cart.html";
});

async function loadCart(uid) {
    try {
      const cartRef = doc(db, "carts", uid);
      const cartSnap = await getDoc(cartRef);
  
      if (!cartSnap.exists()) {
        cartItemsDiv.textContent = "Carrito vacío.";
        return;
      }
  
      let cartData = cartSnap.data();
      if (!cartData.items || cartData.items.length === 0) {
        cartItemsDiv.textContent = "Carrito vacío.";
        return;
      }
  
      // Filtrar y verificar los productos
      const validItems = [];
      const itemsList = await Promise.all(
        cartData.items.map(async (item) => {
          try {
            const productSnap = await getDoc(doc(db, "products", item.productId));
            if (productSnap.exists()) {
              const productData = productSnap.data();
              if (productData.status === "activo") {
                validItems.push(item); // Mantener productos activos en el carrito
                return `
                  <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <img src="${API_BASE_URL}${productData.imagePath || '/default-product.jpg'}" alt="${productData.name}" style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px;">
                    <span>${productData.name} (Cantidad: ${item.quantity})</span>
                  </div>
                `;
              } else {
                console.warn(`Producto inactivo eliminado del carrito: ${item.productId}`);
                return ""; // Producto inactivo no se mostrará
              }
            } else {
              console.warn(`Producto desconocido eliminado del carrito: ${item.productId}`);
              return ""; // Producto inexistente no se mostrará
            }
          } catch (error) {
            console.error(`Error recuperando producto ${item.productId}:`, error);
            return `<div>Error al cargar producto (Cantidad: ${item.quantity})</div>`;
          }
        })
      );
  
      // Si se eliminó algún producto, actualizar el carrito en Firestore
      if (validItems.length !== cartData.items.length) {
        await updateDoc(cartRef, { items: validItems });
      }
  
      cartItemsDiv.innerHTML = itemsList.filter((item) => item !== "").join("");
  
      if (validItems.length === 0) {
        cartItemsDiv.textContent = "Carrito vacío.";
      }
    } catch (error) {
      cartItemsDiv.textContent = "Error cargando carrito: " + error.message;
    }
  }
  
// Escuchar cambios en la autenticación
onAuthStateChanged(auth, (user) => {
    currentUser = user; // Actualizar la variable global
  
    const logoutButton = document.getElementById("logoutButton");
    const cartLink = document.getElementById("cartLink"); // Enlace al carrito en la navbar
  
    // Validar si los elementos existen
    if (logoutButton) {
      logoutButton.style.display = user ? "inline" : "none";
  
      if (user) {
        logoutButton.addEventListener("click", async () => {
          try {
            await signOut(auth);
            alert("Sesión cerrada correctamente");
            window.location.href = "index.html"; // Redirigir a la página principal
          } catch (error) {
            console.error("Error cerrando sesión:", error);
          }
        });
      }
    }
  
    if (cartLink) {
      cartLink.style.display = user ? "inline" : "none";
    }
  
    loadProducts(); // Cargar productos independientemente del estado de sesión
  });
  
  
// Función para cargar los productos
async function loadProducts() {
    try {
      const snapshot = await getDocs(collection(db, "products"));
      productsList.innerHTML = ""; // Limpia la lista
  
      if (snapshot.empty) {
        productsList.textContent = "No hay productos disponibles en la tienda.";
        return;
      }
  
      snapshot.forEach((docSnap) => {
        const prod = docSnap.data();
  
        // Validar si el producto está activo
        if (prod.status !== "activo") {
          return; // Ignorar productos inactivos
        }
  
        const prodDiv = document.createElement("div");
        prodDiv.style.border = "1px solid #ccc";
        prodDiv.style.margin = "10px";
        prodDiv.style.padding = "10px";
  
        // Verificar si el producto tiene stock
        const isOutOfStock = prod.stock === 0;
  
        // Generar el contenido del producto con la imagen
        prodDiv.innerHTML = `
          <img src="${API_BASE_URL}${prod.imagePath || '/default-product.jpg'}" alt="${prod.name}" style="width: 100px; height: 100px; object-fit: cover;">
          <h3>${prod.name}</h3>
          <p>Precio: ${prod.price} | Stock: ${prod.stock}</p>
          <input type="number" id="quantity-${docSnap.id}" value="1" min="1" max="${prod.stock}" ${!currentUser || isOutOfStock ? "disabled" : ""} />
          <button ${!currentUser || isOutOfStock ? "disabled" : ""}>Agregar al carrito</button>
        `;
  
        const btn = prodDiv.querySelector("button");
        if (currentUser && !isOutOfStock) {
          btn.addEventListener("click", () => {
            const quantity = parseInt(
              document.getElementById(`quantity-${docSnap.id}`).value
            );
            addToCart(docSnap.id, quantity, currentUser);
          });
        }
  
        productsList.appendChild(prodDiv);
      });
    } catch (error) {
      console.error("Error cargando productos:", error.message);
      resultDiv.textContent = "Error cargando productos: " + error.message;
    }
  }
  
  
  
  // Función para agregar productos al carrito
  async function addToCart(productId, quantity, user) {
    try {
      const token = await user.getIdToken();
      const resp = await fetch(`${API_BASE_URL}/api/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, quantity }),
      });
  
      const data = await resp.json();
      resultDiv.textContent = data.message;
  
      // Actualizar el carrito después de añadir un producto
      await loadCart(user.uid);
    } catch (error) {
      resultDiv.textContent = "Error al añadir al carrito: " + error.message;
    }
  }