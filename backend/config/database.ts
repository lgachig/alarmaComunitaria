import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://elluis20026:CRUZlucho.com@practica.81cgj.mongodb.net/alarmaComunitaria';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB conectado exitosamente');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
};
