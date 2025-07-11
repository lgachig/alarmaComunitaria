const express = require('express');
const router = express.Router();
const puntosController = require('../controllers/puntosController');

router.get('/', puntosController.getPuntos);
router.post('/', puntosController.createPunto);
router.post('/bulk', puntosController.createPuntosBulk);

module.exports = router;
