import dotenv from 'dotenv';
import { cors } from 'hono/cors';
import connectDB from './config/db';
import { Hono } from 'hono';
import { serve } from 'bun';
import router from './routes';

dotenv.config();

const app = new Hono();

connectDB();

app.use(
    cors({
      origin: "*",
      allowMethods: ["GET", "POST", "PUT", "DELETE"],
    })
  );

app.route("/api", router);

const port = 8080;
serve(app);
console.log(`Server running on http://localhost:${port}`);
