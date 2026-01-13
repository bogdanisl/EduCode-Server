import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'course_categories'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name',191).notNullable().unique()
      table.text('description').nullable()
      table.timestamps(true) // created_at, updated_at
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
