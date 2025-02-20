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

export const getAllProducts = async (req: Request, res: Response) => {
    try {
        const products = await ProductModel.find();
        res.status(200).json(products);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Error fetching products" });
    }
}

export const getProductById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const product = await ProductModel.findById(id);
        if (!product) {
            res.status(404).json({ error: "Product not found" });
            return;
        }
        res.status(200).json(product);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Error fetching product" });
    }
}