const mongoose = require('mongoose');
const categorySchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, "El nombre de la categoría es obligatorio"],
        trim: true,
        unique: true
    },
    descripcion: {
        type: String,
        default: "",
        trim: true
    }
}, {
    timestamps: true
});
module.exports = mongoose.model('Categoria', categorySchema);