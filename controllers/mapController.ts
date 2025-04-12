import type { Context } from "hono";
import MapZone from "../models/mapModel";
import Product from "../models/productModel";
import mongoose from "mongoose";

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

async function lineCrossesNonNavigableZone(line: { from: { x: number; y: number }, to: { x: number; y: number } }): Promise<boolean> {
    const nonNavigableZones = await MapZone.find({ isNavigable: false });
    
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const checkPoint = {
            x: line.from.x + t * (line.to.x - line.from.x),
            y: line.from.y + t * (line.to.y - line.from.y)
        };
        
        for (const zone of nonNavigableZones) {
            if (pointInPolygon(checkPoint, zone.vertices)) {
                return true;
            }
        }
    }
    
    return false;
}

function linesIntersect(line1: any, line2: any): boolean {
    const a1 = line1.to.y - line1.from.y;
    const b1 = line1.from.x - line1.to.x;
    const c1 = a1 * line1.from.x + b1 * line1.from.y;

    const a2 = line2.to.y - line2.from.y;
    const b2 = line2.from.x - line2.to.x;
    const c2 = a2 * line2.from.x + b2 * line2.from.y;

    const determinant = a1 * b2 - a2 * b1;

    if (determinant === 0) {
        return false;
    }

    const x = (b2 * c1 - b1 * c2) / determinant;
    const y = (a1 * c2 - a2 * c1) / determinant;

    return (
        isBetween(x, line1.from.x, line1.to.x) &&
        isBetween(y, line1.from.y, line1.to.y) &&
        isBetween(x, line2.from.x, line2.to.x) &&
        isBetween(y, line2.from.y, line2.to.y)
    );
}

function isBetween(value: number, a: number, b: number): boolean {
    return value >= Math.min(a, b) && value <= Math.max(a, b);
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

// async function findZoneByCoordinates(x: number, y: number): Promise<any> {
//     // Find all zones and check which one contains the point
//     // const allZones = await MapZone.find({ isNavigable: true });
    
//     // for (const zone of allZones) {
//     //     if (pointInPolygon({ x, y }, zone.vertices)) {
//     //         return zone;
//     //     }
//     // }
//     // return null;

//     const navigableZones = await MapZone.find({ isNavigable: true });
    
//     for (const zone of navigableZones) {
//         if (pointInPolygon({ x, y }, zone.vertices)) {
//             // Check if point is actually in a non-navigable inner zone
//             const innerZones = await MapZone.find({ containedIn: zone._id, isNavigable: false });
//             for (const innerZone of innerZones) {
//                 if (pointInPolygon({ x, y }, innerZone.vertices)) {
//                     return null; // Point is in an obstacle
//                 }
//             }
//             return zone;
//         }
//     }
//     return null;
// }

async function findZoneByCoordinates(x: number, y: number): Promise<any> {
    const navigableZones = await MapZone.find({ isNavigable: true });
    for (const zone of navigableZones) {
        if (pointInPolygon({ x, y }, zone.vertices)) {
            const innerZones = await MapZone.find({ 
                containedIn: zone._id, 
                isNavigable: false 
            });
            for (const innerZone of innerZones) {
                if (pointInPolygon({ x, y }, innerZone.vertices)) {
                    return null;
                }
            }
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
        openSet.sort((a, b) => a.f - b.f);
        const currentNode = openSet.shift()!;
        
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
            
            path.push({
                zone: endZone,
                entryPoint: endPoint,
                exitPoint: endPoint
            });
            
            // Validate the complete path
            if (await validatePath(path)) {
                return path;
            }
            return [];
        }
        
        closedSet.push(currentNode);
        
        // Get adjacent zones
        for (const adjacent of currentNode.zone.adjacentZones) {
            const adjacentZone = await MapZone.findById(adjacent.zone);
            if (!adjacentZone || !adjacentZone.isNavigable) continue;
            
            // Check if the connection crosses any non-navigable zones
            const connectionLine = {
                from: currentNode.exitPoint,
                to: adjacent.connectionPoints.to
            };
            
            if (await lineCrossesNonNavigableZone(connectionLine)) {
                continue;
            }
            
            // Calculate tentative g score
            const distanceFromCurrent = calculateDistance(currentNode.exitPoint, adjacent.connectionPoints.from);
            const tentativeG = currentNode.g + distanceFromCurrent;
            
            // Check if this zone is already in closed set with a better g score
            const closedNode = closedSet.find(n => n.zone._id.equals(adjacentZone._id));
            if (closedNode && closedNode.g <= tentativeG) continue;
            
            // Check if it's in open set
            let openNode = openSet.find(n => n.zone._id.equals(adjacentZone._id));
            
            if (!openNode || tentativeG < openNode.g) {
                const h = calculateDistance(adjacent.connectionPoints.to, endPoint);
                
                if (!openNode) {
                    openNode = {
                        zone: adjacentZone,
                        parent: currentNode,
                        g: tentativeG,
                        h,
                        f: tentativeG + h,
                        entryPoint: adjacent.connectionPoints.from,
                        exitPoint: adjacent.connectionPoints.to
                    };
                    openSet.push(openNode);
                } else {
                    openNode.parent = currentNode;
                    openNode.g = tentativeG;
                    openNode.h = h;
                    openNode.f = tentativeG + h;
                    openNode.entryPoint = adjacent.connectionPoints.from;
                    openNode.exitPoint = adjacent.connectionPoints.to;
                }
            }
        }
    }
    
    return [];
}

async function validatePath(path: any[]): Promise<boolean> {
    const nonNavigableZones = await MapZone.find({ isNavigable: false });
    
    for (let i = 1; i < path.length; i++) {
        const pathSegment = {
            from: path[i-1].exitPoint,
            to: path[i].entryPoint
        };
        
        for (const zone of nonNavigableZones) {
            const zoneVertices = zone.vertices;
            for (let j = 0, k = zoneVertices.length - 1; j < zoneVertices.length; k = j++) {
                const zoneSegment = {
                    from: zoneVertices[k],
                    to: zoneVertices[j]
                };
                
                if (linesIntersect(pathSegment, zoneSegment)) {
                    return false;
                }
            }
            
            if (pointInPolygon(pathSegment.from, zone.vertices) || 
                pointInPolygon(pathSegment.to, zone.vertices)) {
                return false;
            }
        }
    }
    
    return true;
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
        const zone = await MapZone.findById(id)
            .populate("containedIn")
            .populate("innerZones");
        
        if (!zone) {
            return c.json({ error: "Zone not found" }, 404);
        }
        
        return c.json(zone);
    } catch (error) {
        console.error(error);
        return c.json({ error: "Error fetching zone" }, 500);
    }
};

