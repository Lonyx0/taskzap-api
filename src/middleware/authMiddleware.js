// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;

  // Header'da 'Authorization' var mı ve 'Bearer' ile başlıyor mu kontrol et
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1]; // 'Bearer TOKEN_STRING'
  }

  // Token yoksa
  if (!token) {
    return res.status(401).json({ success: false, error: 'Erişim yetkiniz yok (token bulunamadı)' });
  }

  try {
    // Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Token'dan alınan ID ile kullanıcıyı bul ve req objesine ekle
    // Bu sayede korunan tüm rotalarda req.user'a erişebileceğiz
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
        return res.status(401).json({ success: false, error: 'Bu kullanıcı bulunamadı' });
    }

    next(); // Sonraki middleware'e veya controller'a geç
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Erişim yetkiniz yok (geçersiz token)' });
  }
};