//CAMBIAR
const API_AUTH = "http://localhost:8080/api/instructorsAuth";
const API_INSTRUCTORS = "http://localhost:8080/api/instructors";

// Login de instructor
export async function login({ email, password }) {
  const r = await fetch(`${API_AUTH}/instructorLogin`, {
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

// Verifica la sesión del instructor
export async function me() {
  const info = await fetch(`${API_AUTH}/meInstructor`, {
    credentials: "include"
  });

    console.log("Estado de autenticación:", info);

  return info.ok ? info.json() : { authenticated: false };
}

//  Cierra la sesión del instructor
export async function logoutInstructor() {
  try {
    const r = await fetch(`${API_AUTH}/logoutInstructor`, {
      method: "POST",
      credentials: "include",
    });
    return r.ok;
  } catch {
    return false;
  }
}

//  Cambio de contraseña
export async function changePassword(instructorId, oldPassword, newPassword) {
  const r = await fetch(`http://localhost:8080/api/instructors/changePassword/${instructorId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ oldPassword, newPassword }),
  });

  if (!r.ok) {
      const errText = await r.json().catch(() => ({ message: "Error al cambiar contraseña" }));
      throw new Error(errText.message || "Error al cambiar contraseña");
  }
  return await r.json();
}
