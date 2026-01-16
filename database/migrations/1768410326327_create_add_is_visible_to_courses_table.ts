import { BaseSchema } from '@adonisjs/lucid/schema'

export default class AddIsVisibleToCourses extends BaseSchema {
  protected tableName = 'courses'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('is_visible').notNullable().defaultTo(false)
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('is_visible')
    })
  }
}
