const router = require('express').Router();
const Project = require('../models/Project');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// ✅ Create Project
router.post('/', authMiddleware, async (req, res) => {
    try {
        const project = new Project({
            name: req.body.name,
            description: req.body.description,
            owner: req.user.userId,
            members: [req.user.userId]
        });

        await project.save();
        res.status(201).json(project);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ✅ Get All Projects (jisme user member hai)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const projects = await Project.find({
            $or: [
                { owner: req.user.userId },
                { members: req.user.userId }
            ]
        }).populate('owner', 'name email').populate('members', 'name email');

        res.json(projects);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ✅ Get Single Project
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('owner', 'name email')
            .populate('members', 'name email');

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check access
        const isMember = project.members.some(m => m._id.toString() === req.user.userId);
        if (project.owner.toString() !== req.user.userId && !isMember) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(project);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ✅ Add Member to Project (Sirf Admin/Owner)
router.post('/:id/members', authMiddleware, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if user is admin or project owner
        const user = await User.findById(req.user.userId);
        if (user.role !== 'admin' && project.owner.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Only admin or project owner can add members' });
        }

        const { email } = req.body;
        const memberToAdd = await User.findOne({ email });

        if (!memberToAdd) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!project.members.includes(memberToAdd._id)) {
            project.members.push(memberToAdd._id);
            await project.save();
        }

        res.json({ message: 'Member added successfully', project });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ✅ Get All Users (for adding members)
router.get('/users/all', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const users = await User.find({}, 'name email role');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;