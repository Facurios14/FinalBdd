const jwt = require('jsonwebtoken');
const JWT_SECRET=process.env.JWT_SECRET||'tu_secreto_jwt_aqui';
const JWT_EXPIRES_IN='1h';
exports.generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};