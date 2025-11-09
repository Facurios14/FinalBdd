const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

// TODAS las rutas de carrito requieren token
router.use(protect); 

// GET /api/carrito/:userId → Obtener el carrito de un usuario
router.get('/:userId', cartController.getCartByUserId); 

// POST /api/carrito → Añadir o actualizar producto en el carrito
router.post('/', cartController.addItemToCart);

// DELETE /api/carrito/item/:productId → Eliminar un ítem del carrito
router.delete('/item/:productId', cartController.removeItemFromCart);

module.exports = router;