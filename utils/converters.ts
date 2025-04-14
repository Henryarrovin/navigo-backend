import type { Zone } from "../types/mapTypes";

export function toZone(doc: any): Zone {
  return {
    _id: doc._id.toString(),
    name: doc.name,
    vertices: doc.vertices.map((v: any) => ({ 
      x: v.x, 
      y: v.y,
      _id: v._id?.toString() 
    })),
    isNavigable: doc.isNavigable,
    adjacentZones: doc.adjacentZones?.map((az: any) => ({
      connectionPoints: {
        from: { 
          x: az.connectionPoints.from.x, 
          y: az.connectionPoints.from.y 
        },
        to: { 
          x: az.connectionPoints.to.x, 
          y: az.connectionPoints.to.y 
        }
      },
      zone: az.zone.toString(),
      _id: az._id?.toString()
    })) || [],
    svgPath: doc.svgPath,
    __v: doc.__v
  };
}