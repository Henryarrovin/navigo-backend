import { Hono } from "hono";
import productRouter from "./productRoutes";
import categoryRouter from "./categoryRoutes";
import mapRouter from "./mapRoutes";

const router = new Hono();

router.route("/products", productRouter);
router.route("/categories", categoryRouter);
router.route("/map", mapRouter);

export default router;
