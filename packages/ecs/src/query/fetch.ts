import { trait } from 'rustable';
import { WorldQuery } from './world_query';

@trait
export class QueryData<Item = any, Fetch = any, State = any> extends WorldQuery<Item, Fetch, State> {}

@trait
export class ReadOnlyQueryData<Item = any, Fetch = any, State = any> extends QueryData<Item, Fetch, State> {}
