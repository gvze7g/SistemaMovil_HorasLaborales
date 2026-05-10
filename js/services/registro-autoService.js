const API_BASE_URL = "http://localhost:8080/api"; //CAMBIAR

export async function createVehicle(payload) {
  await fetch(`${API_BASE_URL}/vehicles/newVehicle`, {
    credentials: "include",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}