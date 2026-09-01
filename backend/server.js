const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taskmanager';

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Database connected'))
    .catch(err => console.log('❌ Database error:', err.message));

// ============ SCHEMAS ============

const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, default: 'member' }
});
const User = mongoose.model('User', UserSchema);

const ProjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now }
});
const Project = mongoose.model('Project', ProjectSchema);

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

app.get('/api/projects', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Unauthorized' });

        const decoded = jwt.verify(token, 'my_secret_key');
        const projects = await Project.find({
            $or: [{ owner: decoded.userId }, { members: decoded.userId }]
        }).populate('members', 'name email');
        res.json(projects);
    } catch (err) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/projects', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Unauthorized' });

        const decoded = jwt.verify(token, 'my_secret_key');
        const name = req.body.name?.trim();
        if (!name) {
            return res.status(400).json({ message: 'Project name is required' });
        }

        const project = new Project({
            name,
            description: req.body.description,
            owner: decoded.userId,
            members: [decoded.userId]
        });
        await project.save();
        await project.populate('members', 'name email');
        res.status(201).json(project);
    } catch (err) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/projects/:projectId/members', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Unauthorized' });

        const decoded = jwt.verify(token, 'my_secret_key');
        const project = await Project.findById(req.params.projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!project.members.includes(user._id)) {
            project.members.push(user._id);
            await project.save();
        }

        await project.populate('members', 'name email');
        res.json({ project });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ============ TASK ROUTES ============

app.get('/api/tasks/project/:projectId', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.json([]);

        const tasks = await Task.find({ project: req.params.projectId })
            .populate('assignedTo', 'name email');
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
            assignedTo: req.body.assignedTo,
            dueDate: req.body.dueDate,
            priority: req.body.priority
        });
        await task.save();
        await task.populate('assignedTo', 'name email');
        res.status(201).json(task);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.put('/api/tasks/:taskId', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Unauthorized' });

        const task = await Task.findByIdAndUpdate(
            req.params.taskId,
            { status: req.body.status },
            { new: true }
        ).populate('assignedTo', 'name email');
        res.json(task);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.delete('/api/tasks/:taskId', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Unauthorized' });

        await Task.findByIdAndDelete(req.params.taskId);
        res.json({ message: 'Task deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ============ TEST ROUTE ============

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

// ============ START SERVER ============

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
});