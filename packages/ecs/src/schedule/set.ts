import { TraitValid } from '@minigame/utils';
import { Eq, implTrait, None, Option, Some, trait, typeId, TypeId } from 'rustable';

@trait
export class ScheduleLabel {}

@trait
export class SystemSet {
  systemType(): Option<TypeId> {
    return None;
  }

  isAnonymous(): boolean {
    return false;
  }
}

export class SystemTypeSet {
  constructor(public data: any) {}
}

implTrait(SystemTypeSet, Eq, {
  eq(this: SystemTypeSet, _other: SystemTypeSet): boolean {
    return true;
  },
});

export interface SystemTypeSet extends SystemSet {}

implTrait(SystemTypeSet, SystemSet, {
  systemType(): Option<TypeId> {
    return Some(typeId(this.data));
  },
});

export class AnonymousSet {
  constructor(public id: number) {}
}

export interface AnonymousSet extends SystemSet {}

implTrait(AnonymousSet, SystemSet, {
  isAnonymous(): boolean {
    return true;
  },
});

@trait
export class IntoSystemSet extends TraitValid {
  intoSystemSet(): SystemSet {
    throw new Error('Method not implemented.');
  }
}

export interface SystemSet extends IntoSystemSet {}

implTrait(SystemSet, IntoSystemSet, {
  intoSystemSet(this: SystemSet): SystemSet {
    return this;
  },
});
