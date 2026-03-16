const API_BASE_URL = "https://sgma-66ec41075156.herokuapp.com/api";

export async function createVehicle(payload) {
  await fetch(`${API_BASE_URL}/vehicles/newVehicle`, {
    credentials: "include",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}