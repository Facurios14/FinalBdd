const Product = require('../models/product');
const AppError = require('../utils/appError');
const mongoose = require('mongoose');
const Category = require('../models/category');
const Review = require('../models/review');
const express = require('express');
exports.createProduct = async (req, res, next) => {
    try {
        const categoryExists = await Category.findById(req.body.category);
        if (!categoryExists) {
            return next(new AppError('ID de categoría no válido o no existe.', 400));
        }

        const newProduct = await Product.create(req.body);

        res.status(201).json({
            success: true,
            data: { product: newProduct }
        });
    } catch (err) {
        next(err);
    }
};
exports.getAllProducts = async (req, res, next) => {
    try {
        const products = await Product.find().populate('category').populate('reviews');
        res.status(200).json({
            success: true,
            results: products.length,
            data: { products }
        });
    } catch (err) {
        next(err);
    }
};
exports.updateStock = async (req, res, next) => {
    try {
        const { stock } = req.body;

        if (stock === undefined || stock === null) {
            return next(new AppError('El campo "stock" es obligatorio.', 400));
        }

        // Usamos $set (Modificación) para actualizar el stock (requisito) [cite: 66]
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: { stock: stock } },
            { new: true, runValidators: true }
        );

        if (!product) {
            return next(new AppError('No se encontró un producto con ese ID.', 404));
        }

        res.status(200).json({
            success: true,
            data: { product }
        });

    } catch (err) {
        next(err);
    }
};
exports.filterProducts = async (req, res, next) => {
    try {
        const { price_min, price_max, brand } = req.query;

        // Construcción de la consulta con operadores de comparación [cite: 66]
        const filter = {};

        // 1. Filtro por precio (rango de precio)
        if (price_min || price_max) {
            filter.price = {};
            if (price_min) {
                // $gte: greater than or equal [cite: 66]
                filter.price.$gte = Number(price_min);
            }
            if (price_max) {
                // $lte: less than or equal [cite: 66]
                filter.price.$lte = Number(price_max);
            }
        }

        // 2. Filtro por marca
        if (brand) {
            // Usamos una expresión regular para búsqueda insensible a mayúsculas/minúsculas
            filter.brand = { $regex: brand, $options: 'i' };
        }

        const products = await Product.find(filter).populate('category');

        res.status(200).json({
            success: true,
            results: products.length,
            data: { products }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Productos más reseñados (GET /api/productos/top)
 * Calcula el promedio de calificaciones por producto y lista el top 10.
 * Requiere: Agregación ($group, $avg, $sort, $lookup) 
 */
exports.getTopReviewedProducts = async (req, res, next) => {
    try {
        const topProducts = await Review.aggregate([
            // 1. $group: Agrupa por producto y calcula el promedio 
            {
                $group: {
                    _id: '$product', // Agrupa por el ID del producto
                    averageRating: { $avg: '$rating' }, // $avg: promedio de las calificaciones 
                    reviewCount: { $sum: 1 } // Cuenta el número de reseñas
                }
            },
            // 2. $sort: Ordena por el promedio de calificación (descendente) 
            { $sort: { averageRating: -1, reviewCount: -1 } },
            // 3. $limit: Solo queremos el top 10
            { $limit: 10 },
            // 4. $lookup: Trae los datos del producto usando el ID agrupado (_id) 
            {
                $lookup: {
                    from: 'products', // La colección de destino (Mongoose la pluraliza automáticamente)
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            // 5. $unwind: Desestructura el array productDetails (será un solo elemento) 
            { $unwind: '$productDetails' },
        ]);

        res.status(200).json({
            success: true,
            results: topProducts.length,
            data: { topProducts }
        });
    } catch (err) {
        next(err);
    }
};