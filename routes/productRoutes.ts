import express from 'express';
import { hello } from '../controllers/greetingsController';
import { createProduct } from '../controllers/productController';

const router = express.Router();

router.get('/hello', hello);
router.post('/create-product', createProduct);

export default router;