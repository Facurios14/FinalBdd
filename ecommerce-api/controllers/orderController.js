const Order = require('../models/order');
const AppError = require('../utils/appError');
const mongoose = require('mongoose');

// --- CRUD y Listado ---

/**
 * Obtener pedidos de un usuario específico (GET /api/ordenes/user/:userId)
 * Requiere: Cliente (dueño) o Admin.
 */
exports.getOrdersByUserId = async (req, res, next) => {
    try {
        const userId = req.params.userId;

        // 1. Verificación de Autorización (solo el dueño o admin)
        if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
            return next(new AppError('No tienes permiso para ver los pedidos de este usuario.', 403));
        }

        const orders = await Order.find({ user: userId }).sort('-orderDate'); // El guion indica orden descendente

        res.status(200).json({
            success: true,
            results: orders.length,
            data: { orders }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Actualiza el estado de un pedido (PATCH /api/ordenes/:id/status)
 * Requiere: Admin.
 * Utiliza: $set.
 */
exports.updateOrderStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        
        if (!status) {
            return next(new AppError('El campo "status" es obligatorio para la actualización.', 400));
        }

        // Valida que el estado sea uno de los permitidos por el enum en el modelo
        if (!Order.schema.path('status').enumValues.includes(status)) {
             return next(new AppError('Estado no válido.', 400));
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { $set: { status: status } }, // $set: operador de modificación
            { new: true, runValidators: true }
        );

        if (!order) {
            return next(new AppError('No se encontró un pedido con ese ID.', 404));
        }

        res.status(200).json({
            success: true,
            message: `Estado de la orden ${req.params.id} actualizado a ${status}.`,
            data: { order }
        });
    } catch (err) {
        next(err);
    }
};

// --- Agregación ---

/**
 * Estadísticas de Pedidos por Estado (GET /api/ordenes/stats)
 * Requiere: Admin.
 * Utiliza: $group, $count.
 */
exports.getOrderStats = async (req, res, next) => {
    try {
        const stats = await Order.aggregate([
            // 1. $group: Agrupa los pedidos por su 'status'
            {
                $group: {
                    _id: '$status', // Agrupa por el estado del pedido
                    count: { $sum: 1 }, // Cuenta cuántos pedidos hay en cada grupo
                    totalRevenue: { $sum: '$total' } // Suma el campo 'total' para obtener ingresos por estado
                }
            },
            // 2. $sort: Opcional, ordena por el conteo de pedidos (descendente)
            { $sort: { count: -1 } },
            // 3. $project: Formatea la salida (opcional, pero buena práctica)
            {
                $project: {
                    _id: 0,
                    status: '$_id',
                    orderCount: '$count',
                    totalRevenue: 1
                }
            }
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