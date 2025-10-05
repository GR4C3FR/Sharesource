require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// =======================
// Import Routes
// =======================
const userRoutes = require('./routes/userRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const commentRoutes = require('./routes/commentRoutes'); 
const ratingRoutes = require('./routes/ratingRoutes');
const collaborativeSpaceRoutes = require('./routes/collaborativeSpaceRoutes');
const fileRoutes = require('./routes/fileRoutes');

const app = express();

// =======================
// Middleware
// =======================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =======================
// Use Routes
// =======================
app.use('/api/users', userRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/collaborative-spaces', collaborativeSpaceRoutes);
app.use('/api/files', fileRoutes);

// Root route (for sanity check)
app.get('/', (req, res) => {
  res.send('🚀 Server is running and connected to MongoDB ✅');
});

// =======================
// Database Connection
// =======================
const mongoURI = process.env.MONGO_URI;

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// =======================
// Start Server
// =======================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
