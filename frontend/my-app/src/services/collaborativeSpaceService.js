import API from "../api"; // Axios instance

const token = localStorage.getItem("accessToken");

export const getAllSpaces = async () => {
  return API.get("/collaborative-spaces/all", {
    headers: { Authorization: `Bearer ${token}` },
  }).then(res => res.data);
};

export const getUserSpaces = async () => {
  return API.get("/collaborative-spaces", {
    headers: { Authorization: `Bearer ${token}` },
  }).then(res => res.data);
};

export const createSpace = async (spaceName, description) => {
  return API.post(
    "/collaborative-spaces",
    { spaceName, description },
    { headers: { Authorization: `Bearer ${token}` } }
  ).then(res => res.data);
};

// Join a space (self)
export const joinSpace = async (spaceId) => {
  return API.post(
    `/collaborative-spaces/${spaceId}/join`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  ).then(res => res.data);
};

export const leaveSpace = async (spaceId) => {
  return API.delete(`/collaborative-spaces/${spaceId}/leave`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(res => res.data);
};

// Search a user by email
export const searchUserByEmail = async (email) => {
  return API.get(`/users/search`, {
    params: { email },
    headers: { Authorization: `Bearer ${token}` },
  }).then(res => res.data.user);
};

// Invite (add) a member to a space (owner only endpoint)
export const inviteMember = async (spaceId, userId, role = 'member') => {
  return API.post(
    `/collaborative-spaces/${spaceId}/members`,
    { userId, role },
    { headers: { Authorization: `Bearer ${token}` } }
  ).then(res => res.data);
};

export const deleteSpace = async (spaceId) => {
  return API.delete(`/collaborative-spaces/${spaceId}`, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data);
};
