// src/app.js
const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const projectRoutes = require('./routes/projectRoutes');
const authRoutes = require('./routes/authRoutes');

// Ortam değişkenlerini yükle
dotenv.config();

// Veritabanı bağlantısını yap
connectDB();

const app = express();

// Body parser middleware'i (gelen JSON verilerini okumak için)
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Proje Yönetim API Çalışıyor!');
});

// Rotaları daha sonra buraya ekleyeceğiz.
// app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/projects', projectRoutes);
app.use('/api/auth', authRoutes);


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda çalışıyor.`));