import { Constructor, derive, HashMap, HashSet, Option, RustIter } from 'rustable';
import { Tick } from '../change_detection/tick';
import { Components } from '../component/collections';
import { ComponentId, Resource } from '../component/types';
import { World } from '../world/base';
import { Schedule } from './base';
import { ScheduleLabel } from './set';
import { ScheduleBuildSettings } from './types';

@derive([Resource])
export class Schedules {
  inner: HashMap<object, Schedule> = new HashMap();
  ignoredSchedulingAmbiguities: HashSet<ComponentId> = new HashSet();

  insert(schedule: Schedule): Option<Schedule> {
    return this.inner.insert(schedule.label, schedule);
  }

  remove<T extends object>(label: T): Option<Schedule> {
    return this.inner.remove(label);
  }

  removeEntry<T extends object>(label: T): Option<[T, Schedule]> {
    return this.inner.removeEntry(label) as Option<[T, Schedule]>;
  }

  contains<T extends object>(label: T): boolean {
    return this.inner.containsKey(label);
  }

  get<T extends object>(label: T): Option<Schedule> {
    return this.inner.get(label);
  }

  entry<T extends object>(label: T): Schedule {
    return this.inner.entry(label).orInsertWith(() => new Schedule(label));
  }

  iter<T extends object>(): RustIter<[T, Schedule]> {
    return this.inner.iter() as RustIter<[T, Schedule]>;
  }

  checkChangeTicks(changeTick: Tick) {
    for (let schedule of this.inner.values()) {
      schedule.checkChangeTicks(changeTick);
    }
  }

  configureSchedules(scheduleBuildSettings: ScheduleBuildSettings) {
    for (let schedule of this.inner.values()) {
      schedule.setBuildSettings(scheduleBuildSettings);
    }
  }

  allowAmbiguousComponent<T extends object>(component: Constructor<T>, world: World) {
    this.ignoredSchedulingAmbiguities.insert(world.registerComponent<T>(component));
  }

  allowAmbiguousResource<T extends object>(res: Constructor<T>, world: World) {
    this.ignoredSchedulingAmbiguities.insert(world.registerResource<T>(res));
  }

  iterIgnoredAmbiguities() {
    return this.ignoredSchedulingAmbiguities.iter();
  }

  printIgnoredAmbiguities(components: Components) {
    let message = 'System order ambiguities caused by conflicts on the following types are ignored:\n';
    for (let id of this.iterIgnoredAmbiguities()) {
      message += components.getName(id).unwrap() + '\n';
    }
    console.log(message);
  }

  addSystems<T extends object>(label: T, system: any) {
    this.entry(label).addSystems(system);
    return this;
  }

  configureSets<T extends object>(label: T, sets: any): this {
    this.entry(label).configureSets(sets);
    return this;
  }

  ignoreAmbiguity<S1 extends object, S2 extends object>(schedule: ScheduleLabel, a: S1, b: S2): this {
    this.entry(schedule).ignoreAmbiguity(a, b);
    return this;
  }
}
