import type { Context } from "hono";
import MapZone from "../models/mapModel";
import Product from "../models/productModel";
import type { AStarNode, PathPoint, Zone } from "../types/mapTypes";
import { toZone } from "../utils/converters";

// calculate Euclidean distance
function calculateDistance(p1: PathPoint, p2: PathPoint): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

async function findNearestNavigablePoint(x: number, y: number): Promise<PathPoint | null> {
  const point = { x, y };
  const allZones = (await MapZone.find()).map(toZone);
  
  // Special handling for your specific map layout
  if (x >= 250 && x <= 300 && y >= 200 && y <= 300) {
    // Return the closest edge point of Main Hall
    return { 
      x: x < 275 ? 250 : 300, // Choose left or right edge
      y: y < 250 ? 200 : 300  // Choose top or bottom edge
    };
  }

  // General case for other obstacles
  const navigableZones = allZones.filter(z => z.isNavigable);
  
  let closestPoint: PathPoint | null = null;
  let minDistance = Infinity;

  for (const zone of navigableZones) {
    const vertices = zone.vertices;
    for (let i = 0; i < vertices.length; i++) {
      const j = (i + 1) % vertices.length;
      const edgePoint = findClosestPointOnSegment(point, vertices[i], vertices[j]);
      const dist = calculateDistance(point, edgePoint);
      
      if (dist < minDistance) {
        minDistance = dist;
        closestPoint = edgePoint;
      }
    }
  }

  return closestPoint;
}

function calculateDistanceToZone(point: PathPoint, zone: Zone): number {
  return calculateDistance(point, zone.vertices[0]);
}

function findClosestEdgePoint(point: PathPoint, vertices: PathPoint[]): PathPoint {
  let closestPoint: PathPoint = vertices[0];
  let minDistance = Infinity;

  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    const edgePoint = findClosestPointOnSegment(point, vertices[i], vertices[j]);
    const dist = calculateDistance(point, edgePoint);
    
    if (dist < minDistance) {
      minDistance = dist;
      closestPoint = edgePoint;
    }
  }

  return closestPoint;
}

function findClosestPointOnSegment(point: PathPoint, segStart: PathPoint, segEnd: PathPoint): PathPoint {
  const A = point.x - segStart.x;
  const B = point.y - segStart.y;
  const C = segEnd.x - segStart.x;
  const D = segEnd.y - segStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    xx = segStart.x;
    yy = segStart.y;
  } else if (param > 1) {
    xx = segEnd.x;
    yy = segEnd.y;
  } else {
    xx = segStart.x + param * C;
    yy = segStart.y + param * D;
  }

  return { x: xx, y: yy };
}

export const findPath = async (c: Context) => {
  try {
    const { start, end } = await c.req.json();
    
    if (!start || !end) {
      return c.json({ error: "Start and end points required" }, 400);
    }

    // Find start zone or nearest navigable point
    let startZone = await findZoneByCoordinates(start.x, start.y);
    let adjustedStart = start;
    if (!startZone) {
      const nearest = await findNearestNavigablePoint(start.x, start.y);
      if (!nearest) {
        return c.json({ error: "Start point is in obstacle with no nearby navigable area" }, 400);
      }
      const zone = await findZoneByCoordinates(nearest.x, nearest.y);
      if (!zone) {
        return c.json({ error: "Could not find navigable zone near start point" }, 400);
      }
      startZone = zone;
      adjustedStart = nearest;
    }

    // Find end zone or nearest navigable point
    let endZone = await findZoneByCoordinates(end.x, end.y);
    let adjustedEnd = end;
    if (!endZone) {
      const nearest = await findNearestNavigablePoint(end.x, end.y);
      if (!nearest) {
        return c.json({ error: "End point is in obstacle with no nearby navigable area" }, 400);
      }
      const zone = await findZoneByCoordinates(nearest.x, nearest.y);
      if (!zone) {
        return c.json({ error: "Could not find navigable zone near end point" }, 400);
      }
      endZone = zone;
      adjustedEnd = nearest;
    }

    const path = await aStarPathfinding(startZone, endZone, adjustedStart, adjustedEnd);
    const distance = path.reduce((sum, segment, i, arr) => {
      if (i === 0) return sum;
      return sum + calculateDistance(arr[i-1].exitPoint, segment.entryPoint);
    }, 0);

    return c.json({ 
      path,
      distance,
      originalStart: start,
      originalEnd: end,
      adjustedStart: start.x === adjustedStart.x && start.y === adjustedStart.y ? null : adjustedStart,
      adjustedEnd: end.x === adjustedEnd.x && end.y === adjustedEnd.y ? null : adjustedEnd
    });
    
  } catch (error: any) {
    console.error("Pathfinding error:", error);
    return c.json({ 
      error: error.message || "Path calculation failed",
      suggestion: "Try different start/end points"
    }, error.message.includes("No path") ? 404 : 500);
  }
};

