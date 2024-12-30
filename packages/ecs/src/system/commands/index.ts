import { Constructor, None, Option, Some } from 'rustable';
import { Resource } from '../../component/types';
import { Entity } from '../../entity/base';
import { Entities } from '../../entity/collections';
import { World } from '../../world/base';
import { Command, commandFn, CommandQueue } from '../../world/command_queue';

/**
 * Commands provide a way to queue up changes to the World that will be applied at a later point.
 */
export class Commands {
  private commandQueue: CommandQueue;
  private entities: Entities;

  /**
   * Creates a new Commands instance from a CommandQueue and World
   */
  static new(commandQueue: CommandQueue, world: World): Commands {
    return new Commands(commandQueue, world.entities);
  }

  /**
   * Creates a new Commands instance from a CommandQueue and Entities
   */
  constructor(commandQueue: CommandQueue, entities: Entities) {
    this.commandQueue = commandQueue;
    this.entities = entities;
  }

  /**
   * Take all commands from other and append them to self
   */
  append(other: CommandQueue): void {
    this.commandQueue.append(other);
  }

  /**
   * Spawns a new empty entity and returns its EntityCommands
   */
  spawnEmpty(): EntityCommands {
    const entity = this.entities.reserveEntity();
    return new EntityCommands(entity, this);
  }

  /**
   * Gets EntityCommands for an existing entity, or spawns a new one if it doesn't exist
   */
  getOrSpawn(entity: Entity, caller?: string): EntityCommands {
    this.queue(
      commandFn((world: World) => {
        world.getOrSpawn(entity, caller);
      }),
    );
    return new EntityCommands(entity, this);
  }

  /**
   * Spawns a new entity with the given components
   */
  spawn<T extends object>(components: T): EntityCommands {
    const entity = this.spawnEmpty();
    entity.insert(components);
    return entity;
  }

  /**
   * Gets EntityCommands for an existing entity
   */
  entity(entity: Entity): EntityCommands {
    if (this.getEntity(entity).isSome()) {
      return new EntityCommands(entity, this);
    }
    throw new Error(`Entity ${entity} does not exist`);
  }

  /**
   * Gets EntityCommands for an existing entity if it exists
   */
  getEntity(entity: Entity): Option<EntityCommands> {
    return this.entities.contains(entity) ? Some(new EntityCommands(entity, this)) : None;
  }

  /**
   * Spawns multiple entities with components
   */
  spawnBatch<T extends object>(components: Iterable<T>): void {
    this.commandQueue.push(
      commandFn((world: World) => {
        for (const component of components) {
          world.spawn(component);
        }
      }),
    );
  }

  /**
   * Queues a command to be executed later
   */
  queue<C extends Command>(command: C): void {
    this.commandQueue.push(command);
  }

  /**
   * Inserts or spawns a batch of entities with bundles
   */
  insertOrSpawnBatch<I extends Iterable<[Entity, B]>, B extends object>(bundlesIter: I): void {
    this.queue(
      commandFn((world: World) => {
        for (const [entity, bundle] of bundlesIter) {
          if (world.entities.contains(entity)) {
            world.entity(entity).insert(bundle);
          } else {
            world.spawn(bundle).insert({ id: entity });
          }
        }
      }),
    );
  }
  /**
   * Inserts a batch of entities with bundles
   */
  insertBatch<I extends Iterable<[Entity, B]>, B extends object>(batch: I): void {
    this.queue(
      commandFn((world: World) => {
        for (const [entity, bundle] of batch) {
          world.entity(entity).insert(bundle);
        }
      }),
    );
  }
  /**
   * Inserts a batch of entities with bundles if they don't already exist
   */
  insertBatchIfNew<I extends Iterable<[Entity, B]>, B extends object>(batch: I): void {
    this.queue(
      commandFn((world: World) => {
        for (const [entity, bundle] of batch) {
          world.entity(entity).insertIfNew(bundle);
        }
      }),
    );
  }
  tryInsertBatch<I extends Iterable<[Entity, B]>, B extends object>(batch: I): void {
    this.queue(
      commandFn((world: World) => {
        for (const [entity, bundle] of batch) {
          if (world.entities.contains(entity)) {
            world.entity(entity).insert(bundle);
          }
        }
      }),
    );
  }
  tryInsertBatchIfNew<I extends Iterable<[Entity, B]>, B extends object>(batch: I): void {
    this.queue(
      commandFn((world: World) => {
        for (const [entity, bundle] of batch) {
          if (world.entities.contains(entity)) {
            world.entity(entity).insertIfNew(bundle);
          }
        }
      }),
    );
  }

  /**
   * Initializes a resource of type R
   */
  initResource<R extends Resource>(resource: Constructor<R>): void {
    this.commandQueue.push(
      commandFn((world: World) => {
        world.initResource(resource);
      }),
    );
  }

  /**
   * Inserts a resource into the World
   */
  insertResource<R extends Resource>(resource: R): void {
    this.commandQueue.push(
      commandFn((world: World) => {
        world.insertResource(resource);
      }),
    );
  }

  /**
   * Removes a resource from the World
   */
  removeResource<R extends Resource>(resource: Constructor<R>): void {
    this.commandQueue.push(
      commandFn((world: World) => {
        world.removeResource(resource);
      }),
    );
  }
}

/**
 * Commands for modifying a specific entity
 */
export class EntityCommands {
  entity: Entity;
  commands: Commands;

  constructor(entity: Entity, commands: Commands) {
    this.entity = entity;
    this.commands = commands;
  }

  /**
   * Gets the entity ID
   */
  id(): Entity {
    return this.entity;
  }

  /**
   * Inserts components into the entity
   */
  insert<T extends object>(components: T): EntityCommands {
    this.commands.queue(
      commandFn((world: World) => {
        world.entity(this.entity).insert(components);
      }),
    );
    return this;
  }

  /**
   * Despawns the entity
   */
  despawn(): void {
    this.commands.queue(
      commandFn((world: World) => {
        world.despawn(this.entity);
      }),
    );
  }

  /**
   * Removes a bundle from the entity
   */
  remove<T extends object>(bundle: Constructor<T>): EntityCommands {
    this.commands.queue(
      commandFn((world: World) => {
        world.entity(this.entity).remove(bundle);
      }),
    );
    return this;
  }
}
