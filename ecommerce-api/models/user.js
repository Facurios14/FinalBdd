const mongoose = require('mongoose');
const bcrypt = require('bcrypt');


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true,"Nombre es obligatorio"],
        trim: true
    },
    email: {
        type: String,
        required: [true,"Email es obligatorio"],
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true,"Contraseña es obligatoria"],
        minlenghth: 6,
        select: false,
    },
    address: {
        calle: { type: String, trim: true },
        ciudad: { type: String, trim: true },
        zipCode: { type: String, trim: true },
        pais: { type: String, default: 'Argentina' }
    },
    celular: {
        type: String,
        trim: true
    },
    rol:{
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    }, {
        timestamps: true
    });
    userSchema.pre('save', async function(next){
        if(!this.isModified('password')){
            return next();
        this.password = await bcrypt.hash(this.password,10);
        next();
        }
    });
    userSchema.methods.comparePassword = async function(candidatePassword){
        return await bcrypt.compare(candidatePassword, this.password);
    };
    module.exports = mongoose.model('User', userSchema);
