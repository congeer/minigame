import { HashMap, Mut, Vec } from 'rustable';
import { Entity } from '../entity/base';
import { DeferredWorld } from '../world/deferred';
import { ComponentId } from '../component/types';

export type ObserverRunner = (
  world: DeferredWorld,
  trigger: ObserverTrigger,
  data: Mut<any>,
  propagate: Mut<boolean>,
) => void;

export type ObserverMap = HashMap<Entity, ObserverRunner>;
export class ObserverTrigger {
  constructor(
    /** The Entity of the observer handling the trigger. */
    public observer: Entity,
    /** The Event the trigger targeted. */
    public event_type: ComponentId,
    /** The ComponentIds the trigger targeted. */
    public components: Vec<ComponentId>,
    /** The entity the trigger targeted. */
    public target: Entity,
  ) {}
}
export class CachedComponentObservers {
  constructor(
    // Observers listening to triggers targeting this component
    public map: ObserverMap = new HashMap(),
    // Observers listening to triggers targeting this component on a specific entity
    public entityMap: HashMap<Entity, ObserverMap> = new HashMap(),
  ) {}
}

export class CachedObservers {
  constructor(
    // Observers listening for any time this trigger is fired
    public map: ObserverMap = new HashMap(),
    // Observers listening for this trigger fired at a specific component
    public componentObservers: HashMap<ComponentId, CachedComponentObservers> = new HashMap(),
    // Observers listening for this trigger fired at a specific entity
    public entityObservers: HashMap<Entity, ObserverMap> = new HashMap(),
  ) {}
}
