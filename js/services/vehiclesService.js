const API_BASE_URL = "https://sgma-66ec41075156.herokuapp.com/api";

export async function getVehiclesByStudentId(studentId) {
  const res = await fetch(`${API_BASE_URL}/getVehiclesByStudentId/${studentId}`, {
    credentials: "include",
  });
  return res.json();
}

export async function createVehicle(data) {
  await fetch(`${API_BASE_URL}/newVehicle`, {
    credentials: "include",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
