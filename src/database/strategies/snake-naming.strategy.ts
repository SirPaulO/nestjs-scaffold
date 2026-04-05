import { DefaultNamingStrategy, NamingStrategyInterface, Table } from 'typeorm';
import { snakeCase } from 'typeorm/util/StringUtils';

/**
 * Custom naming strategy to convert all database names to snake_case
 * Ensures consistent database naming convention across the application
 */
export class SnakeNamingStrategy
  extends DefaultNamingStrategy
  implements NamingStrategyInterface
{
  /**
   * Converts table name to snake_case
   * @param targetName - The class name
   * @param userSpecifiedName - Optional user-specified table name
   * @returns The snake_case table name
   */
  tableName(targetName: string, userSpecifiedName: string | undefined): string {
    return userSpecifiedName ?? snakeCase(targetName);
  }

  /**
   * Converts column name to snake_case
   * @param propertyName - The property name
   * @param customName - Optional custom column name
   * @param embeddedPrefixes - Embedded prefixes
   * @returns The snake_case column name
   */
  columnName(
    propertyName: string,
    customName: string | undefined,
    embeddedPrefixes: string[],
  ): string {
    return (
      snakeCase(embeddedPrefixes.join('_')) +
      (customName ?? snakeCase(propertyName))
    );
  }

  /**
   * Converts relation name to snake_case
   * @param propertyName - The property name
   * @returns The snake_case relation name
   */
  relationName(propertyName: string): string {
    return snakeCase(propertyName);
  }

  /**
   * Converts join column name to snake_case
   * @param relationName - The relation name
   * @param referencedColumnName - The referenced column name
   * @returns The snake_case join column name
   */
  joinColumnName(relationName: string, referencedColumnName: string): string {
    return snakeCase(relationName + '_' + referencedColumnName);
  }

  /**
   * Converts join table name to snake_case
   * @param firstTableName - The first table name
   * @param secondTableName - The second table name
   * @param _firstPropertyName - The first property name (unused)
   * @param _secondPropertyName - The second property name (unused)
   * @returns The snake_case join table name
   */
  joinTableName(
    firstTableName: string,
    secondTableName: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _firstPropertyName: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _secondPropertyName: string,
  ): string {
    return snakeCase(firstTableName + '_' + secondTableName);
  }

  /**
   * Converts join table column name to snake_case
   * @param tableName - The table name
   * @param propertyName - The property name
   * @param columnName - The column name
   * @returns The snake_case join table column name
   */
  joinTableColumnName(
    tableName: string,
    propertyName: string,
    columnName?: string,
  ): string {
    return snakeCase(tableName + '_' + (columnName ?? propertyName));
  }

  /**
   * Converts class property name to database name (snake_case)
   * @param propertyName - The property name
   * @returns The snake_case database name
   */
  classTableInheritanceParentColumnName(
    parentTableName: string,
    parentTableIdPropertyName: string,
  ): string {
    return snakeCase(parentTableName + '_' + parentTableIdPropertyName);
  }

  /**
   * Returns deterministic primary key constraint name: PK_{table}
   */
  primaryKeyName(
    tableOrName: Table | string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _columnNames: string[],
  ): string {
    const tableName =
      typeof tableOrName === 'string' ? tableOrName : tableOrName.name;
    return `PK_${tableName}`;
  }

  /**
   * Returns deterministic unique constraint name: UQ_{table}_{col1}_{col2}
   */
  uniqueConstraintName(
    tableOrName: Table | string,
    columnNames: string[],
  ): string {
    const tableName =
      typeof tableOrName === 'string' ? tableOrName : tableOrName.name;
    return `UQ_${tableName}_${columnNames.join('_')}`;
  }

  /**
   * Returns deterministic index name: IDX_{table}_{col1}_{col2}
   */
  indexName(
    tableOrName: Table | string,
    columnNames: string[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _where?: string,
  ): string {
    const tableName =
      typeof tableOrName === 'string' ? tableOrName : tableOrName.name;
    return `IDX_${tableName}_${columnNames.join('_')}`;
  }

  /**
   * Returns deterministic foreign key name: FK_{table}_{col1}
   */
  foreignKeyName(
    tableOrName: Table | string,
    columnNames: string[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _referencedTablePath?: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _referencedColumnNames?: string[],
  ): string {
    const tableName =
      typeof tableOrName === 'string' ? tableOrName : tableOrName.name;
    return `FK_${tableName}_${columnNames.join('_')}`;
  }
}
