import express from 'express';
import { hello } from '../controllers/greetingsController';
import { createProduct, getAllProducts } from '../controllers/productController';

const router = express.Router();

router.get('/hello', hello);
router.post('/create-product', createProduct);
router.get('/get-all-products', getAllProducts);

export default router;