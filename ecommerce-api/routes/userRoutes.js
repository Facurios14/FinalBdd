const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const {protect,restrictTo} = require('../middlewares/authMiddleware');
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/', protect, restrictTo('admin'), async (req, res, next) => {
    // Aquí iría el controlador para listar todos los usuarios
    // Por ahora, solo devolvemos un mensaje de éxito
    res.status(200).json({ success: true, message: 'Ruta protegida por Admin: Listar usuarios.' });
});
router.get('/:id', protect, async (req, res, next) => {
    // El controlador debe verificar si req.user.id == req.params.id O req.user.role == 'admin'
    res.status(200).json({ success: true, message: 'Ruta protegida: Detalle de usuario.' });
});
router.delete('/:id', protect, restrictTo('admin'), async (req, res, next) => {
    // Aquí iría el controlador para eliminar usuario y carrito
    res.status(204).json({ success: true, data: null }); // 204 No Content
});

module.exports = router;