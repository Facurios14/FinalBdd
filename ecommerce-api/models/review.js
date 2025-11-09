const mongoose = require('mongoose');
const reviewSchema = new mongoose.Schema({
    producto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Producto',
        required: [true, "El producto es obligatorio"]
    },
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "El usuario es obligatorio"]
    },
    calificacion: {
        type: Number,
        required: [true, "La calificación es obligatoria"],
        min: [1, "La calificación mínima es 1"],
        max: [5, "La calificación máxima es 5"]
    },
    comentario: {
        type: String,
        trim: true,
        default: "",
        maxlength: [500, "El comentario no puede exceder los 500 caracteres"]
    }
}, {
    timestamps: true
});
reviewSchema.index({ producto: 1, usuario: 1 }, { unique: true });
module.exports = mongoose.model('Review', reviewSchema);