import type { Context } from "hono";
import MapZone from "../models/mapModel";
import Product from "../models/productModel";

interface AStarNode {
    zone: any;
    parent: AStarNode | null;
    g: number; // Cost from start to current node
    h: number; // Heuristic (estimated cost from current to end)
    f: number; // Total cost (g + h)
    entryPoint: { x: number; y: number };
    exitPoint: { x: number; y: number };
}

// calculate Euclidean distance
function calculateDistance(point1: { x: number; y: number }, point2: { x: number; y: number }): number {
    return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
}

export const findPath = async (c: Context) => {
    try {
        const { start, end } = await c.req.json();
        
        if (!start || !end || !start.x || !start.y || !end.x || !end.y) {
            return c.json({ error: "Please provide valid start and end coordinates" }, 400);
        }

        // Find the zones containing the start and end points
        const startZone = await findZoneByCoordinates(start.x, start.y);
        const endZone = await findZoneByCoordinates(end.x, end.y);

        if (!startZone || !endZone) {
            return c.json({ error: "Start or end point is not in a navigable zone" }, 400);
        }

        // Perform A* pathfinding
        const path = await aStarPathfinding(startZone, endZone, start, end);

        if (!path || path.length === 0) {
            return c.json({ error: "No path found between the points" }, 404);
        }

        return c.json({
            message: "Path found successfully",
            path: path,
            distance: calculatePathDistance(path)
        });
    } catch (error) {
        console.error(error);
        return c.json({ error: "Error finding path" }, 500);
    }
};

async function findZoneByCoordinates(x: number, y: number): Promise<any> {
    // Find all zones and check which one contains the point
    // This is a simplified approach - you might need a more efficient spatial query
    const allZones = await MapZone.find({ isNavigable: true });
    
    for (const zone of allZones) {
        if (pointInPolygon({ x, y }, zone.vertices)) {
            return zone;
        }
    }
    return null;
}

// Point-in-polygon algorithm (Ray casting)
function pointInPolygon(point: { x: number; y: number }, polygon: { x: number; y: number }[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;
        
        const intersect = ((yi > point.y) !== (yj > point.y))
            && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

async function aStarPathfinding(startZone: any, endZone: any, startPoint: { x: number; y: number }, endPoint: { x: number; y: number }): Promise<any[]> {
    const openSet: AStarNode[] = [];
    const closedSet: AStarNode[] = [];
    
    // Start node
    const startNode: AStarNode = {
        zone: startZone,
        parent: null,
        g: 0,
        h: calculateDistance(startPoint, endPoint),
        f: calculateDistance(startPoint, endPoint),
        entryPoint: startPoint,
        exitPoint: startPoint
    };
    
    openSet.push(startNode);
    
    while (openSet.length > 0) {
        // Get node with lowest f score
        openSet.sort((a, b) => a.f - b.f);
        const currentNode = openSet.shift()!;
        
        // Check if we've reached the end zone
        if (currentNode.zone._id.equals(endZone._id)) {
            // Reconstruct path
            const path = [];
            let node: AStarNode | null = currentNode;
            
            while (node) {
                path.unshift({
                    zone: node.zone,
                    entryPoint: node.entryPoint,
                    exitPoint: node.exitPoint
                });
                node = node.parent;
            }
            
            // Add the final point to the end zone
            path.push({
                zone: endZone,
                entryPoint: endPoint,
                exitPoint: endPoint
            });
            
            return path;
        }
        
        closedSet.push(currentNode);
        
        // Get adjacent zones
        for (const adjacent of currentNode.zone.adjacentZones) {
            const adjacentZone = await MapZone.findById(adjacent.zone);
            if (!adjacentZone || !adjacentZone.isNavigable) continue;
            
            // Calculate tentative g score
            const connectionPoint = adjacent.connectionPoints.from;
            const exitPoint = adjacent.connectionPoints.to;
            
            const distanceFromCurrent = calculateDistance(currentNode.exitPoint, connectionPoint);
            const tentativeG = currentNode.g + distanceFromCurrent;
            
            // Check if this zone is already in closed set with a better g score
            const closedNode = closedSet.find(n => n.zone._id.equals(adjacentZone._id));
            if (closedNode && closedNode.g <= tentativeG) continue;
            
            // Check if it's in open set
            let openNode = openSet.find(n => n.zone._id.equals(adjacentZone._id));
            
            if (!openNode || tentativeG < openNode.g) {
                const h = calculateDistance(exitPoint, endPoint);
                
                if (!openNode) {
                    openNode = {
                        zone: adjacentZone,
                        parent: currentNode,
                        g: tentativeG,
                        h,
                        f: tentativeG + h,
                        entryPoint: connectionPoint,
                        exitPoint
                    };
                    openSet.push(openNode);
                } else {
                    openNode.parent = currentNode;
                    openNode.g = tentativeG;
                    openNode.h = h;
                    openNode.f = tentativeG + h;
                    openNode.entryPoint = connectionPoint;
                    openNode.exitPoint = exitPoint;
                }
            }
        }
    }
    
    return []; // No path found
}

function calculatePathDistance(path: any[]): number {
    let distance = 0;
    
    for (let i = 1; i < path.length; i++) {
        distance += calculateDistance(path[i-1].exitPoint, path[i].entryPoint);
    }
    
    return distance;
}

export const getZoneById = async (c: Context) => {
    try {
        const id = c.req.param("id");
        const zone = await MapZone.findById(id);
        
        if (!zone) {
            return c.json({ error: "Zone not found" }, 404);
        }
        
        return c.json(zone);
    } catch (error) {
        console.error(error);
        return c.json({ error: "Error fetching zone" }, 500);
    }
};

export const createZone = async (c: Context) => {
    try {
        const body = await c.req.json();
        const { name, floor, vertices, isNavigable, adjacentZones, svgPath } = body;
        
        if (!name || !floor || !vertices || !Array.isArray(vertices) || vertices.length < 3 || !svgPath) {
            return c.json({ error: "Please provide all required fields" }, 400);
        }
        
        const newZone = await MapZone.create({
            name,
            floor,
            vertices,
            isNavigable: isNavigable !== false,
            adjacentZones: adjacentZones || [],
            svgPath
        });
        
        return c.json({
            message: "Zone created successfully",
            zone: newZone
        }, 201);
    } catch (error) {
        console.error(error);
        return c.json({ error: "Error creating zone" }, 500);
    }
};

export const getProductsInZone = async (c: Context) => {
    try {
        const zoneId = c.req.param("id");
        const products = await Product.find({ "location.zone": zoneId }).populate("category");
        
        return c.json(products);
    } catch (error) {
        console.error(error);
        return c.json({ error: "Error fetching products in zone" }, 500);
    }
};
