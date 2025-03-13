import dotenv from 'dotenv';
import { cors } from 'hono/cors';
import productRoutes from './routes/productRoutes';
import connectDB from './config/db';
import { Hono } from 'hono';
import { serve } from 'bun';

dotenv.config();

const app = new Hono();

connectDB();

app.use(
    cors({
      origin: "*",
      allowMethods: ["GET", "POST", "PUT", "DELETE"],
    })
  );

app.route("/api/products", productRoutes);

const port = 8080;
serve(app);
console.log(`Server running on http://localhost:${port}`);
