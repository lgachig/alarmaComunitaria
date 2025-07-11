import { Router } from 'express';
import Punto from '../models/Punto';
import { Types } from 'mongoose';

const router = Router();

// GET todos los puntos
router.get('/', async (req, res) => {
  try {
    const puntos = await Punto.find();
    res.json(puntos);
  } catch (err) {
    console.error('Error al obtener puntos:', err);
    res.status(500).json({ error: 'Error al obtener puntos' });
  }
});

// POST crear nuevo punto
router.post('/', async (req, res) => {
  try {
    // Validación básica
    if (!req.body.usuarioId || !Types.ObjectId.isValid(req.body.usuarioId)) {
      return res.status(400).json({ error: 'ID de usuario inválido o faltante' });
    }

    const puntoData = {
      ...req.body,
      usuarioId: new Types.ObjectId(req.body.usuarioId)
    };

    const punto = new Punto(puntoData);
    const savedPunto = await punto.save();

    // Populate para obtener datos del usuario
    const puntoConUsuario = await Punto.findById(savedPunto._id)
      .populate('usuarioId', 'name email');

    res.status(201).json(puntoConUsuario);
  } catch (err: any) {
    console.error('Error al guardar punto:', err);

    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e: any) => e.message);
      return res.status(400).json({ errors });
    }

    res.status(500).json({ error: 'Error al guardar el punto' });
  }
});

// POST crear múltiples puntos
router.post('/bulk', async (req, res) => {
  try {
    if (!Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Se espera un array de puntos' });
    }

    // Validar y transformar usuarioId
    const puntosData = req.body.map(punto => ({
      ...punto,
      usuarioId: new Types.ObjectId(punto.usuarioId)
    }));

    const puntos = await Punto.insertMany(puntosData);
    res.status(201).json(puntos);
  } catch (err) {
    console.error('Error al guardar múltiples puntos:', err);
    res.status(500).json({ error: 'Error al guardar puntos' });
  }
});

export default router;
