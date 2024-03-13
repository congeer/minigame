import {Entities, Entity} from './entity';


test('entity_bits_round_trip', () => {
    const e = Entity.fromRawAndGeneration(0xDEADBEEF, 0x5AADF00D);
    expect(Entity.fromBits(e.toBits())).toEqual(e);
})

test('reserve_entity_len', () => {
    const e = new Entities();
    e.reserveEntity();
    e.flush(() => {
    })
    expect(e.len()).toBe(1);
})


test('get_reserved_and_invalid', () => {
    const entities = new Entities();
    const e = entities.reserveEntity();
    expect(entities.contains(e)).toBe(true);
    expect(entities.get(e)).toBe(undefined);
    entities.flush(() => {
    })
    expect(entities.contains(e)).toBe(true);
    expect(entities.get(e)).toBe(undefined);
})

test('entity_const', () => {
    const c1 = Entity.fromRaw(42);
    expect(42).toEqual(c1.index);
    expect(1).toEqual(c1.generation);
})

test('reserve_generations', () => {
    const entities = new Entities();
    const entity = entities.alloc();
    entities.free(entity);
    expect(entities.reserveGenerations(entity.index, 1)).toBe(true)
})

test('reserve_generations_and_alloc', () => {
    const GENERATIONS = 10;
    const entities = new Entities();
    const entity = entities.alloc();
    entities.free(entity);
    expect(entities.reserveGenerations(entity.index, GENERATIONS)).toBe(true);

    const nextEntity = entities.alloc();
    expect(nextEntity.index).toEqual(entity.index);
    expect(nextEntity.generation > entity.generation + GENERATIONS).toBe(true);
})

test('entity_comparison', () => {
    expect(Entity.fromRawAndGeneration(123, 456).toBits()).toEqual(Entity.fromRawAndGeneration(123, 456).toBits());
    expect(Entity.fromRawAndGeneration(123, 789).toBits()).not.toEqual(Entity.fromRawAndGeneration(123, 456).toBits());
    expect(Entity.fromRawAndGeneration(123, 456).toBits()).not.toEqual(Entity.fromRawAndGeneration(123, 789).toBits());
    expect(Entity.fromRawAndGeneration(123, 456).toBits()).not.toEqual(Entity.fromRawAndGeneration(456, 123).toBits());

    expect(Entity.fromRawAndGeneration(123, 456).toBits() >= Entity.fromRawAndGeneration(123, 456).toBits()).toBe(true);
    expect(Entity.fromRawAndGeneration(123, 456).toBits() <= Entity.fromRawAndGeneration(123, 456).toBits()).toBe(true);
    expect(!(Entity.fromRawAndGeneration(123, 456).toBits() > Entity.fromRawAndGeneration(123, 456).toBits())).toBe(true);
    expect(!(Entity.fromRawAndGeneration(123, 456).toBits() < Entity.fromRawAndGeneration(123, 456).toBits())).toBe(true);

    expect(Entity.fromRawAndGeneration(9, 1).toBits() < Entity.fromRawAndGeneration(1, 9).toBits()).toBe(true);
    expect(Entity.fromRawAndGeneration(1, 9).toBits() > Entity.fromRawAndGeneration(9, 1).toBits()).toBe(true);

    expect(Entity.fromRawAndGeneration(1, 1).toBits() < Entity.fromRawAndGeneration(2, 1).toBits()).toBe(true);
    expect(Entity.fromRawAndGeneration(1, 1).toBits() <= Entity.fromRawAndGeneration(2, 1).toBits()).toBe(true);
    expect(Entity.fromRawAndGeneration(2, 2).toBits() > Entity.fromRawAndGeneration(1, 2).toBits()).toBe(true);
    expect(Entity.fromRawAndGeneration(2, 2).toBits() >= Entity.fromRawAndGeneration(1, 2).toBits()).toBe(true);
})
