const mongoose = require('mongoose');
const cartSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "El usuario es obligatorio"],
        unique: true
    },
    productos: [{
        producto: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Producto',
            required: [true, "El producto es obligatorio"]
        },
        cantidad: {
            type: Number,
            required: [true, "La cantidad es obligatoria"],
            min: [1, "La cantidad mínima es 1"],
            default: 1,
        }
    }]
}, {
    timestamps: true
});
module.exports = mongoose.model('Cart', cartSchema);