import type { Request, RequestHandler, Response } from "express";
import { ProductModel } from "../models/productModel";

export const createProduct: RequestHandler = async (req: Request, res: Response) => {
    try {
        const {
            name,
            category,
            description,
            price,
            image,
            coordinates
        } = req.body;

        if (!name || !category || !description || !price || !image || !coordinates || typeof coordinates.x !== 'number' || typeof coordinates.y !== 'number') {
            res.status(400).json({ error: "Please fill in all fields" });
            return;
        }

        const newProduct = new ProductModel({
            name,
            category,
            description,
            price,
            image,
            coordinates
        });
        await newProduct.save();

        res.status(201).json({
            message: "Product created successfully",
            product: newProduct
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Error creating product" });
    }
}