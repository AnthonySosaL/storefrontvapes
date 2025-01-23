// js/navbarLoader.js
export async function loadNavbar() {
    try {
      const response = await fetch("./components/navbar-user.html");
      if (!response.ok) {
        throw new Error("Error cargando el navbar: " + response.statusText);
      }
      const html = await response.text();
      document.getElementById("navbar").innerHTML = html;
    } catch (error) {
      console.error("Error al cargar el navbar:", error.message);
      document.getElementById("navbar").innerHTML = "<p>Error al cargar el menú de navegación.</p>";
    }
  }
  