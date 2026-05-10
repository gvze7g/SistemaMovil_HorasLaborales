const API_BASE_URL = 'http://localhost:8080'; //CAMBIAR!!


export async function getOrdersById2(studentId) {
  const res = await fetch(`${API_BASE_URL}/getWorkOrdersByStudentIdAndStatus3/${studentId}`, {
    credentials: "include",
  });
  return res.json();
}

export async function getOrdersById3(studentId) {
  const res = await fetch(`${API_BASE_URL}/getWorkOrdersByStudentIdAndStatus4/${studentId}`, {
    credentials: "include",
  });
  return res.json();
}

export async function createWorkOrder(data) {
  await fetch(`${API_BASE_URL}/newWorkOrder`, {
    credentials: "include",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
