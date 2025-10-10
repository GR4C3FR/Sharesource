const CollaborativeSpace = require("../models/CollaborativeSpace");

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
      sharedFilesIds: [],
    });

    const populated = await CollaborativeSpace.findById(newSpace._id)
      .populate("ownerUserId", "username email")
      .populate({ path: "members.userId", select: "username email" })
      .populate("sharedFilesIds");

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
      .populate("ownerUserId", "username email")
      .populate({ path: "members.userId", select: "username email" })
      .populate("sharedFilesIds");

    res.json(spaces);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch spaces",
      error: error.message,
    });
  }
};

/**
 * Get all spaces (for discovery / joining)
 */
exports.getAllSpaces = async (req, res) => {
  try {
    const spaces = await CollaborativeSpace.find({})
      .select("spaceName description ownerUserId members sharedFilesIds")
      .populate("ownerUserId", "username email")
      .populate({ path: "members.userId", select: "username email" })
      .populate("sharedFilesIds");

    res.json(spaces);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch all spaces",
      error: error.message,
    });
  }
};

/**
 * Add a new member (admin / owner) to a collaborative space
 */
exports.addMember = async (req, res) => {
  const { spaceId } = req.params;
  const { userId, role } = req.body;

  try {
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const space = await CollaborativeSpace.findById(spaceId);
    if (!space) return res.status(404).json({ message: "Space not found" });

    // only the owner can add members
    if (String(space.ownerUserId) !== String(req.user.userId)) {
      return res.status(403).json({ message: "Only the space owner can add members" });
    }

    if (space.members.some((m) => String(m.userId) === String(userId))) {
      return res.status(400).json({ message: "User is already a member" });
    }

    // default role to 'member' if not provided
    const memberRole = role || 'member';

    space.members.push({ userId, role: memberRole });
    await space.save();

    const populated = await CollaborativeSpace.findById(space._id)
      .populate("ownerUserId", "username email")
      .populate({ path: "members.userId", select: "username email" })
      .populate("sharedFilesIds");

    res.json(populated);
  } catch (error) {
    res.status(500).json({
      message: "Failed to add member",
      error: error.message,
    });
  }
};

/**
 * Join a space (self)
 */
exports.joinSpace = async (req, res) => {
  const { spaceId } = req.params;
  const userId = req.user.userId;

  try {
    const space = await CollaborativeSpace.findById(spaceId);
    if (!space) return res.status(404).json({ message: "Space not found" });

    if (space.members.some(m => String(m.userId) === String(userId))) {
      return res.status(400).json({ message: "You are already a member" });
    }

    space.members.push({ userId, role: "member" });
    await space.save();

    const populated = await CollaborativeSpace.findById(space._id)
      .populate("ownerUserId", "username email")
      .populate({ path: "members.userId", select: "username email" })
      .populate("sharedFilesIds");

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: "Failed to join space", error: error.message });
  }
};

/**
 * Share a file in a collaborative space
 */
exports.shareFile = async (req, res) => {
  const { spaceId } = req.params;
  const { fileId, name, type } = req.body;

  try {
    if (!fileId) return res.status(400).json({ message: "fileId is required" });

    const space = await CollaborativeSpace.findById(spaceId);
    if (!space) return res.status(404).json({ message: "Space not found" });

    // prevent duplicates
    if (space.sharedFilesIds.some(f => f.fileId === fileId)) {
      return res.status(400).json({ message: "File already shared" });
    }

    space.sharedFilesIds.push({ fileId, name, type });
    await space.save();

    const populated = await CollaborativeSpace.findById(space._id)
      .populate("ownerUserId", "username email")
      .populate({ path: "members.userId", select: "username email" })
      .populate("sharedFilesIds");

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: "Failed to share file", error: error.message });
  }
};

/**
 * Update space info
 */
exports.updateSpace = async (req, res) => {
  const { spaceId } = req.params;
  const { spaceName, description } = req.body;

  try {
    const space = await CollaborativeSpace.findById(spaceId);
    if (!space) return res.status(404).json({ message: "Space not found" });

    if (!space.members.some(m => String(m.userId) === String(req.user.userId))) {
      return res.status(403).json({ message: "You are not a member of this space" });
    }

    if (spaceName) space.spaceName = spaceName;
    if (description) space.description = description;

    await space.save();

    const populated = await CollaborativeSpace.findById(space._id)
      .populate("ownerUserId", "username email")
      .populate({ path: "members.userId", select: "username email" })
      .populate("sharedFilesIds");

    res.json({ message: "Space updated", space: populated });
  } catch (error) {
    res.status(500).json({ message: "Failed to update space", error: error.message });
  }
};

/**
 * Leave a collaborative space
 */
exports.leaveSpace = async (req, res) => {
  const { spaceId } = req.params;
  const userId = req.user.userId;

  try {
    const space = await CollaborativeSpace.findById(spaceId);
    if (!space) return res.status(404).json({ message: "Space not found" });

    const memberIndex = space.members.findIndex(m => String(m.userId) === String(userId));
    if (memberIndex === -1) return res.status(400).json({ message: "You are not a member" });

    space.members.splice(memberIndex, 1);

    if (String(space.ownerUserId) === String(userId)) {
      if (space.members.length > 0) {
        space.ownerUserId = space.members[0].userId;
        space.members[0].role = "owner";
      } else {
        await space.deleteOne();
        return res.json({ message: "Space deleted as owner left and no members remain" });
      }
    }

    await space.save();
    res.json({ message: "You have left the space", space });
  } catch (error) {
    res.status(500).json({ message: "Failed to leave space", error: error.message });
  }
};

/**
 * Get space by ID
 */
exports.getSpaceById = async (req, res) => {
  try {
    const space = await CollaborativeSpace.findById(req.params.spaceId)
      .populate("ownerUserId", "username email")
      .populate({ path: "members.userId", select: "username email" })
      .populate("sharedFilesIds");

    if (!space) return res.status(404).json({ message: "Space not found" });

    res.json(space);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch space", error: error.message });
  }
};
