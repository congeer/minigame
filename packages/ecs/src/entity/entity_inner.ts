import {EntityLocation} from "./entity";

export enum AllocAtWithoutReplacementType {
    Exists,
    DidNotExist,
    ExistsWithWrongGeneration,
}

export class AllocAtWithoutReplacement {
    type: AllocAtWithoutReplacementType;
    location?: EntityLocation;

    constructor(type: AllocAtWithoutReplacementType, location?: EntityLocation) {
        this.type = type;
        this.location = location;
    }

    static exists(location: EntityLocation) {
        return new AllocAtWithoutReplacement(AllocAtWithoutReplacementType.Exists, location);
    }

    static didNotExist() {
        return new AllocAtWithoutReplacement(AllocAtWithoutReplacementType.DidNotExist);
    }

    static existsWithWrongGeneration() {
        return new AllocAtWithoutReplacement(AllocAtWithoutReplacementType.ExistsWithWrongGeneration);
    }
}
