// src/routes/projectRoutes.js
const express = require('express');

// Yeni fonksiyonları import edin
const {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  updateMemberRole,
  removeProjectMember
} = require('../controllers/projectController.js');

const {
  getTasksForProject,
  createTaskForProject
} = require('../controllers/taskController');

const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// '/api/projects' için rotalar
router
  .route('/')
  .get(protect,getProjects)
  .post(protect, createProject);

// '/api/projects/:id' için rotalar
router
  .route('/:id')
  .get(protect, getProjectById)   // Tek proje getir
  .put(protect, updateProject)    // Projeyi güncelle
  .delete(protect, deleteProject); // Projeyi sil

router
  .route('/:id/members')
  .post(protect, addProjectMember);

// /api/projects/:id/members/:memberId
router
  .route('/:id/members/:memberId')
  .put(protect, updateMemberRole)
  .delete(protect, removeProjectMember);

router
  .route('/:projectId/tasks')
  .get(protect, getTasksForProject)
  .post(protect, createTaskForProject);

module.exports = router;