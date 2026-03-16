// URL base para los endpoints de autenticación de instructores
const API_AUTH = "https://sgma-66ec41075156.herokuapp.com/api/studentsAuth";

// Realiza el inicio de sesión con email y password
export async function login({ email, password }) {
  const r = await fetch(`${API_AUTH}/studentLogin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // incluye cookies en la solicitud
    body: JSON.stringify({ email, password }), // credenciales en el cuerpo
  });

 if (!r.ok) {
    const errText = await r.text().catch(() => "Error desconocido en el servidor.");
    throw new Error(errText);
  }

  return true; // devuelve true en caso de éxito
}

// Verifica el estado de autenticación actual
export async function me() {
  const info = await fetch(`${API_AUTH}/meStudent`, {
    credentials: "include"
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
// Si agregas endpoint de logout en el futuro, puedes agregar aquí la lógica correspondiente

