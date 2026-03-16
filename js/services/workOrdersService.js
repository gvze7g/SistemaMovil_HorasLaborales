const API_BASE_URL = "https://sgma-66ec41075156.herokuapp.com/api";


export async function getOrdersById2() {
  const res = await fetch(`${API_BASE_URL}/getWorkOrdersByStudentIdAndStatus2/{studentId}`, {
    credentials: "include",
  });
  return res.json();
}

export async function getOrdersById3() {
  const res = await fetch(`${API_BASE_URL}/getWorkOrdersByStudentIdAndStatus3/{studentId}`, {
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
