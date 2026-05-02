const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://simpleuser:simplepass123@cluster0.ttqmrnu.mongodb.net/taskmanager?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Database connected'))
    .catch(err => console.log('❌ Database error:', err.message));

// ============ SCHEMAS ============

// User Schema
const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, default: 'member' }
});
const User = mongoose.model('User', UserSchema);

// Project Schema
const ProjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now }
});
const Project = mongoose.model('Project', ProjectSchema);

// Task Schema
const TaskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dueDate: Date,
    status: { type: String, default: 'pending' },
    priority: { type: String, default: 'medium' },
    createdAt: { type: Date, default: Date.now }
});
const Task = mongoose.model('Task', TaskSchema);

// ============ AUTH ROUTES ============

app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: 'User exists' });
        
        const hashed = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashed, role });
        await user.save();
        res.json({ message: 'User created!' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User not found' });
        
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(400).json({ message: 'Wrong password' });
        
        const token = jwt.sign({ userId: user._id, role: user.role }, 'my_secret_key');
        res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ============ PROJECT ROUTES ============

// Get all projects
app.get('/api/projects', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.json([]);
        
        const decoded = jwt.verify(token, 'my_secret_key');
        const projects = await Project.find({
            $or: [{ owner: decoded.userId }, { members: decoded.userId }]
        });
        res.json(projects);
    } catch (err) {
        res.json([]);
    }
});

// Create project
app.post('/api/projects', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Unauthorized' });
        
        const decoded = jwt.verify(token, 'my_secret_key');
        const project = new Project({
            name: req.body.name,
            description: req.body.description,
            owner: decoded.userId,
            members: [decoded.userId]
        });
        await project.save();
        res.status(201).json(project);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ============ TASK ROUTES ============

app.get('/api/tasks', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.json([]);
        
        const decoded = jwt.verify(token, 'my_secret_key');
        const tasks = await Task.find({ assignedTo: decoded.userId });
        res.json(tasks);
    } catch (err) {
        res.json([]);
    }
});

app.post('/api/tasks', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Unauthorized' });
        
        const decoded = jwt.verify(token, 'my_secret_key');
        const task = new Task({
            title: req.body.title,
            description: req.body.description,
            project: req.body.projectId,
            assignedTo: req.body.assignedTo || decoded.userId,
            dueDate: req.body.dueDate,
            priority: req.body.priority
        });
        await task.save();
        res.status(201).json(task);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend is working!' });
});

// ============ SERVE FRONTEND ============
app.use(express.static(path.join(__dirname, '../frontend')));

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