import { INVALID_VALUE } from '@minigame/utils';
import { TableId, TableRow } from '../storage/table/types';
import { ArchetypeId, ArchetypeRow } from '../archetype/types';

export class EntityLocation {
  static INVALID = new EntityLocation(INVALID_VALUE, INVALID_VALUE, INVALID_VALUE, INVALID_VALUE);
  archetypeId: ArchetypeId;
  archetypeRow: ArchetypeRow;
  tableId: TableId;
  tableRow: TableRow;

  constructor(archetypeId: ArchetypeId, archetypeRow: ArchetypeRow, tableId: TableId, tableRow: TableRow) {
    this.archetypeId = archetypeId;
    this.archetypeRow = archetypeRow;
    this.tableId = tableId;
    this.tableRow = tableRow;
  }
}
