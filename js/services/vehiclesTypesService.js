const API_BASE_URL = "http://localhost:8080/api"; //CAMBIAR

export async function getVehiclesTypes() {
  const res = await fetch(`${API_BASE_URL}/vehicleTypes/getAllVehiclesTypes`, {
    credentials: "include",
  });
  return res.json();
}
