const API_BASE_URL = "http://localhost:8080/api"; //CAMBIAR

export async function getAllStudents() {
  const res = await fetch(`${API_BASE_URL}/students/getAllStudents`, {
    credentials: "include",
  });
  return res.json();
}