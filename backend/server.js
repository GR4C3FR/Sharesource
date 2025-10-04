require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const userRoutes = require('./routes/userRoutes');
const noteRoutes = require('./routes/noteRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const commentRoutes = require('./routes/commentRoutes'); // <-- added
const ratingRoutes = require('./routes/ratingRoutes');   // <-- added
const collaborativeSpaceRoutes = require("./routes/collaborativeSpaceRoutes");
const fileRoutes = require('./routes/fileRoutes');

const app = express();

// =======================
// Middleware
// =======================
app.use(express.json());

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET","POST","PUT","DELETE"],
  credentials: true
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =======================
// Use routes
// =======================
app.use('/api/users', userRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/comments', commentRoutes);  // <-- added
app.use('/api/ratings', ratingRoutes);    // <-- added
app.use("/api/collaborative-spaces", collaborativeSpaceRoutes);
app.use('/api/files', fileRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Server is running and connected to MongoDB ✅');
});

// =======================
// Database
// =======================
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});