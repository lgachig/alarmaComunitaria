const Camara = require('../models/Camara');
const crypto = require('crypto');

// Generar credenciales únicas para cámara
const generateCredentials = () => {
  return {
    api_key: crypto.randomBytes(32).toString('hex'),
    secret_key: crypto.randomBytes(64).toString('hex')
  };
};

// Registrar nueva cámara
const registerCamara = async (req, res) => {
  try {
    const { 
      nombre, 
      ubicacion, 
      detection_settings = {},
      owner 
    } = req.body;

    if (!nombre || !ubicacion || !owner) {
      return res.status(400).json({ 
        error: 'nombre, ubicacion y owner son requeridos' 
      });
    }

    // Generar camera_id único
    const camera_id = `cam_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generar credenciales
    const credentials = generateCredentials();

    const camara = new Camara({
      camera_id,
      nombre,
      ubicacion: {
        coordinates: [ubicacion.longitude, ubicacion.latitude],
        address: ubicacion.address
      },
      owner,
      detection_settings: {
        weapons: detection_settings.weapons !== false,
        suspicious_activity: detection_settings.suspicious_activity !== false,
        people_detection: detection_settings.people_detection !== false,
        motion_detection: detection_settings.motion_detection || false
      },
      credentials
    });

    await camara.save();
    
    // No enviar las credenciales en la respuesta
    const camaraResponse = camara.toObject();
    delete camaraResponse.credentials;

    res.status(201).json({
      message: 'Cámara registrada exitosamente',
      camara: camaraResponse,
      credentials: credentials // Solo enviar una vez para configuración inicial
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error al registrar cámara', 
      details: err.message 
    });
  }
};

// Actualizar cámara existente
const updateCamara = async (req, res) => {
  try {
    const { camera_id } = req.params;
    const updateData = req.body;

    // Validar que el usuario sea el propietario
    const camara = await Camara.findOne({ camera_id });
    if (!camara) {
      return res.status(404).json({ error: 'Cámara no encontrada' });
    }

    if (camara.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permisos para modificar esta cámara' });
    }

    // Actualizar campos permitidos
    const allowedUpdates = [
      'nombre', 'ubicacion', 'alert_enabled', 'detection_settings'
    ];
    
    const update = {};
    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        if (field === 'ubicacion' && updateData[field]) {
          update['ubicacion.coordinates'] = [updateData[field].longitude, updateData[field].latitude];
          update['ubicacion.address'] = updateData[field].address;
        } else {
          update[field] = updateData[field];
        }
      }
    });

    const updatedCamara = await Camara.findOneAndUpdate(
      { camera_id },
      { $set: update },
      { new: true }
    ).select('-credentials');

    res.json(updatedCamara);
  } catch (err) {
    res.status(500).json({ 
      error: 'Error al actualizar cámara', 
      details: err.message 
    });
  }
};

// Obtener todas las cámaras (con filtros)
const getCamaras = async (req, res) => {
  try {
    const { 
      status, 
      alert_enabled, 
      owner,
      near_location,
      radius = 10 // km por defecto
    } = req.query;

    let query = {};

    // Filtros básicos
    if (status) query['status.online'] = status === 'online';
    if (alert_enabled) query.alert_enabled = alert_enabled === 'true';
    if (owner) query.owner = owner;

    // Filtro geoespacial
    if (near_location) {
      const [lon, lat] = near_location.split(',').map(Number);
      query['ubicacion.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lon, lat]
          },
          $maxDistance: radius * 1000 // convertir km a metros
        }
      };
    }

    const camaras = await Camara.find(query)
      .select('-credentials')
      .populate('owner', 'name email')
      .sort({ 'status.last_active': -1 });

    res.json(camaras);
  } catch (err) {
    res.status(500).json({ 
      error: 'Error al obtener cámaras', 
      details: err.message 
    });
  }
};

// Obtener una cámara por camera_id
const getCamaraById = async (req, res) => {
  try {
    const camara = await Camara.findOne({ camera_id: req.params.camera_id })
      .select('-credentials')
      .populate('owner', 'name email');
    
    if (!camara) {
      return res.status(404).json({ error: 'Cámara no encontrada' });
    }
    
    res.json(camara);
  } catch (err) {
    res.status(500).json({ 
      error: 'Error al obtener cámara', 
      details: err.message 
    });
  }
};

// Eliminar cámara
const deleteCamara = async (req, res) => {
  try {
    const { camera_id } = req.params;

    const camara = await Camara.findOne({ camera_id });
    if (!camara) {
      return res.status(404).json({ error: 'Cámara no encontrada' });
    }

    if (camara.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permisos para eliminar esta cámara' });
    }

    await Camara.deleteOne({ camera_id });
    res.json({ message: 'Cámara eliminada exitosamente' });
  } catch (err) {
    res.status(500).json({ 
      error: 'Error al eliminar cámara', 
      details: err.message 
    });
  }
};

// Obtener cámaras cercanas a una ubicación
const getNearbyCamaras = async (req, res) => {
  try {
    const { latitude, longitude, radius = 5 } = req.query; // radius en km

    if (!latitude || !longitude) {
      return res.status(400).json({ 
        error: 'latitude y longitude son requeridos' 
      });
    }

    const camaras = await Camara.find({
      'ubicacion.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: radius * 1000 // convertir km a metros
        }
      },
      'status.online': true,
      alert_enabled: true
    })
    .select('-credentials')
    .populate('owner', 'name email')
    .limit(20);

    res.json(camaras);
  } catch (err) {
    res.status(500).json({ 
      error: 'Error al obtener cámaras cercanas', 
      details: err.message 
    });
  }
};

// Actualizar estado de cámara (usado por el backend Python)
const updateCamaraStatus = async (req, res) => {
  try {
    const { camera_id, status, alert_level, video_url } = req.body;

    if (!camera_id) {
      return res.status(400).json({ error: 'camera_id es requerido' });
    }

    const update = {
      'status.online': status === 'online',
      'status.last_active': new Date(),
      ultima_actividad: new Date()
    };

    if (alert_level) update.alert_level = alert_level;
    if (video_url) update.video_url = video_url;

    const camara = await Camara.findOneAndUpdate(
      { camera_id },
      { $set: update },
      { new: true }
    ).select('-credentials');

    if (!camara) {
      return res.status(404).json({ error: 'Cámara no encontrada' });
    }

    res.json(camara);
  } catch (err) {
    res.status(500).json({ 
      error: 'Error al actualizar estado de cámara', 
      details: err.message 
    });
  }
};

module.exports = {
  registerCamara,
  updateCamara,
  getCamaras,
  getCamaraById,
  deleteCamara,
  getNearbyCamaras,
  updateCamaraStatus
}; 