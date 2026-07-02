import { Table } from 'typeorm';
import { snakeCase } from 'typeorm/util/StringUtils';
import { SnakeNamingStrategy } from '@database/strategies/snake-naming.strategy';

describe('SnakeNamingStrategy', () => {
  const strategy = new SnakeNamingStrategy();

  describe('tableName', () => {
    it('should snake_case the class name when no custom name is given', () => {
      expect(strategy.tableName('UserProfile', undefined)).toBe(
        snakeCase('UserProfile'),
      );
    });

    it('should use the user-specified name verbatim', () => {
      expect(strategy.tableName('UserProfile', 'custom_table')).toBe(
        'custom_table',
      );
    });
  });

  describe('columnName', () => {
    it('should snake_case the property name when no custom name/prefix is given', () => {
      expect(strategy.columnName('firstName', undefined, [])).toBe(
        snakeCase('firstName'),
      );
    });

    it('should use the custom column name when provided', () => {
      expect(
        strategy.columnName('firstName', 'first_name_custom', []),
      ).toBe('first_name_custom');
    });

    it('should prefix embedded property names', () => {
      expect(strategy.columnName('street', undefined, ['address'])).toBe(
        snakeCase('address') + snakeCase('street'),
      );
    });
  });

  describe('relationName', () => {
    it('should snake_case the property name', () => {
      expect(strategy.relationName('userProfile')).toBe(
        snakeCase('userProfile'),
      );
    });
  });

  describe('joinColumnName', () => {
    it('should combine the relation and referenced column names', () => {
      expect(strategy.joinColumnName('user', 'id')).toBe(
        snakeCase('user_id'),
      );
    });
  });

  describe('joinTableName', () => {
    it('should combine both table names', () => {
      expect(
        strategy.joinTableName('users', 'roles', 'userRoles', 'roleUsers'),
      ).toBe(snakeCase('users_roles'));
    });
  });

  describe('joinTableColumnName', () => {
    it('should use the explicit column name when given', () => {
      expect(
        strategy.joinTableColumnName('users', 'id', 'user_id'),
      ).toBe(snakeCase('users_user_id'));
    });

    it('should fall back to the property name when no column name is given', () => {
      expect(strategy.joinTableColumnName('users', 'id')).toBe(
        snakeCase('users_id'),
      );
    });
  });

  describe('classTableInheritanceParentColumnName', () => {
    it('should combine the parent table and id property names', () => {
      expect(
        strategy.classTableInheritanceParentColumnName('person', 'id'),
      ).toBe(snakeCase('person_id'));
    });
  });

  describe('primaryKeyName', () => {
    it('should build PK_{table} from a string table name', () => {
      expect(strategy.primaryKeyName('users', ['id'])).toBe('PK_users');
    });

    it('should build PK_{table} from a Table object', () => {
      const table = { name: 'users' } as unknown as Table;
      expect(strategy.primaryKeyName(table, ['id'])).toBe('PK_users');
    });
  });

  describe('uniqueConstraintName', () => {
    it('should build UQ_{table}_{columns}', () => {
      expect(strategy.uniqueConstraintName('users', ['email'])).toBe(
        'UQ_users_email',
      );
    });
  });

  describe('indexName', () => {
    it('should build IDX_{table}_{columns}', () => {
      expect(
        strategy.indexName('users', ['email', 'tenant_id']),
      ).toBe('IDX_users_email_tenant_id');
    });
  });

  describe('foreignKeyName', () => {
    it('should build FK_{table}_{columns}', () => {
      expect(
        strategy.foreignKeyName('reservations', ['restaurant_id']),
      ).toBe('FK_reservations_restaurant_id');
    });
  });
});
