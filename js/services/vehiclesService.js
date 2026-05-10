const API_BASE_URL = "http://localhost:8080/api"; //CAMBIAR

export async function getVehiclesByStudentId(studentId) {
  const res = await fetch(`${API_BASE_URL}/vehicles/getVehiclesByStudentId/${studentId}`, {
    credentials: "include",
  });
  return res.json();
}

export async function createVehicle(data) {
  await fetch(`${API_BASE_URL}/vehicles/newVehicle`, {
    credentials: "include",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
