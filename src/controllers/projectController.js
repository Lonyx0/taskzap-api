// src/controllers/projectController.js
const Project = require('../models/Project');

// @desc    Tüm projeleri getir
// @route   GET /api/projects
exports.getProjects = async (req, res, next) => {
    try {
        const projects = await Project.find();
        res.status(200).json({ success: true, data: projects });
    } catch (error) {
        res.status(400).json({ success: false });
    }
};

// @desc    Yeni bir proje oluştur
// @route   POST /api/projects
exports.createProject = async (req, res, next) => {
    
    try {

        req.body.owner_id = req.user._id;
        if(!req.body.name) throw new Error('Project name is required');
        const project = await Project.create(req.body);
        res.status(201).json({ success: true, data: project });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.getProjectById = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);
        if(!project){
            return res.status(404).json({ success: false, error: 'Project not found' });
        }
        res.status(200).json({ success: true, data: project });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.updateProject = async (req, res, next) => {
    try {
        const project = await Project.findByIdAndUpdate(req.params, req.body, {
            new: true,
            runValidators: true
        });

        if(!project){
            return res.status(404).json({ success: false, error: 'Project not found' });
        }
        res.status(200).json({ success: true, data: project });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }

};

exports.deleteProject = async (req, res, next) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.id);
        if(!project){
            return res.status(404).json({ success: false, error: 'Project not found' });
        }
        res.status(200).json({ success: true, data: project });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

