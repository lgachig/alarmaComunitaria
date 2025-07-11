import mongoose, { Schema, Document, Types } from 'mongoose';
import { IUser } from './User';

export interface IPunto extends Document {
  tipo: 'robo' | 'secuestro' | 'camara';
  lat: number;
  lng: number;
  titulo: string;
  descripcion: string;
  fecha?: string;
  usuarioId: Types.ObjectId | IUser;
  direccion?: string;
}

const PuntoSchema: Schema = new Schema({
  tipo: {
    type: String,
    enum: ['robo', 'secuestro', 'camara'],
    required: true
  },
  lat: {
    type: Number,
    required: true
  },
  lng: {
    type: Number,
    required: true
  },
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    required: true,
    trim: true
  },
  fecha: {
    type: String,
    default: new Date().toISOString().split('T')[0]
  },
  usuarioId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    validate: {
      validator: async (value: Types.ObjectId) => {
        const user = await mongoose.model('User').findById(value);
        return user !== null;
      },
      message: 'El usuario no existe'
    }
  },
  direccion: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

export default mongoose.model<IPunto>('Punto', PuntoSchema);
