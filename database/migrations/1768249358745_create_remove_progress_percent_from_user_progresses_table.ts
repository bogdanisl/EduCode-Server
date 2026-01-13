import { BaseSchema } from '@adonisjs/lucid/schema'

export default class RemoveProgressPercentFromUserProgress extends BaseSchema {
  protected tableName = 'user_progress'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('progress_percent')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('progress_percent')
        .unsigned()
        .notNullable()
        .defaultTo(0)
    })
  }
}
