const mongoose = require('mongoose');

const CamaraSchema = new mongoose.Schema({
  camera_id: { type: String, required: true, unique: true },
  nombre: { type: String },
  ubicacion: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  estado: { type: String, default: 'normal' },
  alert_level: { type: String, default: 'baja' },
  video_url: { type: String },
  ultima_actividad: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Camara', CamaraSchema); 