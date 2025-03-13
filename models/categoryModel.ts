import mongoose from "mongoose";

interface Category extends mongoose.Document {
    name: string;
}

const categorySchema = new mongoose.Schema<Category>({
    name: { type: String, required: true },
});

const Category = mongoose.model<Category>("Category", categorySchema);
export default Category;
