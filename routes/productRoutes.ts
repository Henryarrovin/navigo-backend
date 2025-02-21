import express from 'express';
import { hello } from '../controllers/greetingsController';
import { createProduct, deleteProduct, getAllProducts, getProductById, updateProduct } from '../controllers/productController';

const router = express.Router();

router.get('/hello', hello);
router.post('/product', createProduct);
router.get('/product', getAllProducts);
router.get('/product/:id', getProductById);
router.put('/product/:id', updateProduct);
router.delete('/product/:id', deleteProduct);

export default router;