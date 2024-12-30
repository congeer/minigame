import { derive, Err, Option, Result, Some, trait } from 'rustable';
import { World } from './base';

/**
 * Interface for commands that can be queued and executed later
 */
@trait
export class Command {
  apply(_world: World): void {
    throw new Error('Command.apply must be implemented');
  }
}

/**
 * Metadata for a command, containing function to consume and execute/drop the command
 */
interface CommandMeta<T extends object> {
  /**
   * Function to consume the command and get its size
   * @param command The command to consume
   * @param world Optional world to apply the command to
   */
  consumeCommandAndGetSize(command: T, world: Option<World>): void;
}

/**
 * A queue of heterogeneous commands that can be executed later
 */
export class CommandQueue {
  private __bytes: Array<{ meta: CommandMeta<any>; command: object }> = [];
  private __cursor: number = 0;
  private __panicRecovery: Array<{
    meta: CommandMeta<any>;
    command: object;
  }> = [];
  resume?: (error: Error) => Result<any, Error> = (error) => Err(error);

  /**
   * Push a command onto the queue
   */
  push<C extends object>(command: C): void {
    const meta: CommandMeta<C> = {
      consumeCommandAndGetSize: (cmd: C, world: Option<World>) => {
        world.match({
          Some: (w) => {
            (cmd as Command).apply(w);
            // The command may have queued up world commands, which we flush here
            w.flush();
          },
          None: () => {
            // drop
          },
        });
      },
    };

    this.__bytes.push({ meta, command });
  }

  /**
   * Execute all queued commands in the world
   */
  apply(world: World): void {
    // Flush any previously queued entities
    world.flushEntities();

    // Flush the world's internal queue
    world.flushCommands();

    this.applyOrDropQueued(Some(world));
  }

  /**
   * Take all commands from other and append them to self
   */
  append(other: CommandQueue): void {
    this.__bytes.push(...other.__bytes);
    other.__bytes = [];
  }

  /**
   * Returns true if there are no commands in the queue
   */
  isEmpty(): boolean {
    return this.__cursor >= this.__bytes.length;
  }

  /**
   * Apply or drop all queued commands
   */
  applyOrDropQueued(world: Option<World>): void {
    const start = this.__cursor;
    const stop = this.__bytes.length;
    let localCursor = start;
    this.__cursor = stop;

    try {
      while (localCursor < stop) {
        const { meta, command } = this.__bytes[localCursor];
        localCursor++;
        try {
          meta.consumeCommandAndGetSize(command, world);
        } catch (error) {
          let result: Result<any, Error>;
          if (this.resume) {
            result = this.resume(error as Error);
          } else {
            result = Err(error as Error);
          }
          if (result.isErr()) {
            // Handle panic recovery
            const currentStop = this.__bytes.length;
            this.__panicRecovery.push(...this.__bytes.slice(localCursor, currentStop));
            this.__bytes.length = start;
            this.__cursor = start;

            if (start === 0) {
              this.__bytes.push(...this.__panicRecovery);
            }
            throw result.unwrapErr();
          }
        }
      }
    } finally {
      // Reset the buffer
      this.__bytes.length = start;
      this.__cursor = start;
    }
  }
}

@derive(Command)
export class FunctionCommand {
  constructor(public fn: (world: World) => void) {}

  apply(world: World): void {
    this.fn(world);
  }
}

export function commandFn(command: (world: World) => void) {
  return new FunctionCommand(command);
}
