// src/services/collaborativeSpaceService.js
import axios from "axios";

const API_URL = "http://localhost:5000/api/collaborative-spaces"; 

// ✅ helper to attach Authorization header
const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

// ✅ Create a collaborative space
export const createSpace = async (spaceName, description) => {
  const res = await axios.post(
    API_URL,
    { spaceName, description },
    getAuthHeaders()
  );
  return res.data;
};

// ✅ Get all spaces that belong to logged-in user
export const getUserSpaces = async () => {
  const res = await axios.get(API_URL, getAuthHeaders());
  return res.data;
};

// ✅ Add a member to a space (owner only)
export const addMember = async (spaceId, userId, role = "member") => {
  const res = await axios.post(
    `${API_URL}/${spaceId}/members`,
    { userId, role },
    getAuthHeaders()
  );
  return res.data;
};

// ✅ Share a note in a space
export const shareNote = async (spaceId, noteId) => {
  const res = await axios.post(
    `${API_URL}/${spaceId}/share-note`,
    { noteId },
    getAuthHeaders()
  );
  return res.data;
};

// ✅ Share a Google Doc in a space
export const shareGoogleDoc = async (spaceId, title, link) => {
  const res = await axios.post(
    `${API_URL}/${spaceId}/share-doc`,
    { title, link },
    getAuthHeaders()
  );
  return res.data;
};

// ✅ Get all available spaces (for discovery/joining)
export const getAllSpaces = async () => {
  const res = await axios.get(`${API_URL}/all`, getAuthHeaders());
  return res.data;
};

// ✅ Join a space (adds current user as "member")
export const joinSpace = async (spaceId) => {
  const userId = localStorage.getItem("userId"); // must be set at login
  if (!userId) throw new Error("No userId found in localStorage");

  const res = await axios.post(
    `${API_URL}/${spaceId}/members`,
    { userId, role: "member" },
    getAuthHeaders()
  );
  return res.data;
};

// ✅ Leave space
export const leaveSpace = async (spaceId) => {
  const res = await axios.delete(`${API_URL}/${spaceId}/leave`, getAuthHeaders());
  return res.data;
};