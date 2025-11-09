const mongoose = require('mongoose');

// Definición del Sub-esquema para los Ítems del Pedido
// Nota: Aquí guardamos la información del producto (nombre, precio) directamente,
// en lugar de solo una referencia, para que la orden sea inmutable.
const OrderItemSchema = new new mongoose.Schema({
    productId: { // Guardamos el ID solo para referencia futura (e.g., para la reseña)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    productName: { // Instantánea del nombre
        type: String,
        required: true
    },
    productPrice: { // Instantánea del precio
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    subtotal: { // Calculado: productPrice * quantity
        type: Number,
        required: true
    }
}, { _id: false });

// Definición del Esquema Principal del Pedido
const OrderSchema = new mongoose.Schema({
    user: {
        // Referencia al cliente que realiza la compra
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'La orden debe estar asociada a un usuario.']
    },
    items: {
        // Array de sub-documentos que capturan los detalles de la compra
        type: [OrderItemSchema],
        required: [true, 'La orden debe tener al menos un ítem.']
    },
    total: {
        type: Number,
        required: [true, 'El total de la orden es obligatorio.'],
        min: 0
    },
    status: { // Necesario para la ruta de actualización de estado
        type: String,
        enum: ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado'],
        default: 'pendiente'
    },
    paymentMethod: {
        type: String,
        required: [true, 'El método de pago es obligatorio.']
    },
    address: { // Podemos capturar la dirección de envío actual del usuario
        type: Object,
        required: false // Puede ser capturada del User en el controlador
    },
    orderDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Order', OrderSchema);