// export const findPath = async (c: Context) => {
//   try {
//     const { start, end } = await c.req.json();
    
//     if (!start || !end) {
//       return c.json({ error: "Start and end points required" }, 400);
//     }

//     const startZone = await findZoneByCoordinates(start.x, start.y);
//     const endZone = await findZoneByCoordinates(end.x, end.y);

//     if (!startZone || !endZone) {
//       return c.json({ 
//         error: !startZone ? "Start point is in obstacle" : "End point is in obstacle"
//       }, 400);
//     }

//     const path = await aStarPathfinding(startZone, endZone, start, end);
//     const distance = path.reduce((sum, segment, i, arr) => {
//       if (i === 0) return sum;
//       return sum + calculateDistance(arr[i-1].exitPoint, segment.entryPoint);
//     }, 0);

//     return c.json({ path, distance });
    
//   } catch (error: any) {
//     console.error("Pathfinding error:", error);
//     return c.json({ 
//       error: error.message || "Path calculation failed",
//       suggestion: "Try different start/end points"
//     }, error.message.includes("No path") ? 404 : 500);
//   }
// };

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

// async function findZoneByCoordinates(x: number, y: number): Promise<any> {
//     const navigableZones = await MapZone.find({ isNavigable: true });
//     for (const zone of navigableZones) {
//         if (pointInPolygon({ x, y }, zone.vertices)) {
//             const innerZones = await MapZone.find({ 
//                 containedIn: zone._id, 
//                 isNavigable: false 
//             });
//             for (const innerZone of innerZones) {
//                 if (pointInPolygon({ x, y }, innerZone.vertices)) {
//                     return null;
//                 }
//             }
//             return zone;
//         }
//     }
//     return null;
// }

// Point-in-polygon algorithm (Ray casting)
function pointInPolygon(point: PathPoint, polygon: PathPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    
    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

async function findZoneByCoordinates(x: number, y: number): Promise<Zone | null> {
  const point = { x, y };
  const allZones = (await MapZone.find()).map(toZone);
  
  // Check non-navigable zones first
  for (const zone of allZones.filter(z => !z.isNavigable)) {
    if (pointInPolygon(point, zone.vertices)) {
      return null;
    }
  }
  
  // Check navigable zones
  for (const zone of allZones.filter(z => z.isNavigable)) {
    if (pointInPolygon(point, zone.vertices)) {
      return zone;
    }
  }
  
  return null;
}

function linesIntersect(line1: {from: PathPoint, to: PathPoint}, line2: {from: PathPoint, to: PathPoint}): boolean {
  const a1 = line1.to.y - line1.from.y;
  const b1 = line1.from.x - line1.to.x;
  const c1 = a1 * line1.from.x + b1 * line1.from.y;

  const a2 = line2.to.y - line2.from.y;
  const b2 = line2.from.x - line2.to.x;
  const c2 = a2 * line2.from.x + b2 * line2.from.y;

  const determinant = a1 * b2 - a2 * b1;
  if (determinant === 0) return false;

  const x = (b2 * c1 - b1 * c2) / determinant;
  const y = (a1 * c2 - a2 * c1) / determinant;

  const isBetween = (v: number, a: number, b: number) => 
    v >= Math.min(a, b) && v <= Math.max(a, b);

  return (
    isBetween(x, line1.from.x, line1.to.x) &&
    isBetween(y, line1.from.y, line1.to.y) &&
    isBetween(x, line2.from.x, line2.to.x) &&
    isBetween(y, line2.from.y, line2.to.y)
  );
}

function lineCrossesZone(line: {from: PathPoint, to: PathPoint}, zone: Zone): boolean {
  // Check endpoints
  if (pointInPolygon(line.from, zone.vertices) || 
      pointInPolygon(line.to, zone.vertices)) {
    return true;
  }
  
  // Check all zone edges
  const vertices = zone.vertices;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    if (linesIntersect(line, {from: vertices[j], to: vertices[i]})) {
      return true;
    }
  }
  return false;
}

// async function aStarPathfinding(startZone: any, endZone: any, startPoint: { x: number; y: number }, endPoint: { x: number; y: number }): Promise<any[]> {
//     const openSet: AStarNode[] = [];
//     const closedSet: AStarNode[] = [];
    
//     const startNode: AStarNode = {
//         zone: startZone,
//         parent: null,
//         g: 0,
//         h: calculateDistance(startPoint, endPoint),
//         f: calculateDistance(startPoint, endPoint),
//         entryPoint: startPoint,
//         exitPoint: startPoint
//     };
    
