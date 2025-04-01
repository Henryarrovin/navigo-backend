import { Hono } from "hono";
import {
    createZone,
    findPath,
    getProductsInZone,
    getZoneById
} from "../controllers/mapController";

const mapRouter = new Hono();

mapRouter.post("/zones", createZone);
mapRouter.get("/zones/:id", getZoneById);

mapRouter.get("/zones/:id/products", getProductsInZone);

mapRouter.post("/path", findPath);

export default mapRouter;
