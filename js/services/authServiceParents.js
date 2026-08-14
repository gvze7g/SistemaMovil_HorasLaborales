// URL base para los endpoints de autenticación de papás/mamás
const API_AUTH = "http://localhost:8080/api/parentsAuth";

// Inicia sesión con email y password
export async function login({ email, password }) {
  const r = await fetch(`${API_AUTH}/parentLogin`, {
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

// Crea la cuenta de papá/mamá y deja la sesión iniciada
export async function register({ firstName, lastName, email, password, dui }) {
  const r = await fetch(`${API_AUTH}/registerParent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ firstName, lastName, email, password, dui }),
  });

  if (!r.ok) {
    const errText = await r.text().catch(() => "Error desconocido en el servidor.");
    throw new Error(errText);
  }

  return true;
}

// Verifica el estado de autenticación actual
export async function me() {
  const info = await fetch(`${API_AUTH}/meParent`, {
    method: "GET",
    credentials: "include",
  });

  return info.ok ? info.json() : { authenticated: false };
}

// Cierra la sesión del papá/mamá
export async function logout() {
  try {
    const r = await fetch(`${API_AUTH}/logoutParent`, {
      method: "POST",
      credentials: "include",
    });

    return r.ok;
  } catch {
    return false;
  }
}
