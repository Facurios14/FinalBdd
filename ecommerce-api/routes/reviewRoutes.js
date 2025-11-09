const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams si la montamos en otra ruta
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

// --- Rutas Públicas y Protegidas ---

// GET /api/resenas/:productId → Listar reseñas de un producto (Público)
router.get('/:productId', reviewController.getReviewsByProduct);

// POST /api/resenas → Crear reseña (Requiere Token)
router.post('/', protect, reviewController.createReview); 

// Puedes añadir rutas para actualizar o eliminar reseñas aquí, 
// protegiéndolas para que solo el dueño de la reseña o un Admin puedan modificarlas.

module.exports = router;