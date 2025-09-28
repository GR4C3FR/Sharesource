// backend/controllers/collaborativeSpaceController.js
const CollaborativeSpace = require("../models/CollaborativeSpace");
const GoogleDoc = require("../models/GoogleDoc");

/**
 * Create a new collaborative space
 */
exports.createSpace = async (req, res) => {
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

    // Return populated for convenience
    const populated = await CollaborativeSpace.findById(newSpace._id)
      .populate("ownerUserId", "username email")
      .populate({ path: "members.userId", select: "username email" });

    res.status(201).json(populated);
  } catch (error) {
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
  try {
    const spaces = await CollaborativeSpace.find({
      "members.userId": req.user.userId,
    })
      .populate("sharedNotesIds")
      .populate("sharedDocIds")
      .populate("ownerUserId", "username email")
      .populate({ path: "members.userId", select: "username email" });

    res.json(spaces);
  } catch (error) {
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
  try {
    const spaces = await CollaborativeSpace.find({})
      .select("spaceName description ownerUserId members")
      .populate("ownerUserId", "username email")
      .populate({ path: "members.userId", select: "username email" });

    res.json(spaces);
  } catch (error) {
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

  try {
    if (!userId || !role) {
      return res.status(400).json({ message: "userId and role are required" });
    }

    const space = await CollaborativeSpace.findById(spaceId);
    if (!space) return res.status(404).json({ message: "Space not found" });

    // Prevent duplicates
    if (space.members.some((m) => String(m.userId) === String(userId))) {
      return res.status(400).json({ message: "User is already a member" });
    }

    space.members.push({ userId, role });
    await space.save();

    // return populated space for convenience
    const populated = await CollaborativeSpace.findById(space._id)
      .populate("ownerUserId", "username email")
      .populate({ path: "members.userId", select: "username email" });

    res.json(populated);
  } catch (error) {
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

    const populated = await CollaborativeSpace.findById(space._id)
      .populate("ownerUserId", "username email")
      .populate({ path: "members.userId", select: "username email" })
      .populate("sharedNotesIds")
      .populate("sharedDocIds");

    res.json(populated);
  } catch (error) {
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

  try {
    if (!title || !link) {
      return res.status(400).json({ message: "title and link are required" });
    }

    const space = await CollaborativeSpace.findById(spaceId);
    if (!space) return res.status(404).json({ message: "Space not found" });

    const newDoc = await GoogleDoc.create({
      title,
      link,
      createdBy: req.user.userId,
    });

    space.sharedDocIds.push(newDoc._id);
    await space.save();

    const populated = await CollaborativeSpace.findById(space._id)
      .populate("ownerUserId", "username email")
      .populate({ path: "members.userId", select: "username email" })
      .populate("sharedDocIds")
      .populate("sharedNotesIds");

    res.json({
      message: "Google Doc shared successfully",
      doc: newDoc,
      space: populated,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to share document",
      error: error.message,
    });
  }
};

/**
 * Update space info (name, description)
 */
exports.updateSpace = async (req, res) => {
  const { spaceId } = req.params;
  const { spaceName, description } = req.body;

  try {
    const space = await CollaborativeSpace.findById(spaceId);
    if (!space) return res.status(404).json({ message: "Space not found" });

    // Allow only members to update
    if (!space.members.some(m => String(m.userId) === String(req.user.userId))) {
      return res.status(403).json({ message: "You are not a member of this space" });
    }

    if (spaceName) space.spaceName = spaceName;
    if (description) space.description = description;

    await space.save();

    const populated = await CollaborativeSpace.findById(space._id)
      .populate("ownerUserId", "username email")
      .populate({ path: "members.userId", select: "username email" });

    res.json({ message: "✅ Space updated", space: populated });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update space",
      error: error.message,
    });
  }
};

/**
 * Leave a collaborative space
 */
exports.leaveSpace = async (req, res) => {
  const { spaceId } = req.params;
  const userId = req.user.userId; // from JWT

  try {
    const space = await CollaborativeSpace.findById(spaceId);
    if (!space) return res.status(404).json({ message: "Space not found" });

    // Prevent owner from leaving their own space
    if (String(space.ownerUserId) === String(userId)) {
      return res.status(400).json({ message: "Owner cannot leave their own space" });
    }

    // Remove user from members
    space.members = space.members.filter((m) => String(m.userId) !== String(userId));
    await space.save();

    const populated = await CollaborativeSpace.findById(space._id)
      .populate("ownerUserId", "username email")
      .populate({ path: "members.userId", select: "username email" });

    res.json({ message: "✅ Left space successfully", space: populated });
  } catch (error) {
    res.status(500).json({
      message: "Failed to leave space",
      error: error.message,
    });
  }
};

exports.getSpaceById = async (req, res) => {
  try {
    const space = await CollaborativeSpace.findById(req.params.spaceId)
      .populate("ownerUserId", "username email")
      .populate("members.userId", "username email")
      .populate("sharedNotesIds");
    if (!space) return res.status(404).json({ message: "Space not found" });
    res.json(space);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch space", error: err.message });
  }
};

