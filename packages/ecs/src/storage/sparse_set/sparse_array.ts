import { Mut, None, Option, Some, Vec } from 'rustable';

export class ImmutableSparseArray<I extends number, V> {
  private readonly __values: Vec<Option<V>>;

  constructor(values: Vec<Option<V>>) {
    this.__values = values;
  }

  contains(index: I): boolean {
    return this.__values
      .get(index)
      .map((v) => v.isSome())
      .unwrapOr(false);
  }

  get(index: I): Option<V> {
    return this.__values.get(index).unwrapOr(None);
  }
}

export class SparseArray<I extends number, V> {
  private __values: Vec<Option<V>> = Vec.new();

  contains(index: I): boolean {
    return this.__values
      .get(index)
      .map((v) => v.isSome())
      .unwrapOr(false);
  }

  get(index: I): Option<V> {
    return this.__values.get(index).unwrapOr(None);
  }

  getMut(index: I): Option<Mut<V>> {
    return this.__values.getMut(index).map((mut) =>
      Mut.of({
        get: () => mut[Mut.ptr].unwrap(),
        set: (value) => (mut[Mut.ptr] = Some(value)),
      }),
    );
  }

  insert(index: I, value: V) {
    this.__values.resize(index + 1, None);
    this.__values.insert(index, Some(value));
  }

  remove(index: I): Option<V> {
    return this.__values.getMut(index).andThen((mut) => {
      const value = mut[Mut.ptr];
      if (mut.isSome()) {
        mut[Mut.ptr] = None;
      }
      return value;
    });
  }

  clear() {
    this.__values.clear();
  }

  intoImmutable(): ImmutableSparseArray<I, V> {
    return new ImmutableSparseArray(this.__values);
  }
}
