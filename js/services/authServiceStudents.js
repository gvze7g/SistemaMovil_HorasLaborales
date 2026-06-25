// URL base para los endpoints de autenticación de estudiantes
const API_AUTH = "http://localhost:8080/api/studentsAuth";

// Realiza el inicio de sesión con email y password
export async function login({ email, password }) {
  const r = await fetch(`${API_AUTH}/studentLogin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  if (!r.ok) {
    const errText = await r.text().catch(() => "Error desconocido en el servidor.");
    throw new Error(errText);
  }

  return true;
}

// Verifica el estado de autenticación actual
export async function me() {
  const info = await fetch(`${API_AUTH}/meStudent`, {
    method: "GET",
    credentials: "include",
  });

  console.log("Estado de autenticación:", info);

  return info.ok ? info.json() : { authenticated: false };
}

// Cierra la sesión del usuario
export async function logout() {
  try {
    const r = await fetch(`${API_AUTH}/logoutStudent`, {
      method: "POST",
      credentials: "include",
    });

    return r.ok;
  } catch {
    return false;
  }
}

// Cambia la contraseña del estudiante
export async function changePassword(id, oldPassword, newPassword) {
  const r = await fetch(`http://localhost:8080/api/students/changePassword/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ oldPassword, newPassword }),
  });

  if (!r.ok) {
    const errText = await r.json().catch(() => ({ message: "Error desconocido" }));
    throw new Error(errText.message || "Error al cambiar contraseña");
  }

  return await r.json();
}