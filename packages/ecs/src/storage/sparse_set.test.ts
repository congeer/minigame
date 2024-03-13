import {component, ComponentDescriptor, ComponentInfo} from "../component";
import {Entity} from "../entity";
import {typeId} from "../inherit";
import {SparseSet, SparseSets} from "./sparse_set";


test("sparse_set", () => {
    class Foo {
        value: number = 0;

        constructor(value: number) {
            this.value = value;
        }
    }

    const set = new SparseSet<Entity, Foo>();

    const e0 = Entity.fromRaw(0);
    const e1 = Entity.fromRaw(1);
    const e2 = Entity.fromRaw(2);
    const e3 = Entity.fromRaw(3);
    const e4 = Entity.fromRaw(4);

    set.insert(e1, new Foo(1));
    set.insert(e2, new Foo(2));
    set.insert(e3, new Foo(3));

    expect(set.get(e0)).toEqual(undefined);
    expect(set.get(e1)).toEqual(new Foo(1));
    expect(set.get(e2)).toEqual(new Foo(2));
    expect(set.get(e3)).toEqual(new Foo(3));
    expect(set.get(e4)).toEqual(undefined);

    {
        let iterResult = set.values();
        expect(iterResult).toEqual([new Foo(1), new Foo(2), new Foo(3)])
    }

    expect(set.remove(e2)).toEqual(new Foo(2));
    expect(set.remove(e2)).toEqual(undefined);

    expect(set.get(e0)).toEqual(undefined);
    expect(set.get(e1)).toEqual(new Foo(1));
    expect(set.get(e2)).toEqual(undefined);
    expect(set.get(e3)).toEqual(new Foo(3));
    expect(set.get(e4)).toEqual(undefined);

    expect(set.remove(e1)).toEqual(new Foo(1));

    expect(set.get(e0)).toEqual(undefined);
    expect(set.get(e1)).toEqual(undefined);
    expect(set.get(e2)).toEqual(undefined);
    expect(set.get(e3)).toEqual(new Foo(3));
    expect(set.get(e4)).toEqual(undefined);

    set.insert(e1, new Foo(10));

    expect(set.get(e1)).toEqual(new Foo(10));

    set.set(e1, new Foo(11));
    expect(set.get(e1)).toEqual(new Foo(11));
});


test("sparse_sets", () => {
    const sets = new SparseSets();

    @component
    class TestComponent1 {
    }

    @component
    class TestComponent2 {
    }

    expect(sets.len()).toEqual(0);
    expect(sets.isEmpty()).toEqual(true);

    function initComponent<T>(component: new() => T, sets: SparseSets, id: number) {
        const descriptor = ComponentDescriptor.new(typeId(component));
        const info = new ComponentInfo(id, descriptor);
        sets.getOrInsert(info);
    }

    initComponent(TestComponent1, sets, 1);
    expect(sets.len()).toEqual(1);

    initComponent(TestComponent2, sets, 2);
    expect(sets.len()).toEqual(2);

    const collectedSets = sets.iter().map(([id, set]) => [id, set.len()]);
    collectedSets.sort();
    expect(collectedSets).toEqual([[1, 0], [2, 0]]);
})
