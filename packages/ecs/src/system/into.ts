import { hasTrait, trait } from 'rustable';
import { System } from './base';
import { TraitValid } from '@minigame/utils';

@trait
export class IntoSystem<In = any, Out = any> extends TraitValid {
  intoSystem(): System<In, Out> {
    throw new Error('Method not implemented.');
  }

  static is(obj: any): boolean {
    return hasTrait(obj, IntoSystem);
  }
}