function isPolygonInsidePolygon(inner: { x: number; y: number }[], outer: { x: number; y: number }[]): boolean {
    for (const point of inner) {
        if (!pointInPolygon(point, outer)) {
            return false;
        }
    }
    return true;
}

export const createZone = async (c: Context) => {
    try {
        const body = await c.req.json();
        const { name, floor, vertices, isNavigable, adjacentZones, containedIn,svgPath } = body;

        if (containedIn) {
            const parentZone = await MapZone.findById(containedIn);
            if (!parentZone) {
                return c.json({ error: "Parent zone not found" }, 404);
            }
            if (!parentZone.isNavigable) {
                return c.json({ error: "Parent zone must be navigable" }, 400);
            }
            if (containedIn && !isPolygonInsidePolygon(vertices, parentZone.vertices)) {
                return c.json({ error: "Inner zone must be completely contained within parent zone" }, 400);
            }
        }
        
        if (!name || !floor || !vertices || !Array.isArray(vertices) || vertices.length < 3 || !svgPath) {
            return c.json({ error: "Please provide all required fields" }, 400);
        }
        
        const newZone = await MapZone.create({
            name,
            floor,
            vertices,
            isNavigable: isNavigable !== false,
            adjacentZones: adjacentZones || [],
            containedIn: containedIn || null,
            svgPath
        });

        if (containedIn) {
            await MapZone.findByIdAndUpdate(
                containedIn,
                { $addToSet: { innerZones: newZone._id } },
                { new: true }
            );
        }
        
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


// export const getAllZones = async (c: Context) => {
//     try {
//         const zones = await MapZone.find();
//         return c.json(zones);
//     } catch (error) {
//         console.error(error);
//         return c.json({ error: "Error fetching zones" }, 500);
//     }
// };

export const getAllZones = async (c: Context) => {
    try {
        const { navigable } = c.req.query();
        
        const query: Record<string, any> = {};
        if (navigable === 'true') {
            query.isNavigable = true;
        } else if (navigable === 'false') {
            query.isNavigable = false;
        }
        
        const zones = await MapZone.find(query)
            .populate('containedIn')
            .populate('innerZones');
        
        return c.json(zones);
    } catch (error) {
        console.error(error);
        return c.json({ error: "Error fetching zones" }, 500);
    }
};

export const updateZoneById = async (c: Context) => {
    try {
        const id = c.req.param("id");
        const updateData = await c.req.json();

        if (Object.keys(updateData).length === 0) {
            return c.json({ error: "No update data provided" }, 400);
        }

        if (updateData.containedIn) {
            // Remove from old parent's innerZones
            await MapZone.updateMany(
                { innerZones: id },
                { $pull: { innerZones: id } }
            );
        }

        const updatedZone = await MapZone.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedZone) {
            return c.json({ error: "Zone not found" }, 404);
        }

        return c.json({
            message: "Zone updated successfully",
            zone: updatedZone
        });
    } catch (error) {
        console.error(error);
        return c.json({ error: "Error updating zone" }, 500);
    }
};
