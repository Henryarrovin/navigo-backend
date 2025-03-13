import type { Context } from "hono";
import Product from "../models/productModel";
import Category from "../models/categoryModel";

export const createProduct = async (c: Context) => {
    try {
        const body = await c.req.json();
        const { name, category, description, price, image, coordinates } = body;

        if (!name || !category || !description || !price || !image || !coordinates || 
            typeof coordinates.x !== 'number' || typeof coordinates.y !== 'number') {
            return c.json({ error: "Please fill in all fields" }, 400);
        }

        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
            return c.json({ error: "Category does not exist" }, 400);
        }

        const newProduct = await Product.create({
            name,
            category,
            description,
            price,
            image,
            coordinates
        });

        return c.json({
            message: "Product created successfully",
            product: newProduct
        }, 201);
    } catch (error) {
        console.error(error);
        return c.json({ error: "Error creating product" }, 500);
    }
};

export const getAllProducts = async (c: Context) => {
    try {
        const products = await Product.find().populate("category");
        return c.json(products);
    } catch (error) {
        console.error(error);
        return c.json({ error: "Error fetching products" }, 500);
    }
};

export const getProductById = async (c: Context) => {
    try {
        const id = c.req.param("id");
        const product = await Product.findById(id).populate("category");
        
        if (!product) {
            return c.json({ error: "Product not found" }, 404);
        }
        return c.json(product);
    } catch (error) {
        console.error(error);
        return c.json({ error: "Error fetching product" }, 500);
    }
};

export const updateProduct = async (c: Context) => {
    try {
        const id = c.req.param("id");
        const body = await c.req.json();
        const updateData: any = {};

        if (body.name) updateData.name = body.name;
        if (body.category) {
            const categoryExists = await Category.findById(body.category);
            if (!categoryExists) {
                return c.json({ error: "Category does not exist" }, 400);
            }
            updateData.category = body.category;
        }
        if (body.description) updateData.description = body.description;
        if (body.price) updateData.price = body.price;
        if (body.image) updateData.image = body.image;
        if (body.coordinates) {
            if (typeof body.coordinates.x === 'number') updateData["coordinates.x"] = body.coordinates.x;
            if (typeof body.coordinates.y === 'number') updateData["coordinates.y"] = body.coordinates.y;
        }

        const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedProduct) {
            return c.json({ error: "Product not found" }, 404);
        }

        return c.json({
            message: "Product updated successfully",
            product: updatedProduct
        });
    } catch (error) {
        console.error(error);
        return c.json({ error: "Error updating product" }, 500);
    }
};

export const deleteProduct = async (c: Context) => {
    try {
        const id = c.req.param("id");
        const deletedProduct = await Product.findByIdAndDelete(id);

        if (!deletedProduct) {
            return c.json({ error: "Product not found" }, 404);
        }

        return c.json({
            message: "Product deleted successfully",
            product: deletedProduct
        });
    } catch (error) {
        console.error(error);
        return c.json({ error: "Error deleting product" }, 500);
    }
};
