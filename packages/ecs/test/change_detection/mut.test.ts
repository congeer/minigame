import { Mut, None, Some, typeId } from 'rustable';
import { DetectChanges, DetectChangesMut } from '../../src/change_detection/detect_changes';
import { MutUntyped, MutValue } from '../../src/change_detection/mut';
import { ComponentTicks, Tick, Ticks } from '../../src/change_detection/tick';

describe('Mut', () => {
  let value: number;
  let added: Tick;
  let lastChanged: Tick;
  let lastRun: Tick;
  let thisRun: Tick;
  let mut: MutValue<number>;

  new DetectChanges();
  new DetectChangesMut();

  expect(typeId(MutValue<number>)).toBe(typeId(MutValue));

  beforeEach(() => {
    value = 42;
    added = new Tick(1);
    lastChanged = new Tick(2);
    lastRun = new Tick(1);
    thisRun = new Tick(3);
    mut = MutValue.new(
      Mut.of({
        get: () => value,
        set: (v) => (value = v),
      }),
      added,
      lastChanged,
      lastRun,
      thisRun,
    );
  });

  test('asRef converts to Ref while preserving state', () => {
    const ref = mut.asRef();

    expect(ref.value).toBe(value);
    expect(ref.isAdded()).toBe(mut.isAdded());
    expect(ref.isChanged()).toBe(mut.isChanged());
    expect(ref.lastChanged().get()).toBe(mut.lastChanged().get());
  });

  test('reborrow creates new Mut with same state', () => {
    const reMut = mut.reborrow();

    expect(reMut.value).toBe(mut.value);
    expect(reMut.isAdded()).toBe(mut.isAdded());
    expect(reMut.isChanged()).toBe(mut.isChanged());
    expect(reMut.lastChanged().get()).toBe(mut.lastChanged().get());
  });

  test('filterMapUnchanged with Some result', () => {
    const result = mut.filterMapUnchanged((x) =>
      Some(
        Mut.of({
          get: () => x * 2,
          set: (v) => (x[Mut.ptr] = v),
        }),
      ),
    );

    // expect(result).toBe(Some(84));
    const mappedMut = result.unwrap();
    expect(mappedMut.value).toBe(84);
    expect(mappedMut.isAdded()).toBe(mut.isAdded());
    expect(mappedMut.isChanged()).toBe(mut.isChanged());
    expect(mappedMut.lastChanged().get()).toBe(mut.lastChanged().get());
  });

  test('filterMapUnchanged with None result', () => {
    const result = mut.filterMapUnchanged((_x) => None);
    expect(result).toBe(None);
  });

  test('mapUnchanged transforms value while preserving state', () => {
    const mappedMut = mut.mapUnchanged((x) =>
      Mut.of({
        get: () => x * 2,
        set: (v) => (x[Mut.ptr] = v),
      }),
    );

    expect(mappedMut.value).toBe(84);
    expect(mappedMut.isAdded()).toBe(mut.isAdded());
    expect(mappedMut.isChanged()).toBe(mut.isChanged());
    expect(mappedMut.lastChanged().get()).toBe(mut.lastChanged().get());
  });

  test('setChanged updates change tick', () => {
    mut.setChanged();
    expect(mut.lastChanged().get()).toBe(thisRun.get());
  });

  test('setLastChanged sets specific change tick', () => {
    const newTick = new Tick(5);
    mut.setLastChanged(newTick);
    expect(mut.lastChanged().get()).toBe(5);
  });

  test('bypassChangeDetection returns value without updating change tick', () => {
    const originalChangeTick = mut.lastChanged().get();
    const value = mut.bypassChangeDetection();
    expect(value[Mut.ptr]).toBe(42);
    expect(mut.lastChanged().get()).toBe(originalChangeTick);
  });

  test('set_if_neq', () => {
    class R2 {
      constructor(public value: number) {}
    }

    const lastRun = new Tick(2);
    const thisRun = new Tick(3);
    const added = new Tick(1);
    const changed = new Tick(2);
    const ticks = new Ticks(added, changed, lastRun, thisRun);

    // Create the value
    let r2 = new R2(0);
    const mut = MutValue.new(
      Mut.of({
        get: () => r2,
        set: (value) => (r2 = value),
      }),
      ticks,
    );
    expect(mut.isChanged()).toBe(false);

    // Setting same value should not trigger change
    mut.setIfNeq(new R2(0));
    expect(mut.isChanged()).toBe(false);

    // Setting different value should trigger change
    mut.setIfNeq(new R2(3));
    expect(mut.isChanged()).toBe(true);
  });
});

