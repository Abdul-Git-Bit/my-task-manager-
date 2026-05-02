const User = require('../models/User');

const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId);
        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }
        next();
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const isProjectMember = async (req, res, next) => {
    try {
        const Project = require('../models/Project');
        const project = await Project.findById(req.params.projectId || req.body.projectId);
        
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        
        if (project.owner.toString() !== req.user.userId && 
            !project.members.includes(req.user.userId)) {
            return res.status(403).json({ message: 'Not a project member' });
        }
        
        req.project = project;
        next();
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { isAdmin, isProjectMember };