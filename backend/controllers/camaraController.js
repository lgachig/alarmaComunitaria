const Camara = require('../models/Camara');

// Registrar o actualizar cámara
const upsertCamara = async (req, res) => {
  try {
    const { camera_id, nombre, location, estado, alert_level, video_url } = req.body;
    if (!camera_id || !location) {
      return res.status(400).json({ error: 'camera_id y location son requeridos' });
    }
    const update = {
      nombre,
      ubicacion: {
        latitude: location.latitude,
        longitude: location.longitude
      },
      estado: estado || 'normal',
      alert_level: alert_level || 'baja',
      video_url,
      ultima_actividad: new Date()
    };
    const camara = await Camara.findOneAndUpdate(
      { camera_id },
      { $set: update },
      { upsert: true, new: true }
    );
    res.json(camara);
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar/actualizar cámara', details: err.message });
  }
};

// Obtener todas las cámaras
const getCamaras = async (req, res) => {
  try {
    const camaras = await Camara.find();
    res.json(camaras);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener cámaras', details: err.message });
  }
};

// Obtener una cámara por camera_id
const getCamaraById = async (req, res) => {
  try {
    const camara = await Camara.findOne({ camera_id: req.params.camera_id });
    if (!camara) return res.status(404).json({ error: 'Cámara no encontrada' });
    res.json(camara);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener cámara', details: err.message });
  }
};

module.exports = {
  upsertCamara,
  getCamaras,
  getCamaraById
}; 