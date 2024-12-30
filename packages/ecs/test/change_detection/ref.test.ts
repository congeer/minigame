import { RefValue } from '../../src/change_detection/ref';
import { Tick } from '../../src/change_detection/tick';

describe('Ref', () => {
  let value: number;
  let added: Tick;
  let lastChanged: Tick;
  let lastRun: Tick;
  let thisRun: Tick;
  let ref: RefValue<number>;

  beforeEach(() => {
    value = 42;
    added = new Tick(1);
    lastChanged = new Tick(2);
    lastRun = new Tick(1);
    thisRun = new Tick(3);
    ref = RefValue.new(value, added, lastChanged, lastRun, thisRun);
  });

  test('value returns the wrapped value', () => {
    expect(ref.value).toBe(42);
  });

  test('map transforms value while preserving ticks', () => {
    const mappedRef = ref.map((x) => x * 2);

    expect(mappedRef.value).toBe(84);
    expect(mappedRef.isAdded()).toBe(ref.isAdded());
    expect(mappedRef.isChanged()).toBe(ref.isChanged());
    expect(mappedRef.lastChanged().get()).toBe(ref.lastChanged().get());
  });

  test('isAdded returns true for newly added components', () => {
    const newRef = RefValue.new(
      value,
      new Tick(2), // added after lastRun
      lastChanged,
      lastRun,
      thisRun,
    );
    expect(newRef.isAdded()).toBe(true);
  });

  test('isAdded returns false for old components', () => {
    const oldRef = RefValue.new(
      value,
      new Tick(1), // added before lastRun
      lastChanged,
      lastRun,
      thisRun,
    );
    expect(oldRef.isAdded()).toBe(false);
  });

  test('isChanged returns true for recently changed components', () => {
    const changedRef = RefValue.new(
      value,
      added,
      new Tick(2), // changed after lastRun
      lastRun,
      thisRun,
    );
    expect(changedRef.isChanged()).toBe(true);
  });

  test('isChanged returns false for unchanged components', () => {
    const unchangedRef = RefValue.new(
      value,
      added,
      new Tick(1), // changed before lastRun
      lastRun,
      thisRun,
    );
    expect(unchangedRef.isChanged()).toBe(false);
  });

  test('lastChanged returns the last change tick', () => {
    expect(ref.lastChanged().get()).toBe(lastChanged.get());
  });

  test('map with complex object', () => {
    interface Person {
      name: string;
      age: number;
    }

    const person: Person = { name: 'Alice', age: 30 };
    const personRef = RefValue.new(person, added, lastChanged, lastRun, thisRun);

    const nameRef = personRef.map((p) => p.name);
    expect(nameRef.value).toBe('Alice');

    const ageRef = personRef.map((p) => p.age);
    expect(ageRef.value).toBe(30);
  });
});
