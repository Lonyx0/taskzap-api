// src/controllers/authController.js
const User = require('../models/User');

// @desc    Yeni kullanıcı kaydı
// @route   POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Kullanıcıyı oluştur
    const user = await User.create({
      name,
      email,
      password,
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Kullanıcı girişi
// @route   POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // E-posta ve parola kontrolü
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Lütfen e-posta ve parola girin' });
    }

    // Kullanıcıyı bul ve parolayı da sorguya dahil et (modelde select: false olduğu için)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, error: 'Geçersiz kimlik bilgileri' });
    }

    // Parolaları karşılaştır
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Geçersiz kimlik bilgileri' });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Token oluşturup yanıt olarak gönderen yardımcı fonksiyon
const sendTokenResponse = (user, statusCode, res) => {
  // Token oluştur
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    token,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email
    }
  });
};