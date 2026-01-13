// database/migrations/1734025678901_add_coding_fields_to_tasks.ts

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tasks'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .string('language',191)
        .notNullable()
        .defaultTo('typescript')
        .after('type')

      table
        .text('correct_output')
        .nullable()
        .after('language')

      table
        .text('start_code')
        .nullable()
        .after('correct_output')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumns('language', 'correct_output', 'start_code')
    })
  }
}