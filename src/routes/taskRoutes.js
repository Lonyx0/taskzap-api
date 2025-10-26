// src/routes/taskRoutes.js
const express = require('express');
const {
  getTaskById,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');

const { protect } = require('../middleware/authMiddleware'); // Rotaları koru

const router = express.Router();

// /api/tasks/:id rotaları
router
  .route('/:id')
  .get(protect, getTaskById)
  .put(protect, updateTask)
  .delete(protect, deleteTask);

module.exports = router;