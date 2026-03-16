const API_AUTH = "https://sgma-66ec41075156.herokuapp.com/api/instructorsAuth";
const API_INSTRUCTORS = "https://sgma-66ec41075156.herokuapp.com/api/instructors";

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

//  Cambio de contraseña (opcional)
export async function changePassword(instructorId, newPassword) {
  const r = await fetch(`${API_INSTRUCTORS}/update/${instructorId}/password`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ password: newPassword }),
  });

  if (!r.ok) throw new Error(await r.text().catch(() => "Error al cambiar contraseña"));
  return r.json();
}
