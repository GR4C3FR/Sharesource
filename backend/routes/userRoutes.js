const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcrypt');

const router = express.Router();
const uploadImage = require('../middleware/uploadImage');
const fs = require('fs');
const path = require('path');
// models needed for cascading deletes
const File = require('../models/File');
const Comment = require('../models/Comment');
const Bookmark = require('../models/Bookmark');
const Rating = require('../models/Rating');
const CollaborativeSpace = require('../models/CollaborativeSpace');
const GoogleDoc = require('../models/GoogleDoc');

// JWT Helper Functions
function generateAccessToken(user) {
  return jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "30d" }
  );
}

// Auth Middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "❌ Access denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: "❌ Invalid or expired token" });
  }
}

router.use((req, res, next) => {
  console.log(`➡️  ${req.method} ${req.originalUrl} body:`, req.body);
  next();
});


// Signup
router.post('/signup', async (req, res) => {
  try {
    console.log("Signup request body:", req.body); // ✅ Step 2: Debug line

    const { email, username, password, passwordHash, firstName, lastName } = req.body;
    const rawPassword = password || passwordHash; // ✅ support both
    const role = "Student";

    if (!rawPassword) {
      return res.status(400).json({ message: "Password is required" });
    }

    // Ensure unique email and unique username
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      if (existing.email === email) return res.status(400).json({ message: "User with this email already exists" });
      return res.status(400).json({ message: "Username already taken" });
    }

    const user = new User({ email, username, firstName, lastName, role });
    await user.setPassword(rawPassword); // ✅ hash whichever one is available
    await user.save();
    console.log("✅ User saved to DB:", user);

    res.status(201).json({ message: 'Signup successful', user });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Signup failed', error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    console.log("🟢 Login attempt:", req.body);

    const { email, password, passwordHash } = req.body;
    const plainPassword = password || passwordHash;
    const user = await User.findOne({ email });

    console.log("🔍 Login attempt:", { email, password });
    console.log("🔍 Found user:", user ? { email: user.email, hash: user.passwordHash } : "not found");

    if (!user) {
      console.log("❌ User not found");
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.passwordHash && !user.passwordHash.startsWith('$2b$') && password === user.passwordHash) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(password, salt);
      await user.save();
      console.log(`Upgraded password for ${email} to bcrypt hash`);
    }

    const isMatch = await user.matchPassword(plainPassword);

    console.log("🧩 Comparing passwords:");
    console.log("Entered:", plainPassword);
    console.log("Stored hash:", user.passwordHash);


    if (!isMatch) {
      console.log("❌ Password mismatch");
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      message: "✅ Login successful",
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error'});
  }
});

// Refresh Token
router.post('/refresh', (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(401).json({ error: "❌ Refresh token required" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const accessToken = generateAccessToken({ _id: decoded.userId });
    res.json({ accessToken });
  } catch (err) {
    res.status(403).json({ error: "❌ Invalid or expired refresh token" });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.json({ message: "✅ Logged out successfully. Please discard tokens on client." });
});

// Protected Profile Route
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-passwordHash");
    if (!user) {
      return res.status(404).json({ error: "❌ User not found" });
    }
    res.json({ message: "✅ Profile fetched", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search user by email (for invites) - returns minimal profile info
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: 'email query is required' });

    const user = await User.findOne({ email }).select('_id email username firstName lastName');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update profile fields
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const updates = {};
    const allowed = ['firstName', 'lastName', 'username'];
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    // If username is being changed, ensure uniqueness
    if (updates.username) {
      const exists = await User.findOne({ username: updates.username, _id: { $ne: req.user.userId } });
      if (exists) return res.status(400).json({ message: 'Username already taken' });
    }

    const user = await User.findByIdAndUpdate(req.user.userId, updates, { new: true }).select('-passwordHash');
    res.json({ message: 'Profile updated', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change password
router.post('/profile/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'currentPassword and newPassword required' });

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const match = await user.matchPassword(currentPassword);
    if (!match) return res.status(401).json({ message: 'Current password is incorrect' });

    await user.setPassword(newPassword);
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete profile and cascade delete related data
router.delete('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    // 1) Delete spaces owned by user (this will trigger CollaborativeSpace pre hook to cleanup linked GoogleDocs)
    const ownedSpaces = await CollaborativeSpace.find({ ownerUserId: userId });
    for (const s of ownedSpaces) {
      await s.deleteOne();
    }

    // 2) Remove user from any other spaces' members
    await CollaborativeSpace.updateMany(
      { 'members.userId': userId },
      { $pull: { members: { userId } } }
    );

    // 3) Delete bookmarks
    await Bookmark.deleteMany({ userID: userId });

    // 4) Delete ratings
    await Rating.deleteMany({ userId });

    // 5) Delete comments
    await Comment.deleteMany({ userId });

    // 6) Delete files owned by user and remove physical files when possible
    const userFiles = await File.find({ user: userId });
    for (const f of userFiles) {
      try {
        if (f.path) {
          const filePath = path.isAbsolute(f.path) ? f.path : path.join(__dirname, '..', f.path);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
      } catch (e) {
        console.warn('Failed to delete file on disk', e);
      }
    }
    await File.deleteMany({ user: userId });

    // 7) Delete google docs created/uploaded by user
    await GoogleDoc.deleteMany({ $or: [{ uploadedBy: userId }, { createdBy: userId }] });

    // 8) Finally delete the user record
    await User.findByIdAndDelete(userId);

    res.json({ message: 'Profile and related data deleted' });
  } catch (err) {
    console.error('Failed to delete profile', err);
    res.status(500).json({ message: 'Failed to delete profile', error: err.message });
  }
});

// Upload profile picture
router.post('/profile/picture', authMiddleware, uploadImage.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    const filename = req.file.filename;
    const user = await User.findByIdAndUpdate(req.user.userId, { profileImageURL: `/uploads/${filename}` }, { new: true }).select('-passwordHash');
    res.json({ message: 'Profile picture updated', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete profile picture
router.delete('/profile/picture', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.profileImageURL) return res.status(400).json({ error: 'No profile picture to delete' });

    // profileImageURL is like /uploads/filename.ext
    const filename = path.basename(user.profileImageURL);
    const filePath = path.join(__dirname, '..', 'uploads', filename);

    try { fs.unlinkSync(filePath); } catch (e) { console.warn('Failed to unlink profile image', e); }

    user.profileImageURL = undefined;
    await user.save();

    res.json({ message: 'Profile picture removed', user: { ...user.toObject(), passwordHash: undefined } });
  } catch (err) {
    console.error('Delete profile picture error', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

module.exports.authMiddleware = authMiddleware;
module.exports.User = User;