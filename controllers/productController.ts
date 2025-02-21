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

// export const updateProduct = async (req: Request, res: Response) => {
//     try {
//         const { id } = req.params;
//         const {
//             name,
//             category,
//             description,
//             price,
//             image,
//             coordinates
//         } = req.body;   

//         if (!name || !category || !description || !price || !image || !coordinates || typeof coordinates.x !== 'number' || typeof coordinates.y !== 'number') {
//             res.status(400).json({ error: "Please fill in all fields" });
//             return;
//         }

//         const updatedProduct = await ProductModel.findByIdAndUpdate(id, {
//             name,
//             category,
//             description,
//             price,
//             image,
//             coordinates
//         }, { new: true });

//         if (!updatedProduct) {
//             res.status(404).json({ error: "Product not found" });
//             return;
//         }

//         res.status(200).json({
//             message: "Product updated successfully",
//             product: updatedProduct
//         });
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ error: "Error updating product" });
//     }
// }

export const updateProduct: RequestHandler = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData: any = {};

        if (req.body.name) updateData.name = req.body.name;
        if (req.body.category) updateData.category = req.body.category;
        if (req.body.description) updateData.description = req.body.description;
        if (req.body.price) updateData.price = req.body.price;
        if (req.body.image) updateData.image = req.body.image;
        if (req.body.coordinates) {
            if (typeof req.body.coordinates.x === 'number') updateData["coordinates.x"] = req.body.coordinates.x;
            if (typeof req.body.coordinates.y === 'number') updateData["coordinates.y"] = req.body.coordinates.y;
        }

        const updatedProduct = await ProductModel.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedProduct) {
            res.status(404).json({ error: "Product not found" });
            return;
        }

        res.status(200).json({
            message: "Product updated successfully",
            product: updatedProduct
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Error updating product" });
    }
};

export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deletedProduct = await ProductModel.findByIdAndDelete(id);

        if (!deletedProduct) {
            res.status(404).json({ error: "Product not found" });
            return;
        }

        res.status(200).json({
            message: "Product deleted successfully",
            product: deletedProduct
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Error deleting product" });
    }
}