const API_BASE_URL = "https://sgma-66ec41075156.herokuapp.com/api";

export async function getAllStudents() {
  const res = await fetch(`${API_BASE_URL}/students/getAllStudents`, {
    credentials: "include",
  });
  return res.json();
}