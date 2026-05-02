require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

// Environment variables
const MONGODB_URL = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taskmanager';
const PORT = process.env.PORT || 5000;

// Database connection
mongoose.connect(MONGODB_URL)
    .then(() => console.log('✅ Database connected'))
    .catch(err => console.log('❌ DB error:', err));

// Routes
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const projectRoutes = require('./routes/projects');

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/projects', projectRoutes);

// Serve static frontend files
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// Handle all other routes (SPA support)
app.get('*', (req, res) => {
    // Agar API route hai toh 404 bhejo
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ message: 'API route not found' });
    }
    // Nahi toh frontend ka index.html bhejo
    res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});