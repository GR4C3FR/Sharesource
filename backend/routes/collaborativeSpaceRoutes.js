// routes/collaborativeSpaceRoutes.js
const express = require("express");
const router = express.Router();
const {
  createSpace,
  getUserSpaces,
  addMember,
  shareNote,
  shareGoogleDoc,
  getAllSpaces,
  updateSpace,
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

// Share a note inside the space
router.post("/:spaceId/share-note", authMiddleware, shareNote);

// Share a Google Doc link
router.post("/:spaceId/share-doc", authMiddleware, shareGoogleDoc);

// List all spaces
router.get("/all", authMiddleware, getAllSpaces);

// Edit Spaces
router.put("/:spaceId", authMiddleware, updateSpace);

// Leave a space
router.delete("/:spaceId/leave", authMiddleware, leaveSpace);

//  Get a single space by ID (with members + notes)
router.get("/:spaceId", authMiddleware, getSpaceById);

module.exports = router;
