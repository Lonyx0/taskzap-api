// src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Lütfen adınızı girin.'],
  },
  email: {
    type: String,
    required: [true, 'Lütfen e-posta adresinizi girin.'],
    unique: true, // Her e-posta benzersiz olmalı
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Lütfen geçerli bir e-posta adresi girin.',
    ],
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, 'Lütfen bir parola girin.'],
    minlength: 6,
    select: false, // Sorgularda parolanın gelmesini engeller
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Parolayı kaydetmeden ÖNCE hash'le (Mongoose middleware)
UserSchema.pre('save', async function (next) {
  // Sadece parola alanı değiştirildiyse veya yeniyse çalışır
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// JWT imzalama ve döndürme metodu
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Girilen parolayı, veritabanındaki hash'lenmiş parola ile karşılaştırma metodu
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);