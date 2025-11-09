const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// --- Rutas de Agregación (Admin) ---

// GET /api/categorias/stats → contar productos por categoría
router.get('/stats', protect, restrictTo('admin'), categoryController.getCategoryStats);

// --- Rutas CRUD (Públicas vs. Admin) ---

// GET /api/categorias → listar todas las categorías (Público)
router.get('/', categoryController.getAllCategories);

// Rutas que requieren autenticación y rol de 'admin'
router.use(protect, restrictTo('admin'));

// POST /api/categorias → crear categoría
router.post('/', categoryController.createCategory);

// DELETE /api/categorias/:id → eliminar categoría
// Se debe implementar el controlador de eliminación aquí
// router.delete('/:id', categoryController.deleteCategory); 

module.exports = router;