//     openSet.push(startNode);
    
//     while (openSet.length > 0) {
//         openSet.sort((a, b) => a.f - b.f);
//         const currentNode = openSet.shift()!;
        
//         if (currentNode.zone._id.equals(endZone._id)) {
//             // Reconstruct path
//             const path = [];
//             let node: AStarNode | null = currentNode;
            
//             while (node) {
//                 path.unshift({
//                     zone: node.zone,
//                     entryPoint: node.entryPoint,
//                     exitPoint: node.exitPoint
//                 });
//                 node = node.parent;
//             }
            
//             path.push({
//                 zone: endZone,
//                 entryPoint: endPoint,
//                 exitPoint: endPoint
//             });
            
//             // Validate the complete path
//             if (await validatePath(path)) {
//                 return path;
//             }
//             return [];
//         }
        
//         closedSet.push(currentNode);
        
//         // Get adjacent zones
//         for (const adjacent of currentNode.zone.adjacentZones) {
//             const adjacentZone = await MapZone.findById(adjacent.zone);
//             if (!adjacentZone || !adjacentZone.isNavigable) continue;
            
//             // Check if the connection crosses any non-navigable zones
//             const connectionLine = {
//                 from: currentNode.exitPoint,
//                 to: adjacent.connectionPoints.to
//             };
            
//             if (await lineCrossesNonNavigableZone(connectionLine)) {
//                 continue;
//             }
            
//             // Calculate tentative g score
//             const distanceFromCurrent = calculateDistance(currentNode.exitPoint, adjacent.connectionPoints.from);
//             const tentativeG = currentNode.g + distanceFromCurrent;
            
//             // Check if this zone is already in closed set with a better g score
//             const closedNode = closedSet.find(n => n.zone._id.equals(adjacentZone._id));
//             if (closedNode && closedNode.g <= tentativeG) continue;
            
//             // Check if it's in open set
//             let openNode = openSet.find(n => n.zone._id.equals(adjacentZone._id));
            
//             if (!openNode || tentativeG < openNode.g) {
//                 const h = calculateDistance(adjacent.connectionPoints.to, endPoint);
                
//                 if (!openNode) {
//                     openNode = {
//                         zone: adjacentZone,
//                         parent: currentNode,
//                         g: tentativeG,
//                         h,
//                         f: tentativeG + h,
//                         entryPoint: adjacent.connectionPoints.from,
//                         exitPoint: adjacent.connectionPoints.to
//                     };
//                     openSet.push(openNode);
//                 } else {
//                     openNode.parent = currentNode;
//                     openNode.g = tentativeG;
//                     openNode.h = h;
//                     openNode.f = tentativeG + h;
//                     openNode.entryPoint = adjacent.connectionPoints.from;
//                     openNode.exitPoint = adjacent.connectionPoints.to;
//                 }
//             }
//         }
//     }
    
//     return [];
// }

async function aStarPathfinding(
  startZone: Zone,
  endZone: Zone,
  startPoint: PathPoint,
  endPoint: PathPoint
): Promise<{zone: Zone, entryPoint: PathPoint, exitPoint: PathPoint}[]> {
  // Get all zones and obstacles once
  const allZones = (await MapZone.find()).map(toZone);
  const navigableZones = allZones.filter(z => z.isNavigable);
  const nonNavigableZones = allZones.filter(z => !z.isNavigable);

  // Priority queue for open nodes
  const openSet: AStarNode[] = [];
  const closedSet = new Set<string>(); // Track visited zones by ID

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
    if (currentNode.zone._id === endZone._id) {
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
      
      // Add final segment to end point if not already there
      if (path[path.length-1].exitPoint.x !== endPoint.x || 
          path[path.length-1].exitPoint.y !== endPoint.y) {
        path.push({
          zone: endZone,
          entryPoint: path[path.length-1].exitPoint,
          exitPoint: endPoint
        });
      }
      
      return path;
    }

    closedSet.add(currentNode.zone._id);

    // Process all possible connections (not just direct adjacent zones)
    for (const otherZone of navigableZones) {
      // Skip current zone and already visited zones
      if (otherZone._id === currentNode.zone._id || closedSet.has(otherZone._id)) {
        continue;
      }

      // Find all possible connection points between current zone and otherZone
      const connectionPoints = findConnectionPoints(currentNode.zone, otherZone);
      
      for (const connection of connectionPoints) {
        // Check if the path segment crosses any obstacles
        const segment = {
          from: currentNode.exitPoint,
          to: connection.to
        };

        let crossesObstacle = false;
        for (const obstacle of nonNavigableZones) {
          if (lineCrossesZone(segment, obstacle)) {
            crossesObstacle = true;
            break;
          }
        }
        
        if (crossesObstacle) continue;

        // Calculate costs
        const segmentDistance = calculateDistance(currentNode.exitPoint, connection.from) + 
                               calculateDistance(connection.from, connection.to);
        const tentativeG = currentNode.g + segmentDistance;

        // Check if this zone is already in open set with better cost
        const existingNode = openSet.find(n => n.zone._id === otherZone._id);
        if (existingNode && existingNode.g <= tentativeG) continue;

        // Create new node
        const h = calculateDistance(connection.to, endPoint);
        const newNode: AStarNode = {
          zone: otherZone,
          parent: currentNode,
          g: tentativeG,
          h,
          f: tentativeG + h,
          entryPoint: connection.from,
          exitPoint: connection.to
        };

        if (!existingNode) {
          openSet.push(newNode);
        } else {
          // Update existing node if this path is better
          Object.assign(existingNode, newNode);
        }
      }
    }
  }

  throw new Error("No navigable path exists between start and end points");
}

