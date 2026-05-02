const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware - YEH ORDER IMPORTANT HAI!
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://myuser:MyStrongPass123!@cluster0.ttqmrnu.mongodb.net/taskmanager?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Database connected'))
    .catch(err => console.log('❌ Database error:', err.message));

// Simple User Schema
const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, default: 'member' }
});
const User = mongoose.model('User', UserSchema);

// ============ API ROUTES (PEHLE DEFIN KARO) ============

// Test Route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend is working!' });
});

// Signup Route
app.post('/api/auth/signup', async (req, res) => {
    console.log('Signup request received:', req.body);
    try {
        const { name, email, password, role } = req.body;
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword, role });
        await user.save();
        
        res.json({ message: 'User created successfully!' });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Login Route
app.post('/api/auth/login', async (req, res) => {
    console.log('Login request received:', req.body.email);
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }
        
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(400).json({ message: 'Invalid password' });
        }
        
        const token = jwt.sign({ userId: user._id, role: user.role }, 'my_secret_key', { expiresIn: '7d' });
        
        res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: err.message });
    }
});

// ============ SERVE FRONTEND (LAST MEIN) ============
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend')));

// Ye LAST route hai - agar koi API match nahi hui toh frontend bhejo
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ message: 'API route not found' });
    }
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
});