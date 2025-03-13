import mongoose from "mongoose";

interface Category extends mongoose.Document {
    id: string;
    name: string;
}

const categorySchema = new mongoose.Schema<Category>({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
});

const Category = mongoose.model<Category>("Category", categorySchema);
export default Category;
