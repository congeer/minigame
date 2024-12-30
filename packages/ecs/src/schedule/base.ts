import { FixedBitSet } from '@minigame/utils';
import { derive, Err, Mut, Ok, Result, RustIter } from 'rustable';
import { Tick } from '../change_detection/tick';
import { ScheduleSystem } from '../system/schedule_system';
import { World } from '../world/base';
import { Schedules } from './collections';
import { IntoConfigs } from './config';
import { ExecutorKind, isApplyDeferred, makeExecutor, SystemExecutor, SystemSchedule } from './executor';
import { SingleThreadedExecutor } from './executor/single_threaded';
import { NodeId } from './graph';
import { ScheduleGraph } from './schedule_graph';
import { IntoSystemSet, ScheduleLabel, SystemSet } from './set';
import { ScheduleBuildError, ScheduleBuildSettings } from './types';

@derive(ScheduleLabel)
export class DefaultSchedule {
  static new() {
    return new DefaultSchedule();
  }
}

export class Schedule {
  label: object;
  graph = new ScheduleGraph();
  executable = new SystemSchedule();
  executor: SystemExecutor = new SingleThreadedExecutor();
  executorInitialized = false;

  constructor(label: object = DefaultSchedule) {
    if (typeof label === 'function') {
      this.label = new (label as new () => object)();
    } else {
      this.label = label;
    }
  }

  addSystems(systems: any): Schedule {
    this.graph.processConfigs(ScheduleSystem, IntoConfigs.wrap(systems).intoConfigs(), false);
    return this;
  }

  ignoreAmbiguity<S1 extends object, S2 extends object>(a: S1, b: S2): this {
    const aSet = IntoSystemSet.wrap(a).intoSystemSet();
    const bSet = IntoSystemSet.wrap(b).intoSystemSet();

    const aId = this.graph.__systemSetIds
      .get(aSet)
      .expect(
        `Could not mark system as ambiguous, '${aSet}' was not found in the schedule. Did you try to call 'ambiguousWith' before adding the system to the world?`,
      );

    const bId = this.graph.__systemSetIds
      .get(bSet)
      .expect(
        `Could not mark system as ambiguous, '${bSet}' was not found in the schedule. Did you try to call 'ambiguousWith' before adding the system to the world?`,
      );

    this.graph.__ambiguousWith.addEdge(aId, bId);

    return this;
  }

  configureSets(sets: IntoConfigs<SystemSet>): this {
    this.graph.configureSets(sets);
    return this;
  }

  setBuildSettings(settings: ScheduleBuildSettings): this {
    this.graph.__settings = settings;
    return this;
  }

  getBuildSettings(): ScheduleBuildSettings {
    return this.graph.__settings;
  }

  getExecutorKind(): ExecutorKind {
    return this.executor.kind();
  }

  setExecutorKind(executor: ExecutorKind): this {
    if (executor !== this.executor.kind()) {
      this.executor = makeExecutor(executor);
      this.executorInitialized = false;
    }
    return this;
  }

  setApplyFinalDeferred(applyFinalDeferred: boolean): this {
    this.executor.setApplyFinalDeferred(applyFinalDeferred);
    return this;
  }

  run(world: World): void {
    world.checkChangeTicks();
    this.initialize(world).unwrapOrElse((e) => {
      throw new Error(`Error when initializing schedule ${this.label}: ${e}`);
    });
    this.executor.run(this.executable, world, new FixedBitSet());
  }

  initialize(world: World, caller?: string): Result<void, ScheduleBuildError> {
    if (this.graph.changed) {
      this.graph.initialize(world);
      const ignoredAmbiguities = world.getResourceOrInit(Schedules, caller).ignoredSchedulingAmbiguities;
      const result = this.graph.updateSchedule(
        Mut.of({
          get: () => this.executable,
          set: (schedule) => (this.executable = schedule),
        }),
        world.components,
        ignoredAmbiguities,
        this.label,
      );
      if (result.isErr()) {
        return result;
      }
      this.graph.__changed = false;
      this.executorInitialized = false;
    }
    if (!this.executorInitialized) {
      this.executor.init(this.executable);
      this.executorInitialized = true;
    }
    return Ok(undefined);
  }

  checkChangeTicks(changeTick: Tick): void {
    for (const system of this.executable.systems) {
      if (!isApplyDeferred(system)) {
        system.checkChangeTick(changeTick);
      }
    }
    for (const conditions of this.executable.systemConditions) {
      for (const system of conditions) {
        system.checkChangeTick(changeTick);
      }
    }
    for (const conditions of this.executable.setConditions) {
      for (const system of conditions) {
        system.checkChangeTick(changeTick);
      }
    }
  }

  applyDeferred(world: World): void {
    for (const system of this.executable.systems) {
      system.applyDeferred(world);
    }
  }

  systems(): Result<RustIter<[NodeId, ScheduleSystem]>, Error> {
    if (!this.executorInitialized) {
      return Err(new Error('executable schedule has not been built'));
    }
    const iter = this.executable.systemIds
      .iter()
      .zip(this.executable.systems.iter())
      .map(([nodeId, system]) => [nodeId, system] as [NodeId, ScheduleSystem]);
    return Ok(iter);
  }

  systemsLen(): number {
    if (!this.executorInitialized) {
      return this.graph.__systems.len();
    } else {
      return this.executable.systems.len();
    }
  }
}
