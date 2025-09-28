// controllers/collaborativeSpaceController.js
const CollaborativeSpace = require("../models/CollaborativeSpace");
const GoogleDoc = require("../models/GoogleDoc");

/**
 * Create a new collaborative space
 */
exports.createSpace = async (req, res) => {
  console.log("📥 [createSpace] body:", req.body);
  console.log("👤 [createSpace] user:", req.user);

  try {
    const { spaceName, description } = req.body;

    if (!spaceName?.trim()) {
      return res.status(400).json({ message: "spaceName is required" });
    }

    const newSpace = await CollaborativeSpace.create({
      spaceName: spaceName.trim(),
      description: description || "",
      ownerUserId: req.user.userId,
      members: [{ userId: req.user.userId, role: "owner" }],
    });

    console.log("✅ [createSpace] created:", newSpace._id);
    res.status(201).json(newSpace);
  } catch (error) {
    console.error("❌ [createSpace] error:", error.message);
    res.status(500).json({
      message: "Failed to create space",
      error: error.message,
    });
  }
};

/**
 * Get all spaces the logged-in user belongs to
 */
exports.getUserSpaces = async (req, res) => {
  console.log("👤 [getUserSpaces] user:", req.user);

  try {
    const spaces = await CollaborativeSpace.find({
      "members.userId": req.user.userId,
    })
      .populate("sharedNotesIds")
      .populate("sharedDocIds");

    console.log(`📤 [getUserSpaces] found ${spaces.length} spaces`);
    res.json(spaces);
  } catch (error) {
    console.error("❌ [getUserSpaces] error:", error.message);
    res.status(500).json({
      message: "Failed to fetch spaces",
      error: error.message,
    });
  }
};

/**
 * Get ALL spaces (for discovery / joining)
 */
exports.getAllSpaces = async (req, res) => {
  console.log("👤 [getAllSpaces] user:", req.user);

  try {
    const spaces = await CollaborativeSpace.find({})
      .select("spaceName description ownerUserId members") // lightweight info
      .populate("ownerUserId", "email"); // show owner's email only

    console.log(`📤 [getAllSpaces] found ${spaces.length} spaces`);
    res.json(spaces);
  } catch (error) {
    console.error("❌ [getAllSpaces] error:", error.message);
    res.status(500).json({
      message: "Failed to fetch all spaces",
      error: error.message,
    });
  }
};

/**
 * Add a new member to a collaborative space
 */
exports.addMember = async (req, res) => {
  const { spaceId } = req.params;
  const { userId, role } = req.body;

  console.log("📥 [addMember] params:", spaceId);
  console.log("📥 [addMember] body:", req.body);

  try {
    if (!userId || !role) {
      return res
        .status(400)
        .json({ message: "userId and role are required" });
    }

    const space = await CollaborativeSpace.findById(spaceId);
    if (!space) return res.status(404).json({ message: "Space not found" });

    // Only owner can add members
    if (String(space.ownerUserId) !== String(req.user.userId)) {
      return res
        .status(403)
        .json({ message: "Only the owner can add members" });
    }

    // Prevent duplicates
    if (space.members.some((m) => String(m.userId) === String(userId))) {
      return res.status(400).json({ message: "User is already a member" });
    }

    space.members.push({ userId, role });
    await space.save();

    console.log("✅ [addMember] updated:", space._id);
    res.json(space);
  } catch (error) {
    console.error("❌ [addMember] error:", error.message);
    res.status(500).json({
      message: "Failed to add member",
      error: error.message,
    });
  }
};

/**
 * Share a note in a collaborative space
 */
exports.shareNote = async (req, res) => {
  const { spaceId } = req.params;
  const { noteId } = req.body;

  console.log("📥 [shareNote] params:", spaceId);
  console.log("📥 [shareNote] body:", req.body);

  try {
    if (!noteId) {
      return res.status(400).json({ message: "noteId is required" });
    }

    const space = await CollaborativeSpace.findById(spaceId);
    if (!space) return res.status(404).json({ message: "Space not found" });

    if (space.sharedNotesIds.includes(noteId)) {
      return res.status(400).json({ message: "Note already shared" });
    }

    space.sharedNotesIds.push(noteId);
    await space.save();

    console.log("✅ [shareNote] updated:", space._id);
    res.json(space);
  } catch (error) {
    console.error("❌ [shareNote] error:", error.message);
    res.status(500).json({
      message: "Failed to share note",
      error: error.message,
    });
  }
};

/**
 * Share a Google Doc in a collaborative space
 */
exports.shareGoogleDoc = async (req, res) => {
  const { spaceId } = req.params;
  const { title, link } = req.body;

  console.log("📥 [shareGoogleDoc] params:", spaceId);
  console.log("📥 [shareGoogleDoc] body:", req.body);

  try {
    if (!title || !link) {
      return res.status(400).json({ message: "title and link are required" });
    }

    const space = await CollaborativeSpace.findById(spaceId);
    if (!space) return res.status(404).json({ message: "Space not found" });

    // Create a new GoogleDoc
    const newDoc = await GoogleDoc.create({
      title,
      link,
      createdBy: req.user.userId,
    });

    // Add it to the collaborative space
    space.sharedDocIds.push(newDoc._id);
    await space.save();

    console.log("✅ [shareGoogleDoc] added doc:", newDoc._id);
    res.json({
      message: "Google Doc shared successfully",
      doc: newDoc,
      space,
    });
  } catch (error) {
    console.error("❌ [shareGoogleDoc] error:", error.message);
    res.status(500).json({
      message: "Failed to share document",
      error: error.message,
    });
  }
};
