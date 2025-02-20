import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import productRoutes from './routes/productRoutes';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
const port = 8080;

mongoose
    .connect(process.env.MONGO_URI as string)
    .then(() => console.log("Connected to MongoDB"))
    .catch((error) => console.log("Error connecting to MongoDB:", error.message));

app.use("/api", productRoutes);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
