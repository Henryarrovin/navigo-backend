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
    adjacentZones: IAdjacentZone[] | null;
    containedIn: mongoose.Schema.Types.ObjectId | null;
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
        zone: { type: mongoose.Schema.Types.ObjectId, ref: "MapZone", required: false },
        connectionPoints: {
            from: {
                x: { type: Number, required: false },
                y: { type: Number, required: false }
            },
            to: {
                x: { type: Number, required: false },
                y: { type: Number, required: false }
            }
        }
    }],
    containedIn: { type: mongoose.Schema.Types.ObjectId, ref: "MapZone", required: false },
    svgPath: { type: String, required: true }
});

const MapZone = mongoose.model<IMapZone>("MapZone", mapZoneSchema);
export default MapZone;
