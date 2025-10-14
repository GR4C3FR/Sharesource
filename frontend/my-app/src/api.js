import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api", // backend URL
  withCredentials: true,
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("accessToken");

  // ✅ Skip adding token for login or registration requests
  if (!req.url.includes("/users/login") && !req.url.includes("/users/register")) {
    if (token) {
      req.headers.Authorization = `Bearer ${token}`;
    }
  }

  return req;
});


export default API;