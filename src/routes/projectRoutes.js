// src/routes/projectRoutes.js
const express = require('express');

// Yeni fonksiyonları import edin
const {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject
} = require('../controllers/projectController.js');

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

module.exports = router;