import { Mut } from 'rustable';
import { World } from '../world/base';
import { FilteredAccess } from './access';
import { QueryData } from './fetch';
import { QueryFilter } from './filter/base';

/**
 * A builder for constructing queries.
 */
export class QueryBuilder {
  constructor(
    public access: FilteredAccess,
    public world: World,
    public or: boolean = false,
    public first: boolean = true,
  ) {}

  static new(data: QueryData, filter: QueryFilter, world: World) {
    const fetchState = data.initState(world);
    const filterState = filter.initState(world);

    let access = new FilteredAccess();
    const mutAccess = Mut.of({
      get: () => access,
      set: (a) => (access = a),
    });
    data.updateComponentAccess(fetchState, mutAccess);

    let filterAccess = new FilteredAccess();
    const mutFilterAccess = Mut.of({
      get: () => filterAccess,
      set: (a) => (filterAccess = a),
    });

    filter.updateComponentAccess(filterState, mutFilterAccess);

    access.extend(filterAccess);

    return new QueryBuilder(access, world);
  }
}
