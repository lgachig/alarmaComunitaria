const mongoose = require('mongoose');

const CamaraSchema = new mongoose.Schema({
  camera_id: { 
    type: String, 
    required: true, 
    unique: true 
  },
  nombre: { 
    type: String, 
    required: true 
  },
  ubicacion: {
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      index: '2dsphere' // Para consultas geoespaciales
    },
    address: { 
      type: String 
    }
  },
  status: {
    online: { 
      type: Boolean, 
      default: false 
    },
    last_active: { 
      type: Date, 
      default: Date.now 
    }
  },
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  alert_enabled: { 
    type: Boolean, 
    default: true 
  },
  detection_settings: {
    weapons: { 
      type: Boolean, 
      default: true 
    },
    suspicious_activity: { 
      type: Boolean, 
      default: true 
    },
    people_detection: { 
      type: Boolean, 
      default: true 
    },
    motion_detection: { 
      type: Boolean, 
      default: false 
    }
  },
  estado: { 
    type: String, 
    enum: ['normal', 'alerta', 'mantenimiento', 'offline'], 
    default: 'normal' 
  },
  alert_level: { 
    type: String, 
    enum: ['baja', 'media', 'alta', 'critica'], 
    default: 'baja' 
  },
  video_url: { 
    type: String 
  },
  ultima_actividad: { 
    type: Date, 
    default: Date.now 
  },
  credentials: {
    api_key: { 
      type: String 
    },
    secret_key: { 
      type: String 
    }
  }
}, { 
  timestamps: true 
});

// Índices para optimizar consultas
CamaraSchema.index({ 'ubicacion.coordinates': '2dsphere' });
CamaraSchema.index({ status: 1, alert_enabled: 1 });
CamaraSchema.index({ owner: 1 });

module.exports = mongoose.model('Camara', CamaraSchema); 