describe('MutUntyped', () => {
  let value: number;
  let added: Tick;
  let lastChanged: Tick;
  let lastRun: Tick;
  let thisRun: Tick;
  let mutUntyped: MutUntyped;

  beforeEach(() => {
    value = 42;
    added = new Tick(1);
    lastChanged = new Tick(2);
    lastRun = new Tick(1);
    thisRun = new Tick(3);
    mutUntyped = MutUntyped.new(
      Mut.of({
        get: () => value,
        set: (v) => (value = v as number),
      }),
      added,
      lastChanged,
      lastRun,
      thisRun,
    );
  });

  test('reborrow creates new MutUntyped with same state', () => {
    const reMut = mutUntyped.reborrow();

    expect(reMut.isAdded()).toBe(mutUntyped.isAdded());
    expect(reMut.isChanged()).toBe(mutUntyped.isChanged());
    expect(reMut.lastChanged().get()).toBe(mutUntyped.lastChanged().get());
  });

  test('setChanged updates change tick', () => {
    mutUntyped.setChanged();
    expect(mutUntyped.lastChanged().get()).toBe(thisRun.get());
  });

  test('setLastChanged sets specific change tick', () => {
    const newTick = new Tick(5);
    mutUntyped.setLastChanged(newTick);
    expect(mutUntyped.lastChanged().get()).toBe(5);
  });

  test('isAdded returns true for newly added components', () => {
    const newMut = MutUntyped.new(
      Mut.of({
        get: () => value,
        set: (v) => (value = v as number),
      }),
      new Tick(2), // added after lastRun
      lastChanged,
      lastRun,
      thisRun,
    );
    expect(newMut.isAdded()).toBe(true);
  });

  test('isChanged returns true for recently changed components', () => {
    const changedMut = MutUntyped.new(
      Mut.of({
        get: () => value,
        set: (v) => (value = v as number),
      }),
      added,
      new Tick(2), // changed after lastRun
      lastRun,
      thisRun,
    );
    expect(changedMut.isChanged()).toBe(true);
  });

  test('map_mut transforms and tracks changes', () => {
    // Create an outer structure with a nested value
    class Outer {
      constructor(public value: number) {}
    }

    const lastRun = new Tick(2);
    const thisRun = new Tick(3);
    const added = new Tick(1);
    const changed = new Tick(2);
    const componentTicks = new ComponentTicks(added, changed);

    const ticks = new Ticks(added, changed, lastRun, thisRun);

    // Create the outer value
    let outer = new Outer(0);
    const mut = MutValue.new(
      Mut.of({
        get: () => outer,
        set: (v) => (outer = v),
      }),
      ticks,
    );
    expect(mut.isChanged()).toBe(false);

    // Map to the inner value while preserving change detection
    const inner = mut.mapUnchanged((x) =>
      Mut.of({
        get: () => x.value,
        set: (v) => (x.value = v),
      }),
    );
    expect(inner.isChanged()).toBe(false);

    // Modify the inner value
    inner.value = 64;
    expect(inner.isChanged()).toBe(true);
    // Modifying the inner value should flag a change for the entire component
    expect(componentTicks.isChanged(lastRun, thisRun)).toBe(true);
  });

  test('mut_untyped_from_mut conversion preserves ticks', () => {
    const componentTicks = {
      added: new Tick(1),
      changed: new Tick(2),
    };

    const ticks = {
      added: componentTicks.added,
      changed: componentTicks.changed,
      lastRun: new Tick(3),
      thisRun: new Tick(4),
    };

    class C {}
    let c = new C();

    const mutTyped = MutValue.new(
      Mut.of({
        get: () => c,
        set: (v) => (c = v),
      }),
      ticks,
    );
    const intoMut = mutTyped.into(MutUntyped);

    expect(intoMut.ticks.added.get()).toBe(1);
    expect(intoMut.ticks.changed.get()).toBe(2);
    expect(intoMut.ticks.lastRun.get()).toBe(3);
    expect(intoMut.ticks.thisRun.get()).toBe(4);
  });

  test('mut_untyped_to_reflect', () => {
    const lastRun = new Tick(2);
    const thisRun = new Tick(3);
    const added = new Tick(1);
    const changed = new Tick(2);
    const ticks = new Ticks(added, changed, lastRun, thisRun);

    // Create initial value
    let value = 5;
    const mutUntyped = MutUntyped.new(
      Mut.of({
        get: () => value,
        set: (v) => (value = v as number),
      }),
      ticks,
    );

    // Map to a new value without triggering change
    const mapped = mutUntyped.mapUnchanged((ptr) => {
      return ptr as Mut<number>;
    });

    expect(mapped.isChanged()).toBe(false);

    // Modify the value which should trigger change
    mapped.value = 10;

    expect(mapped.isChanged()).toBe(true);
  });
});
