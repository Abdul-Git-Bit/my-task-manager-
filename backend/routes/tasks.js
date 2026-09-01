const router = require('express').Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');


router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, description, projectId, assignedTo, dueDate, priority } = req.body;

        
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        
        const isMember = project.members.includes(req.user.userId);
        const user = await User.findById(req.user.userId);
        const isAdmin = user.role === 'admin';

        if (!isMember && !isAdmin) {
            return res.status(403).json({ message: 'Not a project member' });
        }

        const task = new Task({
            title,
            description,
            project: projectId,
            assignedTo,
            assignedBy: req.user.userId,
            dueDate,
            priority: priority || 'medium'
        });

        await task.save();
        res.status(201).json(task);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.get('/project/:projectId', authMiddleware, async (req, res) => {
    try {
        const tasks = await Task.find({ project: req.params.projectId })
            .populate('assignedTo', 'name email')
            .populate('assignedBy', 'name email');

        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.get('/my-tasks', authMiddleware, async (req, res) => {
    try {
        const tasks = await Task.find({ assignedTo: req.user.userId })
            .populate('project', 'name')
            .populate('assignedBy', 'name');

        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.get('/overdue', authMiddleware, async (req, res) => {
    try {
        const tasks = await Task.find({
            assignedTo: req.user.userId,
            dueDate: { $lt: new Date() },
            status: { $ne: 'completed' }
        }).populate('project', 'name');

        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        
        const user = await User.findById(req.user.userId);
        if (task.assignedTo.toString() !== req.user.userId && user.role !== 'admin') {
            return res.status(403).json({ message: 'Not assigned to this task' });
        }

        const updated = await Task.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        
        const user = await User.findById(req.user.userId);
        if (user.role !== 'admin' && task.assignedBy.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await Task.findByIdAndDelete(req.params.id);
        res.json({ message: 'Task deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.get('/dashboard/stats', authMiddleware, async (req, res) => {
    try {
        const totalTasks = await Task.countDocuments({ assignedTo: req.user.userId });
        const completedTasks = await Task.countDocuments({
            assignedTo: req.user.userId,
            status: 'completed'
        });
        const overdueTasks = await Task.countDocuments({
            assignedTo: req.user.userId,
            dueDate: { $lt: new Date() },
            status: { $ne: 'completed' }
        });

        res.json({
            totalTasks,
            completedTasks,
            pendingTasks: totalTasks - completedTasks,
            overdueTasks
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;