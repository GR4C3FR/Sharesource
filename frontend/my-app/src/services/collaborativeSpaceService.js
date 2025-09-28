// collaborativeSpaceService.js
import axios from "axios";

const API_URL = "http://localhost:5000/api/collaborative-spaces"; 

// get token from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken"); // ✅ match Login.jsx
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const createSpace = async (spaceName, description) => {
  const res = await axios.post(
    API_URL,
    { spaceName, description },
    getAuthHeaders()
  );
  return res.data;
};

export const getUserSpaces = async () => {
  const res = await axios.get(API_URL, getAuthHeaders());
  return res.data;
};

export const addMember = async (spaceId, userId, role) => {
  const res = await axios.post(
    `${API_URL}/${spaceId}/members`,
    { userId, role },
    getAuthHeaders()
  );
  return res.data;
};

export const shareNote = async (spaceId, noteId) => {
  const res = await axios.post(
    `${API_URL}/${spaceId}/share-note`,
    { noteId },
    getAuthHeaders()
  );
  return res.data;
};

export const getAllSpaces = async () => {
  const res = await axios.get(`${API_URL}/all`, getAuthHeaders());
  return res.data;
};

export const joinSpace = async (spaceId) => {
  const userId = localStorage.getItem("userId"); // make sure you store userId at login
  const res = await axios.post(`${API_URL}/${spaceId}/members`, { userId, role: "member" }, getAuthHeaders());
  return res.data;
};