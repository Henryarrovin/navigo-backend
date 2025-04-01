import mongoose from "mongoose";

interface IMapZoneVertex {
    x: number;
    y: number;
}

interface IAdjacentZone {
    zone: mongoose.Schema.Types.ObjectId;
    connectionPoints: {
        from: IMapZoneVertex;
        to: IMapZoneVertex;
    };
}

interface IMapZone extends mongoose.Document {
    name: string;
    floor: number;
    vertices: IMapZoneVertex[];
    isNavigable: boolean;
    adjacentZones: IAdjacentZone[];
    svgPath: string;
}

const mapZoneSchema = new mongoose.Schema<IMapZone>({
    name: { type: String, required: true },
    floor: { type: Number, required: true },
    vertices: [{
        x: { type: Number, required: true },
        y: { type: Number, required: true }
    }],
    isNavigable: { type: Boolean, default: true },
    adjacentZones: [{
        zone: { type: mongoose.Schema.Types.ObjectId, ref: "MapZone", required: true },
        connectionPoints: {
            from: {
                x: { type: Number, required: true },
                y: { type: Number, required: true }
            },
            to: {
                x: { type: Number, required: true },
                y: { type: Number, required: true }
            }
        }
    }],
    svgPath: { type: String, required: true }
});

const MapZone = mongoose.model<IMapZone>("MapZone", mapZoneSchema);
export default MapZone;
