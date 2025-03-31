import mongoose from "mongoose";

interface ICoordinates {
    x: number;
    y: number;
}

interface IObstacle {
    type: 'wall' | 'furniture' | 'door';
    coordinates: ICoordinates;
    width: number;
    height: number;
}

interface IMapZone extends mongoose.Document {
    name: string;
    svgPath: string;
    gridSize: {
        width: number;
        height: number;
    };
    obstacles: IObstacle[];
}

const MapZoneSchema = new mongoose.Schema<IMapZone>({
    name: { type: String, required: true, default: "Main Floor" },
    svgPath: { type: String, required: true },
    gridSize: {
        width: { type: Number, required: true },
        height: { type: Number, required: true }
    },
    obstacles: [{
        type: { type: String, enum: ['wall', 'furniture', 'door'], required: true },
        coordinates: {
            x: { type: Number, required: true },
            y: { type: Number, required: true }
        },
        width: { type: Number, required: true },
        height: { type: Number, required: true }
    }]
});

const MapZone = mongoose.model<IMapZone>("MapZone", MapZoneSchema);
export default MapZone;
