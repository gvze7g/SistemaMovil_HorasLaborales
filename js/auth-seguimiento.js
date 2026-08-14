import { login, register, me } from "./services/authServiceParents.js";

document.addEventListener("DOMContentLoaded", async () => {
  // Si ya hay sesión de papá/mamá iniciada, saltar directo al seguimiento
  try {
    const info = await me();
    if (info.authenticated) {
      window.location.href = "seguimiento.html";
      return;
    }
  } catch (_) {}

  const tabLogin = document.getElementById("tabLogin");
  const tabRegister = document.getElementById("tabRegister");
  const formLogin = document.getElementById("formLogin");
  const formRegister = document.getElementById("formRegister");

  function showLogin() {
    tabLogin.classList.add("activa");
    tabRegister.classList.remove("activa");
    tabLogin.setAttribute("aria-selected", "true");
    tabRegister.setAttribute("aria-selected", "false");
    formLogin.style.display = "flex";
    formRegister.style.display = "none";
  }

  function showRegister() {
    tabRegister.classList.add("activa");
    tabLogin.classList.remove("activa");
    tabRegister.setAttribute("aria-selected", "true");
    tabLogin.setAttribute("aria-selected", "false");
    formRegister.style.display = "flex";
    formLogin.style.display = "none";
  }

  tabLogin.addEventListener("click", showLogin);
  tabRegister.addEventListener("click", showRegister);

  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
      Swal.fire("Datos incompletos", "Ingresa tu correo y contraseña.", "warning");
      return;
    }

    const btn = document.getElementById("loginBtn");
    const originalText = btn.textContent;
    try {
      btn.disabled = true;
      btn.textContent = "Iniciando sesión...";
      await login({ email, password });
      window.location.href = "seguimiento.html";
    } catch (error) {
      Swal.fire("Error", error.message || "No se pudo iniciar sesión.", "error");
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });

  formRegister.addEventListener("submit", async (e) => {
    e.preventDefault();
    const firstName = document.getElementById("registerFirstName").value.trim();
    const lastName = document.getElementById("registerLastName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const dui = document.getElementById("registerDui").value.trim();
    const password = document.getElementById("registerPassword").value;
    const passwordConfirm = document.getElementById("registerPasswordConfirm").value;

    if (!firstName || !lastName || !email || !dui || !password || !passwordConfirm) {
      Swal.fire("Datos incompletos", "Completa todos los campos para crear tu cuenta.", "warning");
      return;
    }

    if (!/^[0-9]{8}-[0-9]$/.test(dui)) {
      Swal.fire("DUI inválido", "El formato del DUI debe ser 12345678-9.", "warning");
      return;
    }

    if (password.length < 8) {
      Swal.fire("Contraseña muy corta", "La contraseña debe tener al menos 8 caracteres.", "warning");
      return;
    }

    if (password !== passwordConfirm) {
      Swal.fire("Las contraseñas no coinciden", "Verifica que ambas contraseñas sean iguales.", "warning");
      return;
    }

    const btn = document.getElementById("registerBtn");
    const originalText = btn.textContent;
    try {
      btn.disabled = true;
      btn.textContent = "Creando cuenta...";
      await register({ firstName, lastName, email, password, dui });
      window.location.href = "seguimiento.html";
    } catch (error) {
      Swal.fire("Error", error.message || "No se pudo crear la cuenta.", "error");
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
});
