const jwt = require('jsonwebtoken');
const User = require('../models/user');
const AppError = require('../utils/appError');
const {promisify} = require('util');
const e = require('express');
const JWT_SECRET=process.env.JWT_SECRET||'tu_secreto_jwt_aqui';
exports.protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            return next(new AppError('No estás autenticado. Por favor inicia sesión.', 401));
        }

        const decoded = await promisify(jwt.verify)(token, JWT_SECRET);

        const currentUser = await User.findById(decoded.id);

        if (!currentUser) {
            return next(new AppError('El usuario ya no existe.', 401));
        }
        req.user = currentUser;
        next();
    } catch (err) {
        next(err);
    }
};
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.rol)) {
            return next(new AppError('No tienes permiso para realizar esta acción', 403));
        }
        next();
    };
}