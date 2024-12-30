import { EMPTY_VALUE } from '@minigame/utils';
import { HashMap, Mut, Option, range, RustIter, Vec } from 'rustable';
import { Components } from '../component/collections';
import { ComponentId } from '../component/types';
import { Observers } from '../observer/observers';
import { TableId } from '../storage/table/types';
import { Archetype } from './base';
import { ArchetypeComponents, ArchetypeFlags, ArchetypeGeneration, ArchetypeId, ComponentIndex } from './types';

export class Archetypes {
  private __archetypes: Vec<Archetype>;
  private __archetypeComponentCount: number;
  private __byComponents: HashMap<ArchetypeComponents, ArchetypeId>;
  private __byComponent: ComponentIndex;

  constructor() {
    this.__archetypes = Vec.new();
    this.__archetypeComponentCount = 0;
    this.__byComponents = new HashMap();
    this.__byComponent = new HashMap();
    this.getIdOrInsert(new Components(), new Observers(), EMPTY_VALUE, Vec.new(), Vec.new());
  }

  get archetypes(): Vec<Archetype> {
    return this.__archetypes;
  }

  generation(): ArchetypeGeneration {
    const id = this.__archetypes.len();
    return new ArchetypeGeneration(id);
  }

  len() {
    return this.__archetypes.len();
  }

  empty(): Archetype {
    return this.__archetypes[EMPTY_VALUE];
  }

  emptyMut(): Mut<Archetype> {
    return Mut.of({
      get: () => {
        return this.__archetypes[EMPTY_VALUE];
      },
      set: (archetype) => {
        return this.__archetypes.set(EMPTY_VALUE, archetype);
      },
    });
  }

  newArchetypeComponentId() {
    const id = this.__archetypeComponentCount;
    this.__archetypeComponentCount += 1;
    return id;
  }

  get(id: ArchetypeId): Option<Archetype> {
    return this.__archetypes.get(id);
  }

  getUnchecked(id: ArchetypeId): Archetype {
    return this.__archetypes[id];
  }

  get2(a: ArchetypeId, b: ArchetypeId): [Mut<Archetype>, Mut<Archetype>] {
    if (a === b) {
      throw new Error('Cannot get mutable references to the same archetype');
    }
    return [this.__archetypes.getMut(a).unwrap(), this.__archetypes.getMut(b).unwrap()];
  }

  iter(): RustIter<Archetype> {
    return this.__archetypes.iter();
  }

  getIdOrInsert(
    components: Components,
    observers: Observers,
    tableId: TableId,
    tableComponents: Vec<ComponentId>,
    sparseSetComponents: Vec<ComponentId>,
  ): ArchetypeId {
    const archetypeIdentity = new ArchetypeComponents(tableComponents, sparseSetComponents);
    const archetypes = this.__archetypes;
    const archetypeComponentCount = this.__archetypeComponentCount;
    const componentIndex = this.__byComponent;

    const archetypeId = this.__byComponents.get(archetypeIdentity).match({
      Some: (id) => id,
      None: () => {
        const id = archetypes.len();
        const tableStart = archetypeComponentCount;
        this.__archetypeComponentCount += tableComponents.len();
        const tableArchetypeComponents = range(tableStart, this.__archetypeComponentCount);

        const sparseStart = this.__archetypeComponentCount;
        this.__archetypeComponentCount += sparseSetComponents.len();
        const sparseSetArchetypeComponents = range(sparseStart, this.__archetypeComponentCount);

        archetypes.push(
          Archetype.new(
            components,
            componentIndex,
            observers,
            id,
            tableId,
            tableComponents.iter().zip(tableArchetypeComponents),
            sparseSetComponents.iter().zip(sparseSetArchetypeComponents),
          ),
        );
        return id;
      },
    });

    return archetypeId;
  }

  archetypeComponentsLen() {
    return this.__archetypeComponentCount;
  }

  clearEntities() {
    for (const archetype of this.__archetypes) {
      archetype.clearEntities();
    }
  }

  componentIndex(): ComponentIndex {
    return this.__byComponent;
  }

  protected updateFlags(componentId: ComponentId, flags: ArchetypeFlags, set: boolean): void {
    const archetypes = this.__byComponent.get(componentId);
    if (archetypes.isSome()) {
      for (const [archetypeId] of archetypes.unwrap()) {
        // SAFETY: the component index only contains valid archetype ids
        this.__archetypes[archetypeId].flags.set(flags, set);
      }
    }
  }
}
