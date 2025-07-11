const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/users', userController.getUsers);
router.post('/auth/register', userController.registerUser);
router.post('/auth/login', userController.loginUser);

module.exports = router;
