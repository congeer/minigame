import { Constructor, hasTrait } from 'rustable';

export class TraitValid {
  static is<T extends Constructor<T>>(this: T, val: any): boolean {
    return hasTrait(val, this);
  }
  static validType<T extends Constructor<T>>(this: T, val: any): void {
    if (!hasTrait(val, this)) {
      throw new Error(`${val} is not a valid ${this.name} type.`);
    }
  }
  static wrap<T extends object>(this: Constructor<T>, val: any): InstanceType<Constructor<T>> {
    if (!hasTrait(val, this)) {
      throw new Error(`${val} is not a valid ${this.name} type.`);
    }
    return val as InstanceType<Constructor<T>>;
  }
}
