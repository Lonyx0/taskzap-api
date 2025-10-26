// src/models/Task.js
const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Lütfen bir görev adı girin.'],
      trim: true,
    },
    description: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ['Yapılacak', 'Üzerinde Çalışılıyor', 'İncelemede', 'Tamamlandı', 'Engellendi'],
      default: 'Yapılacak',
    },
    priority: {
      type: String,
      enum: ['Düşük', 'Orta', 'Yüksek'],
      default: 'Orta',
    },
    due_date: { // Görev bitiş tarihi
      type: Date,
      required: false,
    },
    project_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Project',
    },
    assigned_to_id: { // Görevin atandığı kullanıcı
      type: mongoose.Schema.Types.ObjectId,
      required: false, // İlk başta atanmamış olabilir
      ref: 'User',
    },
    created_by_id: { // Görevi oluşturan kullanıcı
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true, // createdAt ve updatedAt
  }
);

module.exports = mongoose.model('Task', TaskSchema);