const API_BASE_URL = "https://sgma-66ec41075156.herokuapp.com/api";

export async function getVehiclesTypes() {
  const res = await fetch(`${API_BASE_URL}/vehicleTypes/getAllVehiclesTypes`, {
    credentials: "include",
  });
  return res.json();
}
