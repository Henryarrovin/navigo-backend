import express from 'express';
import { hello } from '../controllers/greetingsController';

const router = express.Router();

router.get('/hello', hello);

export default router;