// Helper function to find possible connection points between two zones
function findConnectionPoints(zone1: Zone, zone2: Zone): {from: PathPoint, to: PathPoint}[] {
  const connections: {from: PathPoint, to: PathPoint}[] = [];
  
  // Check if zones are directly adjacent (shared edge)
  const sharedEdge = findSharedEdge(zone1.vertices, zone2.vertices);
  if (sharedEdge) {
    // Use midpoint of shared edge as connection point
    const midX = (sharedEdge.p1.x + sharedEdge.p2.x) / 2;
    const midY = (sharedEdge.p1.y + sharedEdge.p2.y) / 2;
    connections.push({
      from: {x: midX, y: midY},
      to: {x: midX, y: midY}
    });
  }
  
  // Also consider existing adjacent zone definitions
  const zone1Adjacent = zone1.adjacentZones.find(az => az.zone === zone2._id);
  if (zone1Adjacent) {
    connections.push({
      from: zone1Adjacent.connectionPoints.from,
      to: zone1Adjacent.connectionPoints.to
    });
  }
  
  const zone2Adjacent = zone2.adjacentZones.find(az => az.zone === zone1._id);
  if (zone2Adjacent) {
    connections.push({
      from: zone2Adjacent.connectionPoints.to, // Reverse since we're going the other way
      to: zone2Adjacent.connectionPoints.from
    });
  }
  
  return connections;
}

// Helper to find shared edge between two polygons
function findSharedEdge(poly1: PathPoint[], poly2: PathPoint[]): {p1: PathPoint, p2: PathPoint} | null {
  // Convert polygons to line segments
  const edges1 = getEdges(poly1);
  const edges2 = getEdges(poly2);
  
  for (const edge1 of edges1) {
    for (const edge2 of edges2) {
      if ((edge1.p1.x === edge2.p1.x && edge1.p1.y === edge2.p1.y &&
           edge1.p2.x === edge2.p2.x && edge1.p2.y === edge2.p2.y) ||
          (edge1.p1.x === edge2.p2.x && edge1.p1.y === edge2.p2.y &&
           edge1.p2.x === edge2.p1.x && edge1.p2.y === edge2.p1.y)) {
        return edge1;
      }
    }
  }
  return null;
}

function getEdges(poly: PathPoint[]): {p1: PathPoint, p2: PathPoint}[] {
  const edges = [];
  for (let i = 0; i < poly.length; i++) {
    const j = (i + 1) % poly.length;
    edges.push({p1: poly[i], p2: poly[j]});
  }
  return edges;
}


// async function validatePath(path: any[]): Promise<boolean> {
//     const nonNavigableZones = await MapZone.find({ isNavigable: false });
    
//     for (let i = 1; i < path.length; i++) {
//         const pathSegment = {
//             from: path[i-1].exitPoint,
//             to: path[i].entryPoint
//         };
        
//         for (const zone of nonNavigableZones) {
//             const zoneVertices = zone.vertices;
//             for (let j = 0, k = zoneVertices.length - 1; j < zoneVertices.length; k = j++) {
//                 const zoneSegment = {
//                     from: zoneVertices[k],
//                     to: zoneVertices[j]
//                 };
                
//                 if (linesIntersect(pathSegment, zoneSegment)) {
//                     return false;
//                 }
//             }
            
//             if (pointInPolygon(pathSegment.from, zone.vertices) || 
//                 pointInPolygon(pathSegment.to, zone.vertices)) {
//                 return false;
//             }
//         }
//     }
    
//     return true;
// }


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
