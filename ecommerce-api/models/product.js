const mongoose = require('mongoose');
const { ref } = require('process');

const productSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, "El nombre del producto es obligatorio"],
        trim: true
    },
    descripcion: {
        type: String,
        required: [true, "La descripción del producto es obligatoria"],
        trim: true
    },
    precio: {
        type: Number,
        required: [true, "El precio del producto es obligatorio"],
        min: [0, "El precio no puede ser negativo"]
    },
    categoria: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Categoria',
        required: [true, "La categoría del producto es obligatoria"],
        trim: true
    },
    stock: {
        type: Number,
        required: [true, "El stock del producto es obligatorio"],
        min: [0, "El stock no puede ser negativo"]
    },
}, {
    timestamps: true
});
module.exports = mongoose.model('Producto', productSchema);
