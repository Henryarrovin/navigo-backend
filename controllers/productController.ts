import type { Context } from "hono";
import Product from "../models/productModel";
import Category from "../models/categoryModel";

interface Coordinates {
    x: number;
    y: number;
}

interface Product {
    name: string;
    category: string;
    description: string;
    price: number;
    image: string;
    location: {
        coordinates: Coordinates;
        zone: string;
    };
}

export const createProduct = async (c: Context) => {
    try {
        const body = await c.req.json();
        const { name, category, description, price, image, location } = body;

        if (!name || !category || !description || !price || !image || !location.coordinates || 
            !location.zone || typeof location.coordinates.x !== 'number' || typeof location.coordinates.y !== 'number'
        ) {
            return c.json({ error: "Please fill in all fields" }, 400);
        }

        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
            return c.json({ error: "Category does not exist" }, 404);
        }

        const newProduct = await Product.create({
            name,
            category,
            description,
            price,
            image,
            location
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

// export const getAllProducts = async (c: Context) => {
//     try {
//         const products = await Product.find().populate("category");
//         return c.json(products);
//     } catch (error) {
//         console.error(error);
//         return c.json({ error: "Error fetching products" }, 500);
//     }
// };

export const getAllProducts = async (c: Context) => {
    try {
        const page = parseInt(c.req.query('page') ?? '1');
        const limit = parseInt(c.req.query('limit') ?? '10');
        const skip = (page - 1) * limit;

        // Get total count for pagination info
        const total = await Product.countDocuments();
        
        // Fetch paginated products
        const products = await Product.find()
            .populate("category")
            .skip(skip)
            .limit(limit);

        return c.json({
            data: products,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1
            }
        });
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
        const body: Product = await c.req.json();
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
        // if (body.coordinates) {
        //     if (typeof body.coordinates.x === 'number') updateData["coordinates.x"] = body.coordinates.x;
        //     if (typeof body.coordinates.y === 'number') updateData["coordinates.y"] = body.coordinates.y;
        // }

        if (body.location) {
            if (body.location.coordinates) {
                if (typeof body.location.coordinates.x === 'number') updateData["location.coordinates.x"] = body.location.coordinates.x;
                if (typeof body.location.coordinates.y === 'number') updateData["location.coordinates.y"] = body.location.coordinates.y;
            }
            if (body.location.zone) updateData["location.zone"] = body.location.zone;
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

export const getProductsByCategory = async (c: Context) => {
    try {
        const categoryId = c.req.param("categoryId");

        const categoryExists = await Category.findById(categoryId);
        if (!categoryExists) {
            return c.json({ error: "Category not found" }, 404);
        }

        const products = await Product.find({ category: categoryId }).populate("category");

        if (products.length === 0) {
            return c.json({ message: "No products found for this category" }, 404);
        }

        return c.json(products);
    } catch (error) {
        console.error(error);
        return c.json({ error: "Error fetching products by category" }, 500);
    }
};
