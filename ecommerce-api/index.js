const express=require('express');
const mongoose=require('mongoose');
const dotenv=require('dotenv');
const userRoutes=require('./routes/userRoutes');
const productRoutes=require('./routes/productRoutes');
const userRoutes=require('./routes/userRoutes');
const categoryRoutes=require('./routes/categoryRoutes');
const cartRoutes=require('./routes/cartRoutes');
const orderRoutes=require('./routes/orderRoutes');
const reviewRoutes=require('./routes/reviewRoutes');
app.use('/api/reviews',reviewRoutes);
app.use('/api/orders',orderRoutes);
app.use('/api/cart',cartRoutes);
app.use('/api/categories',categoryRoutes);
app.use('/api/users',userRoutes);
dotenv.config();
app.use('/api/products',productRoutes);
const app=express();
app.use(express.json());
const MONGO_URI=process.env.MONGO_URI||'mongodb://localhost:27017/ecommerce';
mongoose.connect(MONGO_URI)
    .then(()=>console.log('Conectado a la base de datos MongoDB'))
    .catch(err=>console.error('Error al conectar a la base de datos MongoDB:', err));
app.use((err, req, res, next) => {
    console.error(err.stack);

    // Formato de respuesta de error requerido [cite: 78, 79, 81]
    res.status(err.statusCode || 500).json({
        success: false,
        error: {
            message: err.message || 'Error interno del servidor'
        }
    });
});
const PORT=process.env.PORT||3000;
app.listen(PORT,()=>{
    console.log(`Servidor escuchando en el puerto ${PORT}`);
    console.log(`Accede a la API en http://localhost:${PORT}`);
});
