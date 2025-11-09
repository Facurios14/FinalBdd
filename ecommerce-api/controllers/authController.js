const User = require('../models/user');
const { generateToken } = require('../utils/tokenUtils');
const AppError = require('../utils/appError');
const createSendToken = (user, statusCode, res) => {
    const token = generateToken({ id: user._id });
    user.password = undefined;
    res.status(statusCode).json({
        success: true,
        data: {
            token,
            user
        }
    });
};
exports.register = async (req, res, next) => {
    try {
        const newUser = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            address: req.body.address,
            celular: req.body.celular,
            rol : req.body.rol || 'client',
        });
        createSendToken(newUser, 201, res);
    } catch (err) {
        if (err.code === 11000) {
            err.message = 'El email ya está registrado.';
            err.statusCode = 400;
        }
        next(err);
    }
};
exports.login = async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new AppError('Por favor ingrese email y contraseña', 400));
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
        return next(new AppError('Email o contraseña incorrectos', 401));
    }
    createSendToken(user, 200, res);
};