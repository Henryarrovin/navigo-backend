export interface PathPoint {
  x: number;
  y: number;
}

export interface AStarNode {
  zone: Zone;
  parent: AStarNode | null;
  g: number; // Cost from start to current node
  h: number; // Heuristic (estimated cost from current to end)
  f: number; // Total cost (g + h)
  entryPoint: PathPoint;
  exitPoint: PathPoint;
}

export interface Zone {
  _id: string;
  name: string;
  vertices: PathPoint[];
  isNavigable: boolean;
  adjacentZones: {
    connectionPoints: {
      from: PathPoint;
      to: PathPoint;
    };
    zone: string;
  }[];
  svgPath: string;
  __v?: number;
}

export interface ZoneConnection {
  connectionPoints: {
    from: PathPoint;
    to: PathPoint;
  };
  zone: string;
}