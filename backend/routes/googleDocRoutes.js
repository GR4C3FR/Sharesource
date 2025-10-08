// backend/routes/googleDocRoutes.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  createGoogleDocForSpace,
  getGoogleDoc,
  listGoogleDocsForSpace,
  deleteGoogleDocFromSpace,
} = require("../controllers/googleDocController");

// Create & link a Google Doc into a space
router.post("/spaces/:spaceId", authMiddleware, createGoogleDocForSpace);

// Get a single GoogleDoc by id
router.get("/:docId", authMiddleware, getGoogleDoc);

// List all GoogleDocs for a space
router.get("/spaces/:spaceId/list", authMiddleware, listGoogleDocsForSpace);

// Delete a google doc from a space and the DB
router.delete('/spaces/:spaceId/:docId', authMiddleware, deleteGoogleDocFromSpace);

module.exports = router;
