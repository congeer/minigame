import { Schedules } from 'packages/ecs/src/schedule/collections';
import { Resource } from '../../src/component/types';
import { Access } from '../../src/query/access';
import { World } from '../../src/world/base';

import { Schedule } from 'packages/ecs/src/schedule/base';
import { IntoSystemSet, ScheduleLabel, SystemSet, SystemTypeSet } from 'packages/ecs/src/schedule/set';
import { LogLevel, ScheduleBuildSettings } from 'packages/ecs/src/schedule/types';
import { ReadOnlySystem, System } from 'packages/ecs/src/system/base';
import { Commands } from 'packages/ecs/src/system/commands';
import { WorldCell } from 'packages/ecs/src/world/cell';
import { Constructor, derive, Eq, hasTrait, implTrait } from 'rustable';

@derive(Resource)
class Resource1 {}

@derive(Resource)
class Resource2 {}

class FnSystem<T extends (...args: any[]) => any> {
  params: Function[] = [];
  constructor(
    public func: T,
    public paramTypes: Constructor<any>[],
  ) {}

  name(): string {
    return this.func.name || 'anonymous_system';
  }

  run(_input: any, world: World): any {
    const ret = this.func(world.commands, ...this.params.map((p) => p()), _input);
    return ret;
  }

  runUnsafe(_input: any, world: WorldCell): any {
    const ret = this.func(world.commands, ...this.params.map((p) => p()), _input);
    return ret;
  }

  hasDeferred(): boolean {
    return true;
  }

  isExclusive(): boolean {
    return false;
  }
  componentAccess(): Access {
    return new Access();
  }

  archetypeComponentAccess(): Access {
    return new Access();
  }

  updateArchetypeComponentAccess(_world: WorldCell): void {}

  validateParam(_world: World): boolean {
    // for (let i = 0; i < this.paramTypes.length; i++) {
    //   if (hasTrait(this.paramTypes[i], Resource)) {
    //     if (_world.getResource(this.paramTypes[i]).isNone()) {
    //       return false;
    //     }
    //   }
    // }
    return true;
  }

  applyDeferred(_world: World): void {
    _world.flush();
  }

  validateParamUnsafe(_world: WorldCell): boolean {
    // for (let i = 0; i < this.paramTypes.length; i++) {
    //   if (hasTrait(this.paramTypes[i], Resource)) {
    //     if (_world.getResource(this.paramTypes[i]).isNone()) {
    //       return false;
    //     }
    //   }
    // }
    return true;
  }

  initialize(_world: World): void {
    for (let i = 0; i < this.paramTypes.length; i++) {
      if (hasTrait(this.paramTypes[i], Resource)) {
        this.params[i] = () => {
          let resource = _world.getResource(this.paramTypes[i]);
          return resource.unwrapOr(undefined);
        };
      }
    }
  }
}

implTrait(FnSystem, System);

interface FnSystem<T extends (...args: any[]) => any> extends System<T>, IntoSystemSet {}
const systemFn = (paramtypes: Constructor<any>[], func: (...args: any[]) => any) => new FnSystem(func, paramtypes);

class FnCondition<T extends (...args: any[]) => boolean> {
  params: Function[] = [];
  constructor(
    public func: T,
    public paramTypes: Constructor<any>[],
  ) {}

  name(): string {
    return this.func.name || 'anonymous_system';
  }

  run(_input: any, world: World): any {
    const ret = this.func(world.commands, ...this.params.map((p) => p()), _input);
    world.flush();
    return ret;
  }

  runUnsafe(_input: any, world: WorldCell): any {
    const ret = this.func(world.commands, ...this.params.map((p) => p()), _input);
    return ret;
  }

  hasDeferred(): boolean {
    return true;
  }

  isExclusive(): boolean {
    return false;
  }
  componentAccess(): Access {
    return new Access();
  }

  archetypeComponentAccess(): Access {
    return new Access();
  }
  updateArchetypeComponentAccess(_world: WorldCell): void {}

  validateParam(_world: World): boolean {
    for (let i = 0; i < this.paramTypes.length; i++) {
      if (hasTrait(this.paramTypes[i], Resource)) {
        if (_world.getResource(this.paramTypes[i]).isNone()) {
          return false;
        }
      }
    }
    return true;
  }

