import mongoose from "mongoose";

interface ICoordinates {
    x: number;
    y: number;
}

interface IProduct extends mongoose.Document {
    name: string;
    category: mongoose.Schema.Types.ObjectId;
    description?: string;
    price: number;
    image?: string;
    coordinates?: ICoordinates;
}

const productSchema = new mongoose.Schema<IProduct>({
    name: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    coordinates: { x: Number, y: Number },
});

const ProductModel = mongoose.model<IProduct>("Product", productSchema);
export default ProductModel;
