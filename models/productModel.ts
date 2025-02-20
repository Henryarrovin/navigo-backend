import mongoose from "mongoose";

interface Coordinates {
    x: number;
    y: number;
}

interface Product extends mongoose.Document {
    name: string;
    category: string;
    description: string;
    price: number;
    image: string;
    coordinates: Coordinates;
}

const productSchema = new mongoose.Schema<Product>({
    name: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    coordinates: {
        x: { type: Number, required: true },
        y: { type: Number, required: true },
    },
});

export const ProductModel = mongoose.model<Product>("Product", productSchema);