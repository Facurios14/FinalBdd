const Cart = require('../models/cart');
const Product = require('../models/product');
const Order = require('../models/order');
const AppError = require('../utils/appError');

// --- 1. CRUD de Carrito ---

/**
 * Obtener el carrito de un usuario (GET /api/carrito/:userId)
 * Requiere: Dueño del carrito o Admin
 */
exports.getCartByUserId = async (req, res, next) => {
    try {
        const userId = req.params.userId;

        // 1. Verificación de Autorización (solo el dueño o admin)
        if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
            return next(new AppError('No tienes permiso para ver este carrito.', 403));
        }
        
        // 2. Buscar el carrito y popular los detalles del producto
        const cart = await Cart.findOne({ user: userId })
            .populate({
                path: 'items.product',
                select: 'name price stock brand' // Solo los campos necesarios
            });

        if (!cart) {
            // Si no hay carrito, devolvemos un carrito vacío (pero válido)
            return res.status(200).json({ 
                success: true, 
                data: { cart: { user: userId, items: [] } } 
            });
        }

        res.status(200).json({
            success: true,
            data: { cart }
        });

    } catch (err) {
        next(err);
    }
};

/**
 * Añadir/Actualizar un producto en el carrito (POST /api/carrito)
 * Requiere: Cliente
 * Utiliza: $push, $set
 */
exports.addItemToCart = async (req, res, next) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.user._id;

        // 1. Verificar si el producto existe y tiene stock suficiente
        const product = await Product.findById(productId);
        if (!product || product.stock < quantity) {
            return next(new AppError(`Stock insuficiente para el producto: ${product ? product.name : productId}. Stock disponible: ${product ? product.stock : 0}.`, 400));
        }

        // 2. Buscar si el usuario ya tiene un carrito
        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            // Si no existe, creamos uno nuevo
            cart = await Cart.create({
                user: userId,
                items: [{ product: productId, quantity }]
            });
        } else {
            // Si existe, verificamos si el producto ya está
            const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

            if (itemIndex > -1) {
                // Producto ya en el carrito: Modificamos la cantidad
                const newQuantity = cart.items[itemIndex].quantity + quantity;
                if (product.stock < newQuantity) {
                     return next(new AppError('La cantidad total excede el stock disponible.', 400));
                }

                cart = await Cart.findOneAndUpdate(
                    { user: userId, "items.product": productId },
                    { $set: { "items.$.quantity": newQuantity } }, // $set en sub-documentos
                    { new: true }
                ).populate({ path: 'items.product', select: 'name price' });
                
            } else {
                // Producto no está en el carrito: Añadimos un nuevo ítem
                cart = await Cart.findOneAndUpdate(
                    { user: userId },
                    { $push: { items: { product: productId, quantity } } }, // $push para agregar
                    { new: true }
                ).populate({ path: 'items.product', select: 'name price' });
            }
        }
        
        res.status(200).json({
            success: true,
            message: 'Producto añadido/actualizado en el carrito.',
            data: { cart }
        });

    } catch (err) {
        next(err);
    }
};

/**
 * Eliminar un producto del carrito (DELETE /api/carrito/item/:productId)
 * Requiere: Cliente
 * Utiliza: $pull
 */
exports.removeItemFromCart = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const productId = req.params.productId;

        // Usamos $pull para remover un ítem del array 'items' que coincida con el productId
        const cart = await Cart.findOneAndUpdate(
            { user: userId },
            { $pull: { items: { product: productId } } }, // $pull para eliminar por coincidencia
            { new: true }
        ).populate({ path: 'items.product', select: 'name price' });

        if (!cart) {
            return next(new AppError('No se encontró un carrito para este usuario.', 404));
        }

        res.status(200).json({
            success: true,
            message: 'Producto eliminado del carrito.',
            data: { cart }
        });
    } catch (err) {
        next(err);
    }
};

// --- 2. Convertir a Pedido ---

/**
 * Crea una orden a partir del carrito (POST /api/ordenes)
 * Requiere: Cliente (y la lógica de stock)
 */
exports.checkout = async (req, res, next) => {
    // Nota: Es crucial usar transacciones si se usara una BD relacional,
    // pero con MongoDB, podemos manejar la lógica de negocio y rollbacks manualmente
    // o usar transacciones si el clúster lo soporta. Aquí lo haremos secuencialmente.
    
    try {
        const userId = req.user._id;
        const { paymentMethod } = req.body;

        if (!paymentMethod) {
            return next(new AppError('El método de pago es obligatorio.', 400));
        }

        const cart = await Cart.findOne({ user: userId })
            .populate({
                path: 'items.product',
                select: 'name price stock'
            });

        if (!cart || cart.items.length === 0) {
            return next(new AppError('El carrito está vacío.', 400));
        }

        let orderItems = [];
        let total = 0;
        let updates = []; // Array para almacenar las promesas de actualización de stock

        // 1. Recorrer el carrito, verificar stock, calcular subtotal y preparar OrderItems (INMUTABLE)
        for (const item of cart.items) {
            const product = item.product; // Producto populado
            
            // Verificación final de stock antes de la compra
            if (product.stock < item.quantity) {
                 return next(new AppError(`Stock insuficiente para ${product.name}. Solo quedan ${product.stock} unidades.`, 400));
            }

            const subtotal = product.price * item.quantity;
            total += subtotal;

            // Preparamos el item de la orden (capturando valores en el tiempo de la compra)
            orderItems.push({
                productId: product._id,
                productName: product.name,
                productPrice: product.price,
                quantity: item.quantity,
                subtotal: subtotal
            });

            // Preparamos la operación de actualización de stock (usando $inc)
            updates.push(
                Product.findByIdAndUpdate(product._id, { 
                    $inc: { stock: -item.quantity } // $inc: decrementa el stock
                })
            );
        }

        // 2. Ejecutar todas las actualizaciones de stock
        await Promise.all(updates);

        // 3. Crear el documento de la Orden
        const newOrder = await Order.create({
            user: userId,
            items: orderItems,
            total: total,
            status: 'pagado', // Asumimos que si pasa el checkout, está pagado
            paymentMethod: paymentMethod,
            address: req.user.address // Usamos la dirección del usuario logueado
        });

        // 4. Eliminar el carrito después de la compra
        await Cart.findOneAndDelete({ user: userId });

        res.status(201).json({
            success: true,
            message: 'Orden creada y stock actualizado exitosamente.',
            data: { order: newOrder }
        });

    } catch (err) {
        next(err);
    }
};