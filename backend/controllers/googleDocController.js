// backend/controllers/googleDocController.js
const https = require("https");
const { URL } = require("url");
const CollaborativeSpace = require("../models/CollaborativeSpace");
const GoogleDoc = require("../models/GoogleDoc");
const mongoose = require("mongoose");

/**
 * Helper: extract Google Doc ID from many possible URL formats
 */
function extractGoogleDocId(link) {
  if (!link) return null;
  // common pattern /d/<id>/
  const m = link.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
  if (m && m[1]) return m[1];

  // sometimes id is in ?id= or ?docId= style
  const url = new URL(link, "https://example.com");
  const q = url.searchParams.get("id") || url.searchParams.get("docId") || url.searchParams.get("resourcekey");
  if (q) return q;

  return null;
}

/**
 * Helper: perform a lightweight GET to verify document is reachable publicly.
 * We'll attempt to fetch the text export endpoint:
 * https://docs.google.com/document/d/<id>/export?format=txt
 */
function checkDocPubliclyAccessible(docId, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    if (!docId) return resolve(false);

    const url = `https://docs.google.com/document/d/${docId}/export?format=txt`;

    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      reject(new Error("timeout"));
    }, timeoutMs);

    https
      .get(url, (res) => {
        clearTimeout(timeout);
        if (timedOut) return;
        // Accept 200 (OK) or 302 (redirect) as an indicator the document is viewable via browser
        // (node https doesn't follow redirects automatically). This is a pragmatic check to avoid
        // rejecting valid shareable Google Docs which may respond with redirects.
        const ok = res.statusCode === 200 || res.statusCode === 302;
        resolve(ok);
      })
      .on("error", (err) => {
        clearTimeout(timeout);
        if (timedOut) return;
        resolve(false); // treat network errors as not public
      });
  });
}

/**
 * POST /api/collaborative-spaces/:spaceId/google-docs
 * Create a GoogleDoc record and link it into the space.sharedFilesIds array with type "googledoc".
 * Body: { title, description, link }
 */
