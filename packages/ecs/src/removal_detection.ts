import {ComponentId} from "./component";
import {Entity} from "./entity";
import {SparseSet} from "./storage";

export class RemovedComponentEvents {
    eventSets: SparseSet<ComponentId, any> = new SparseSet();

    send(componentId: ComponentId, entity: Entity) {

    }
}
