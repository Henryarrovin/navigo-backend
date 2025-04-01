import { Hono } from "hono";
import {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getProductsByCategory
} from "../controllers/productController";

const productRouter = new Hono();

productRouter.post("/", createProduct);
productRouter.get("/", getAllProducts);
productRouter.get("/:id", getProductById);
productRouter.put("/:id", updateProduct);
productRouter.delete("/:id", deleteProduct);

productRouter.get("/category/:categoryId", getProductsByCategory);

export default productRouter;