exports.createGoogleDocForSpace = async (req, res) => {
  try {
    const { spaceId } = req.params;
    const { title, description, link } = req.body;
    const userId = req.user?.userId;

    if (!title || !link) {
      return res.status(400).json({ message: "title and link are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(spaceId)) {
      return res.status(400).json({ message: "invalid spaceId" });
    }

    const space = await CollaborativeSpace.findById(spaceId);
    if (!space) return res.status(404).json({ message: "Space not found" });

    // Ensure requester is a member of the space
    const isMember = space.members.some((m) => String(m.userId) === String(userId));
    if (!isMember) return res.status(403).json({ message: "You must be a member to add a collaborative doc" });

    const docId = extractGoogleDocId(link);
    console.log("[googleDocController] incoming link:", link);
    console.log("[googleDocController] extracted docId:", docId);
    if (!docId) {
      console.warn("[googleDocController] failed to extract doc id from link", link);
      return res.status(400).json({ message: "Could not extract Google Doc ID from link. Provide a full Google Docs URL." });
    }

    // Prevent duplicate GoogleDoc records for the same underlying Google Docs document
    const existingDoc = await GoogleDoc.findOne({ link: { $regex: docId } });
    if (existingDoc) {
      console.warn('[googleDocController] duplicate google doc detected for docId:', docId);
      return res.status(400).json({ message: 'Google Docs Url is already in use' });
    }

    // Check public access (best-effort)
    let isPublic = false;
    try {
      isPublic = await checkDocPubliclyAccessible(docId);
      console.log("[googleDocController] isPublic:", isPublic);
    } catch (e) {
      console.warn("[googleDocController] public check error:", e && e.message);
    }

    if (!isPublic) {
      // Warn but do NOT block: accept the link and persist record so users aren't blocked.
      // This is a pragmatic fallback when network checks to Google fail or Google returns redirects.
      console.warn("[googleDocController] WARNING: doc not confirmed public - proceeding to save anyway:", docId);
    }

    // Save GoogleDoc record
    const gdoc = await GoogleDoc.create({
      title: title.trim(),
      link: link.trim(),
      createdBy: userId,
      description: description || "",
    });

    // Link into space.sharedFilesIds as a googledoc entry
    space.sharedFilesIds.push({
      fileId: gdoc._id,
      name: gdoc.title,
      type: "googledoc",
    });

    await space.save();

    return res.status(201).json({ message: "Google Doc added to space", googleDoc: gdoc });
  } catch (err) {
    console.error("createGoogleDocForSpace error:", err);
    return res.status(500).json({ message: "Failed to add Google Doc", error: err.message });
  }
};

/**
 * GET /api/google-docs/:docId
 * Return GoogleDoc metadata
 */
exports.getGoogleDoc = async (req, res) => {
  try {
    const { docId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(docId)) return res.status(400).json({ message: "invalid docId" });

    const doc = await GoogleDoc.findById(docId).populate("createdBy", "username email");
    if (!doc) return res.status(404).json({ message: "GoogleDoc not found" });

    res.json(doc);
  } catch (err) {
    console.error("getGoogleDoc error:", err);
    res.status(500).json({ message: "Failed to fetch google doc", error: err.message });
  }
};

/**
 * GET /api/collaborative-spaces/:spaceId/google-docs
 * Return a list of GoogleDocs linked to this space (only those with type === 'googledoc')
 */
exports.listGoogleDocsForSpace = async (req, res) => {
  try {
    const { spaceId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(spaceId)) return res.status(400).json({ message: "invalid spaceId" });

    const space = await CollaborativeSpace.findById(spaceId);
    if (!space) return res.status(404).json({ message: "Space not found" });

    // collect google doc ids from sharedFilesIds where type === 'googledoc'
    const ids = space.sharedFilesIds
      .filter((f) => f.type === "googledoc" && f.fileId)
      .map((f) => String(f.fileId));

    console.log("[googleDocController] listGoogleDocsForSpace - spaceId:", spaceId, "collected ids:", ids);

  const docs = await GoogleDoc.find({ _id: { $in: ids } }).populate("createdBy", "username email");
  console.log("[googleDocController] listGoogleDocsForSpace - found docs count:", docs.length);

  res.json(docs);
  } catch (err) {
    console.error("listGoogleDocsForSpace error:", err);
    res.status(500).json({ message: "Failed to list google docs for space", error: err.message });
  }
};

/**
 * DELETE /api/google-docs/spaces/:spaceId/:docId
 * Remove a GoogleDoc from a space's sharedFilesIds and delete the GoogleDoc record.
 * Only members of the space can perform this action.
 */
exports.deleteGoogleDocFromSpace = async (req, res) => {
  try {
    const { spaceId, docId } = req.params;
    const userId = req.user?.userId;

    if (!mongoose.Types.ObjectId.isValid(spaceId) || !mongoose.Types.ObjectId.isValid(docId)) {
      return res.status(400).json({ message: "invalid spaceId or docId" });
    }

    const space = await CollaborativeSpace.findById(spaceId);
    if (!space) return res.status(404).json({ message: "Space not found" });

    // Ensure requester is a member of the space
    const isMember = space.members.some((m) => String(m.userId) === String(userId));
    if (!isMember) return res.status(403).json({ message: "You must be a member to remove a shared doc" });

    // Remove the sharedFilesIds entry if present
    const idx = space.sharedFilesIds.findIndex((f) => String(f.fileId) === String(docId));
    if (idx !== -1) {
      space.sharedFilesIds.splice(idx, 1);
      await space.save();
    }

    // Delete the GoogleDoc record (if exists)
    await GoogleDoc.findByIdAndDelete(docId);

    return res.json({ message: "Google Doc removed from space and deleted" });
  } catch (err) {
    console.error("deleteGoogleDocFromSpace error:", err);
    res.status(500).json({ message: "Failed to delete google doc", error: err.message });
  }
};
