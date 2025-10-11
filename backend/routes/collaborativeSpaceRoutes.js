const express = require("express");
const router = express.Router();
const {
  createSpace,
  getUserSpaces,
  addMember,
  joinSpace,       // new
  shareFile,
  getAllSpaces,
  updateSpace,
  deleteSpace,
  leaveSpace,
  getSpaceById
} = require("../controllers/collaborativeSpaceController");
const authMiddleware = require("../middleware/authMiddleware");

// Create a new collaborative space
router.post("/", authMiddleware, createSpace);

// Get all spaces for the logged-in user
router.get("/", authMiddleware, getUserSpaces);

// Add a member to the space
router.post("/:spaceId/members", authMiddleware, addMember);

// Join a space (self)
router.post("/:spaceId/join", authMiddleware, joinSpace);

// Share a file inside the space
router.post("/:spaceId/share-file", authMiddleware, shareFile);

// List all spaces (for discovery / joining)
router.get("/all", authMiddleware, getAllSpaces);

// Edit Spaces
router.put("/:spaceId", authMiddleware, updateSpace);

// Leave a space
router.delete("/:spaceId/leave", authMiddleware, leaveSpace);

// Delete a space (admin)
router.delete("/:spaceId", authMiddleware, deleteSpace);

// Get a single space by ID (with members + files)
router.get("/:spaceId", authMiddleware, getSpaceById);

module.exports = router;
