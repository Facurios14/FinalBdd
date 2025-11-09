const Review = require('../models/review');
const Product = require('../models/product');
const Order = require('../models/order'); // Necesario para la validación de compra
const AppError = require('../utils/appError');
const mongoose = require('mongoose');

// --- Listado y CRUD ---

/**
 * Listar todas las reseñas de un producto (GET /api/resenas/:productId)
 * Requiere: Público.
 */
exports.getReviewsByProduct = async (req, res, next) => {
    try {
        const productId = req.params.productId;

        // Validar que el ID de producto sea válido antes de buscar
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return next(new AppError('ID de producto no válido.', 400));
        }

        // Buscar y popular el usuario que dejó la reseña
        const reviews = await Review.find({ product: productId })
            .populate({
                path: 'user',
                select: 'name email' // Solo los datos básicos del usuario
            })
            .sort('-createdAt'); // Reseñas más recientes primero

        res.status(200).json({
            success: true,
            results: reviews.length,
            data: { reviews }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Crear una nueva reseña (POST /api/resenas)
 * Requiere: Cliente (Token) y haber comprado el producto.
 */
exports.createReview = async (req, res, next) => {
    try {
        const { product: productId, rating, comment } = req.body;
        const userId = req.user._id;

        // 1. Validación de Compra (Requisito clave)
        // Buscamos si existe un pedido del usuario que contenga el producto.
        const hasPurchased = await Order.findOne({
            user: userId,
            // $elemMatch busca un sub-documento que coincida con ambas condiciones
            items: { $elemMatch: { productId: productId } } 
        });

        if (!hasPurchased) {
            return next(new AppError('Solo puedes reseñar productos que has comprado.', 403));
        }

        // 2. Validación de Reseña Única (Garantizada por el índice compuesto en el modelo)
        const existingReview = await Review.findOne({ user: userId, product: productId });
        if (existingReview) {
            return next(new AppError('Ya has dejado una reseña para este producto. Puedes editar la anterior.', 400));
        }

        // 3. Crear la reseña
        const newReview = await Review.create({
            user: userId,
            product: productId,
            rating,
            comment
        });

        res.status(201).json({
            success: true,
            message: 'Reseña creada exitosamente.',
            data: { review: newReview }
        });
    } catch (err) {
        next(err);
    }
};