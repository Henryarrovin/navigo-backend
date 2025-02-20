import express from 'express';
import { hello } from '../controllers/greetingsController';
import { createProduct, getAllProducts, getProductById } from '../controllers/productController';

const router = express.Router();

router.get('/hello', hello);
router.post('/product', createProduct);
router.get('/product', getAllProducts);
router.get('/product/:id', getProductById);

export default router;