  validateParamUnsafe(_world: WorldCell): boolean {
    for (let i = 0; i < this.paramTypes.length; i++) {
      if (hasTrait(this.paramTypes[i], Resource)) {
        if (_world.getResource(this.paramTypes[i]).isNone()) {
          return false;
        }
      }
    }
    return true;
  }

  initialize(_world: World): void {
    for (let i = 0; i < this.paramTypes.length; i++) {
      if (hasTrait(this.paramTypes[i], Resource)) {
        this.params[i] = () => _world.resource(this.paramTypes[i]);
      }
    }
  }
}
implTrait(FnSystem, IntoSystemSet, {
  intoSystemSet(): SystemSet {
    return new SystemTypeSet(FnSystem);
  },
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface FnCondition<T extends (...args: any[]) => boolean> extends ReadOnlySystem<any, boolean> {}

implTrait(FnCondition, System);
implTrait(FnCondition, ReadOnlySystem);

const conditionFn = (paramtypes: Constructor<any>[], func: (...args: any[]) => any) =>
  new FnCondition(func, paramtypes);

// regression test for https://github.com/bevyengine/bevy/issues/9114
test('ambiguous_with_not_breaking_run_conditions', () => {
  @derive([SystemSet, Eq])
  class Set {}

  @derive([SystemSet, Eq])
  class EmptySet {}

  interface EmptySet extends SystemSet {}

  interface Set extends SystemSet {}

  const world = new World();
  const schedule = new Schedule();

  const sys = systemFn([], () => {
    throw new Error('This system must not run');
  });

  schedule.configureSets(new Set().runIf(conditionFn([], () => false)));
  schedule.addSystems(sys.ambiguousWith(new EmptySet()).inSet(new Set()));
  schedule.run(world);
});

test('inserts_a_sync_point', () => {
  const schedule = new Schedule();
  const world = new World();
  schedule.addSystems(
    [
      systemFn([], (commands: Commands) => commands.insertResource(new Resource1())),
      systemFn([Resource1], (_: Resource1) => {}),
    ].chain(),
  );
  schedule.run(world);

  // inserted a sync point
  expect(schedule.executable.systems.len()).toBe(3);
});

test('merges_sync_points_into_one', () => {
  const schedule = new Schedule();
  const world = new World();
  // insert two parallel command systems, it should only create one sync point
  schedule.addSystems(
    [
      [
        systemFn([], (commands: Commands) => commands.insertResource(new Resource1())),
        systemFn([], (commands: Commands) => commands.insertResource(new Resource2())),
      ],
      systemFn([Resource1, Resource2], (_: Resource1, __: Resource2) => {}),
    ].chain(),
  );
  schedule.run(world);

  // inserted sync points
  expect(schedule.executable.systems.len()).toBe(4);

  // merges sync points on rebuild
  schedule.addSystems(
    [
      [
        systemFn([], (commands: Commands) => commands.insertResource(new Resource1())),
        systemFn([], (commands: Commands) => commands.insertResource(new Resource2())),
      ],
      systemFn([Resource1, Resource2], (_: Resource1, __: Resource2) => {}),
    ].chain(),
  );
  schedule.run(world);

  expect(schedule.executable.systems.len()).toBe(7);
});

test('adds_multiple_consecutive_syncs', () => {
  const schedule = new Schedule();
  const world = new World();
  // insert two consecutive command systems, it should create two sync points
  schedule.addSystems(
    [
      systemFn([], (commands: Commands) => commands.insertResource(new Resource1())),
      systemFn([], (commands: Commands) => commands.insertResource(new Resource2())),
      systemFn([Resource1, Resource2], (_: Resource1, __: Resource2) => {}),
    ].chain(),
  );
  schedule.run(world);

  expect(schedule.executable.systems.len()).toBe(5);
});

test('disable_auto_sync_points', () => {
  const schedule = new Schedule();
  schedule.setBuildSettings(new ScheduleBuildSettings(LogLevel.Ignore, LogLevel.Warn, false));
  const world = new World();
  schedule.addSystems(
    [
      systemFn([], (commands: Commands) => commands.insertResource(new Resource1())),
      systemFn([Resource1], (_: Resource1) => {}),
    ].chain(),
  );
  schedule.run(world);

  expect(schedule.executable.systems.len()).toBe(2);
});

describe('no_sync_edges', () => {
  const insertResource = systemFn([], function insertResource(commands: Commands) {
    commands.insertResource(new Resource1());
  });

  const resourceDoesNotExist = systemFn(
    [Resource1],
    function resourceDoesNotExist(commands: Commands, res?: Resource1) {
      expect(res).toBeUndefined();
    },
  );

  @derive(SystemSet)
  class Sets {
    constructor(public value: number) {}
    static A = new Sets(1);
    static B = new Sets(2);
  }

  interface Sets extends SystemSet {}

  function checkNoSyncEdges(addSystems: (schedule: Schedule) => void) {
    const schedule = new Schedule();
    const world = new World();
    addSystems(schedule);

    schedule.run(world);

    expect(schedule.executable.systems.len()).toBe(2);
  }

  test('system_to_system_after', () => {
    checkNoSyncEdges((schedule) => {
      schedule.addSystems([insertResource, resourceDoesNotExist.afterIgnoreDeferred(insertResource)]);
    });
  });

  test('system_to_system_before', () => {
    checkNoSyncEdges((schedule) => {
      schedule.addSystems([insertResource.beforeIgnoreDeferred(resourceDoesNotExist), resourceDoesNotExist]);
    });
  });

  test('set_to_system_after', () => {
    checkNoSyncEdges((schedule) => {
      schedule
        .addSystems([insertResource, resourceDoesNotExist.inSet(Sets.A)])
        .configureSets(Sets.A.afterIgnoreDeferred(insertResource));
    });
  });

  test('set_to_system_before', () => {
    checkNoSyncEdges((schedule) => {
      schedule
        .addSystems([insertResource.inSet(Sets.A), resourceDoesNotExist])
        .configureSets(Sets.A.beforeIgnoreDeferred(resourceDoesNotExist));
    });
  });

  test('set_to_set_after', () => {
    checkNoSyncEdges((schedule) => {
      schedule
        .addSystems([insertResource.inSet(Sets.A), resourceDoesNotExist.inSet(Sets.B)])
        .configureSets(Sets.B.afterIgnoreDeferred(Sets.A));
    });
  });

  test('set_to_set_before', () => {
    checkNoSyncEdges((schedule) => {
      schedule
        .addSystems([insertResource.inSet(Sets.A), resourceDoesNotExist.inSet(Sets.B)])
        .configureSets(Sets.A.beforeIgnoreDeferred(Sets.B));
    });
  });
});

describe('no_sync_chain', () => {
  @derive(Resource)
  class Ra {}

  @derive(Resource)
  class Rb {}

  @derive(Resource)
  class Rc {}

  function runSchedule(expectedNumSystems: number, addSystems: (schedule: Schedule) => void) {
    const schedule = new Schedule();
    const world = new World();
    addSystems(schedule);

    schedule.run(world);

    expect(schedule.executable.systems.len()).toBe(expectedNumSystems);
  }

  test('only_chain_outside', () => {
    runSchedule(5, (schedule) => {
      schedule.addSystems(
        [
          [
            systemFn([], (commands: Commands) => {
              commands.insertResource(new Ra());
            }),
            systemFn([], (commands: Commands) => commands.insertResource(new Rb())),
          ],
          [
            systemFn([Ra, Rb], (commands: Commands, resA?: Ra, resB?: Rb) => {
              expect(resA).toBeDefined();
              expect(resB).toBeDefined();
            }),
            systemFn([Ra, Rb], (commands: Commands, resA?: Ra, resB?: Rb) => {
              expect(resA).toBeDefined();
              expect(resB).toBeDefined();
            }),
          ],
        ].chain(),
      );
    });

    runSchedule(4, (schedule) => {
      schedule.addSystems(
        [
          [
            systemFn([], (commands: Commands) => commands.insertResource(new Ra())),
            systemFn([], (commands: Commands) => commands.insertResource(new Rb())),
          ],
          [
            systemFn([Ra, Rb], (commands: Commands, resA?: Ra, resB?: Rb) => {
              expect(resA).toBeUndefined();
              expect(resB).toBeUndefined();
            }),
            systemFn([Ra, Rb], (commands: Commands, resA?: Ra, resB?: Rb) => {
              expect(resA).toBeUndefined();
              expect(resB).toBeUndefined();
            }),
          ],
        ].chainIgnoreDeferred(),
      );
    });
  });

  test('chain_first', () => {
    runSchedule(6, (schedule) => {
      schedule.addSystems(
        [
          [
            systemFn([], (commands: Commands) => commands.insertResource(new Ra())),
            systemFn([Ra], (commands: Commands, resA?: Ra) => {
              commands.insertResource(new Rb());
              expect(resA).toBeDefined();
            }),
          ].chain(),
          [
            systemFn([Ra, Rb], (commands: Commands, resA?: Ra, resB?: Rb) => {
              expect(resA).toBeDefined();
              expect(resB).toBeDefined();
            }),
            systemFn([Ra, Rb], (commands: Commands, resA?: Ra, resB?: Rb) => {
              expect(resA).toBeDefined();
              expect(resB).toBeDefined();
            }),
          ],
        ].chain(),
      );
    });

    runSchedule(5, (schedule) => {
      schedule.addSystems(
        [
          [
            systemFn([], (commands: Commands) => commands.insertResource(new Ra())),
            systemFn([Ra], (commands: Commands, resA?: Ra) => {
              commands.insertResource(new Rb());
              expect(resA).toBeDefined();
            }),
          ].chain(),
          [
            systemFn([Ra, Rb], (commands: Commands, resA?: Ra, resB?: Rb) => {
              expect(resA).toBeDefined();
              expect(resB).toBeUndefined();
            }),
            systemFn([Ra, Rb], (commands: Commands, resA?: Ra, resB?: Rb) => {
              expect(resA).toBeDefined();
              expect(resB).toBeUndefined();
            }),
          ],
        ].chainIgnoreDeferred(),
      );
    });
  });

  test('chain_second', () => {
    runSchedule(6, (schedule) => {
      schedule.addSystems(
        [
          [
            systemFn([], (commands: Commands) => commands.insertResource(new Ra())),
            systemFn([], (commands: Commands) => commands.insertResource(new Rb())),
          ],
          [
            systemFn([Ra, Rb], (commands: Commands, resA?: Ra, resB?: Rb) => {
              commands.insertResource(new Rc());
              expect(resA).toBeDefined();
              expect(resB).toBeDefined();
            }),
            systemFn([Ra, Rb, Rc], (commands: Commands, resA?: Ra, resB?: Rb, resC?: Rc) => {
              expect(resA).toBeDefined();
              expect(resB).toBeDefined();
              expect(resC).toBeDefined();
            }),
          ].chain(),
        ].chain(),
      );
    });

    runSchedule(5, (schedule) => {
      schedule.addSystems(
        [
          [
            systemFn([], (commands: Commands) => commands.insertResource(new Ra())),
            systemFn([], (commands: Commands) => commands.insertResource(new Rb())),
          ],
          [
            systemFn([Ra, Rb], (commands: Commands, resA?: Ra, resB?: Rb) => {
              commands.insertResource(new Rc());
              expect(resA).toBeUndefined();
              expect(resB).toBeUndefined();
            }),
            systemFn([Ra, Rb, Rc], (commands: Commands, resA?: Ra, resB?: Rb, resC?: Rc) => {
              expect(resA).toBeDefined();
              expect(resB).toBeDefined();
              expect(resC).toBeDefined();
            }),
          ].chain(),
        ].chainIgnoreDeferred(),
      );
    });
  });

  test('chain_all', () => {
    runSchedule(7, (schedule) => {
      schedule.addSystems(
        [
          [
            systemFn([], (commands: Commands) => commands.insertResource(new Ra())),
            systemFn([Ra], (commands: Commands, resA?: Ra) => {
              commands.insertResource(new Rb());
              expect(resA).toBeDefined();
            }),
          ].chain(),
          [
            systemFn([Ra, Rb], (commands: Commands, resA?: Ra, resB?: Rb) => {
              commands.insertResource(new Rc());
              expect(resA).toBeDefined();
              expect(resB).toBeDefined();
            }),
            systemFn([Ra, Rb, Rc], (commands: Commands, resA?: Ra, resB?: Rb, resC?: Rc) => {
              expect(resA).toBeDefined();
              expect(resB).toBeDefined();
              expect(resC).toBeDefined();
            }),
          ].chain(),
        ].chain(),
      );
    });

    runSchedule(6, (schedule) => {
      schedule.addSystems(
        [
          [
            systemFn([], (commands: Commands) => commands.insertResource(new Ra())),
            systemFn([Ra], (commands: Commands, resA?: Ra) => {
              commands.insertResource(new Rb());
              expect(resA).toBeDefined();
            }),
          ].chain(),
          [
            systemFn([Ra, Rb], (commands: Commands, resA?: Ra, resB?: Rb) => {
              commands.insertResource(new Rc());
              expect(resA).toBeDefined();
              expect(resB).toBeUndefined();
            }),
            systemFn([Ra, Rb, Rc], (commands: Commands, resA?: Ra, resB?: Rb, resC?: Rc) => {
              expect(resA).toBeDefined();
              expect(resB).toBeDefined();
              expect(resC).toBeDefined();
            }),
          ].chain(),
        ].chainIgnoreDeferred(),
      );
    });
  });
});

@derive(ScheduleLabel)
class TestSchedule {
  static hash() {
    return 'TestSchedule';
  }

  static equals(other: any) {
    return other instanceof TestSchedule;
  }

  static clone() {
    return new TestSchedule();
  }
}

@derive(Resource)
class CheckSystemRan {
  constructor(public value: number = 0) {}
}

test('add_systems_to_existing_schedule', () => {
  const schedules = new Schedules();
  const schedule = new Schedule(new TestSchedule());

  schedules.insert(schedule);
  schedules.addSystems(
    new TestSchedule(),
    systemFn([CheckSystemRan], (commands: Commands, ran: CheckSystemRan) => ran.value++),
  );

  const world = new World();

  world.insertResource(new CheckSystemRan(0));
  world.insertResource(schedules);
  world.runSchedule(new TestSchedule());

  const value = world.getResource(CheckSystemRan);
  expect(value.isSome()).toBe(true);
  expect(value.unwrap().value).toBe(1);
});

test('add_systems_to_non_existing_schedule', () => {
  const schedules = new Schedules();

  schedules.addSystems(
    new TestSchedule(),
    systemFn([CheckSystemRan], (commands: Commands, ran: CheckSystemRan) => ran.value++),
  );

  const world = new World();

  world.insertResource(new CheckSystemRan(0));
  world.insertResource(schedules);
  world.runSchedule(new TestSchedule());

  const value = world.getResource(CheckSystemRan);
  expect(value.isSome()).toBe(true);
  expect(value.unwrap().value).toBe(1);
});

@derive(SystemSet)
class TestSet {
  constructor(public id: number) {}
  static First = new TestSet(0);
  static Second = new TestSet(1);
}

interface TestSet extends SystemSet {}

test('configure_set_on_existing_schedule', () => {
  const schedules = new Schedules();
  const schedule = new Schedule(new TestSchedule());

  schedules.insert(schedule);

  schedules.configureSets(new TestSchedule(), [TestSet.First, TestSet.Second].chain());
  schedules.addSystems(
    new TestSchedule(),
    systemFn([CheckSystemRan], (commands: Commands, ran: CheckSystemRan) => {
      expect(ran.value).toBe(0);
      ran.value++;
    }).inSet(TestSet.First),
  );

  schedules.addSystems(
    new TestSchedule(),
    systemFn([CheckSystemRan], (commands: Commands, ran: CheckSystemRan) => {
      expect(ran.value).toBe(1);
      ran.value++;
    }).inSet(TestSet.Second),
  );

  const world = new World();

  world.insertResource(new CheckSystemRan(0));
  world.insertResource(schedules);
  world.runSchedule(new TestSchedule());

  const value = world.getResource(CheckSystemRan);
  expect(value.isSome()).toBe(true);
  expect(value.unwrap().value).toBe(2);
});

test('configure_set_on_new_schedule', () => {
  const schedules = new Schedules();

  schedules.configureSets(new TestSchedule(), [TestSet.First, TestSet.Second].chain());
  schedules.addSystems(
    new TestSchedule(),
    systemFn([CheckSystemRan], (commands: Commands, ran: CheckSystemRan) => {
      expect(ran.value).toBe(0);
      ran.value++;
    }).inSet(TestSet.First),
  );

  schedules.addSystems(
    new TestSchedule(),
    systemFn([CheckSystemRan], (commands: Commands, ran: CheckSystemRan) => {
      expect(ran.value).toBe(1);
      ran.value++;
    }).inSet(TestSet.Second),
  );

  const world = new World();

  world.insertResource(new CheckSystemRan(0));
  world.insertResource(schedules);
  world.runSchedule(new TestSchedule());

  const value = world.getResource(CheckSystemRan);
  expect(value.isSome()).toBe(true);
  expect(value.unwrap().value).toBe(2);
});
