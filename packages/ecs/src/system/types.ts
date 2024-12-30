import { Tick } from '../change_detection/tick';
import { Access } from '../query/access';

/**
 * The warning policy for system parameters
 */
export enum ParamWarnPolicy {
  /** No warning should ever be emitted */
  Never,
  /** The warning will be emitted once and status will update to Never */
  Once,
}

/**
 * The metadata of a System
 */
export class SystemMeta {
  name: string;
  componentAccessSet: Access;
  archetypeComponentAccess: Access;
  hasDeferred: boolean;
  lastRun: Tick;
  paramWarnPolicy: ParamWarnPolicy;

  constructor() {
    this.name = '';
    this.componentAccessSet = new Access();
    this.archetypeComponentAccess = new Access();
    this.hasDeferred = false;
    this.lastRun = new Tick(0);
    this.paramWarnPolicy = ParamWarnPolicy.Once;
  }

  static new(name: string): SystemMeta {
    const meta = new SystemMeta();
    meta.name = name;
    return meta;
  }

  setParamWarnPolicy(warnPolicy: ParamWarnPolicy): void {
    this.paramWarnPolicy = warnPolicy;
  }

  advanceParamWarnPolicy(): void {
    this.paramWarnPolicy = ParamWarnPolicy.Never;
  }

  tryWarnParam(name: string, paramName: string): void {
    if (this.paramWarnPolicy === ParamWarnPolicy.Never) {
      return;
    }
    console.warn(`${name} did not run because it requested inaccessible system parameter ${paramName}`);
  }
}
