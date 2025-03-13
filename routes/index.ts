import { Hono } from "hono";
import productRouter from "./productRoutes";
import categoryRouter from "./categoryRoutes";

const router = new Hono();

router.route("/products", productRouter);
router.route("/categories", categoryRouter);

export default router;
