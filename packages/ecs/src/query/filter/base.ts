import { trait } from 'rustable';
import { Entity } from '../../entity';
import { TableRow } from '../../storage/table/types';
import { WorldQuery } from '../world_query';

/**
 * A query filter that can be applied to query results.
 */
@trait
export class QueryFilter<Item = any, Fetch = any, State = any> extends WorldQuery<Item, Fetch, State> {
  isArchetypal() {
    return true;
  }
  /**
   * Filters the fetch results.
   * @param fetch The fetch object.
   * @param entity The entity to filter.
   * @param tableRow The table row of the entity.
   * @returns A boolean indicating whether the entity passes the filter.
   */
  filterFetch(_fetch: Fetch, _entity: Entity, _tableRow: TableRow): boolean {
    throw new Error('Not implemented');
  }
}
