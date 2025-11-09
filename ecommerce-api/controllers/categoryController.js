// controllers/categoryController.js

const Category = require('../models/category');
const AppError = require('../utils/appError');
const Product = require('../models/product'); // Necesario para la agregación de estadísticas

// --- CRUD BÁSICO ---

/**
 * Crea una nueva categoría (POST /api/categorias)
 * Requiere: Admin
 */
exports.createCategory = async (req, res, next) => {
    try {
        const newCategory = await Category.create(req.body);

        res.status(201).json({
            success: true,
            data: { category: newCategory }
        });
    } catch (err) {
        // Manejo de error de unicidad (nombre duplicado)
        if (err.code === 11000) {
            err.message = 'Ya existe una categoría con este nombre.';
            err.statusCode = 400;
        }
        next(err);
    }
};

/**
 * Lista todas las categorías (GET /api/categorias)
 * Requiere: Público
 */
exports.getAllCategories = async (req, res, next) => {
    try {
        const categories = await Category.find();

        res.status(200).json({
            success: true,
            results: categories.length,
            data: { categories }
        });
    } catch (err) {
        next(err);
    }
};

// ... otras funciones CRUD (detalle, actualizar, eliminar)
// La eliminación de una categoría debe considerarse cuidadosamente, ya que dejaría a los productos 'huérfanos'
exports.getCategoryStats = async (req, res, next) => {
    try {
        const stats = await Product.aggregate([
            // 1. $group: Agrupa los productos por su campo 'category' (el ObjectId)
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 } // Cuenta cuántos productos hay en cada grupo
                }
            },
            // 2. $lookup: Trae los datos de la categoría usando el _id agrupado
            {
                $lookup: {
                    from: 'categories', // La colección de destino (Mongoose la pluraliza)
                    localField: '_id',
                    foreignField: '_id',
                    as: 'categoryDetails'
                }
            },
            // 3. $unwind: Desestructura el array 'categoryDetails' para obtener el objeto de categoría directamente
            {
                $unwind: '$categoryDetails'
            },
            // 4. $project: Formatea la salida para ser más clara
            {
                $project: {
                    _id: 0, // Oculta el _id del producto
                    categoryName: '$categoryDetails.name',
                    productCount: '$count'
                }
            },
            // 5. $sort: Opcional, ordena por el número de productos
            { $sort: { productCount: -1 } }
        ]);

        res.status(200).json({
            success: true,
            results: stats.length,
            data: { stats }
        });
    } catch (err) {
        next(err);
    }
};