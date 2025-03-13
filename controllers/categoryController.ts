import type { Context } from "hono";
import Category from "../models/categoryModel";

export const createCategory = async (c: Context) => {
    try {
        const body = await c.req.json();
        const { name } = body;

        if (!name) {
            return c.json({ error: "Please provide name" }, 400);
        }

        const newCategory = await Category.create({ name });

        return c.json({
            message: "Category created successfully",
            category: newCategory
        }, 201);
    } catch (error) {
        console.error(error);
        return c.json({ error: "Error creating category" }, 500);
    }
};

export const getAllCategories = async (c: Context) => {
    try {
        const categories = await Category.find();
        return c.json(categories);
    } catch (error) {
        console.error(error);
        return c.json({ error: "Error fetching categories" }, 500);
    }
};

export const getCategoryById = async (c: Context) => {
    try {
        const id = c.req.param("id");
        const category = await Category.findById(id);

        if (!category) {
            return c.json({ error: "Category not found" }, 404);
        }

        return c.json(category);
    } catch (error) {
        console.error(error);
        return c.json({ error: "Error fetching category" }, 500);
    }
};

export const updateCategory = async (c: Context) => {
    try {
        const id = c.req.param("id");
        const body = await c.req.json();
        const { name } = body;

        if (!name) {
            return c.json({ error: "Please provide a name" }, 400);
        }

        const updatedCategory = await Category.findByIdAndUpdate(id, { name }, { new: true });

        if (!updatedCategory) {
            return c.json({ error: "Category not found" }, 404);
        }

        return c.json({
            message: "Category updated successfully",
            category: updatedCategory
        });
    } catch (error) {
        console.error(error);
        return c.json({ error: "Error updating category" }, 500);
    }
};

export const deleteCategory = async (c: Context) => {
    try {
        const id = c.req.param("id");
        const deletedCategory = await Category.findByIdAndDelete(id);

        if (!deletedCategory) {
            return c.json({ error: "Category not found" }, 404);
        }

        return c.json({
            message: "Category deleted successfully",
            category: deletedCategory
        });
    } catch (error) {
        console.error(error);
        return c.json({ error: "Error deleting category" }, 500);
    }
};
