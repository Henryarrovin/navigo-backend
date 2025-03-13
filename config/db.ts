import mongoose from "mongoose";

const connectDB = async () => {
    mongoose
    .connect(process.env.MONGO_URI as string)
    .then(() => console.log("Connected to MongoDB"))
    .catch((error) => console.log("Error connecting to MongoDB:", error.message));
}

export default connectDB;
