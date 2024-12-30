import { derive } from 'rustable';
import { ComponentId } from '../component/types';
import { Component } from '../component/base';

export const ON_ADD: ComponentId = 0;
export const ON_INSERT: ComponentId = 1;
export const ON_REPLACE: ComponentId = 2;
export const ON_REMOVE: ComponentId = 3;

@derive([Component])
export class OnAdd {}

@derive([Component])
export class OnInsert {}

@derive([Component])
export class OnReplace {}

@derive([Component])
export class OnRemove {}
