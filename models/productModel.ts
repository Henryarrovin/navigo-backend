import mongoose from "mongoose";

interface ICoordinates {
    x: number;
    y: number;
}

interface IProduct extends mongoose.Document {
    name: string;
    category: mongoose.Schema.Types.ObjectId;
    description: string;
    price: number;
    image: string;
    location: {
        coordinates: ICoordinates;
        zone: mongoose.Schema.Types.ObjectId;
    };
}

const productSchema = new mongoose.Schema<IProduct>({
    name: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    location: {
        coordinates: {
            x: { type: Number, required: true },
            y: { type: Number, required: true }
        },
        zone: { type: mongoose.Schema.Types.ObjectId, ref: "MapZone", required: true }
    }
});

// Create 2d index for spatial queries
productSchema.index({ "location.coordinates": "2d" });

const Product = mongoose.model<IProduct>("Product", productSchema);
export default Product;
