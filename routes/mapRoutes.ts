import { Hono } from "hono";
import {
    createZone,
    findPath,
    getAllZones,
    getProductsInZone,
    getZoneById,
    updateZoneById
} from "../controllers/mapController";

const mapRouter = new Hono();

mapRouter.get("/zones", getAllZones);
mapRouter.patch("/zones/:id", updateZoneById);

mapRouter.post("/zones", createZone);
mapRouter.get("/zones/:id", getZoneById);

mapRouter.get("/zones/:id/products", getProductsInZone);

mapRouter.post("/path", findPath);

export default mapRouter;
