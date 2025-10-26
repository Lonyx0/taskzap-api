const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.CONNECTION_STRING);
    console.log(`MongoDB Bağlandı: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Hata: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;