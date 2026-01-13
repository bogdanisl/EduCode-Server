import { BaseSchema } from '@adonisjs/lucid/schema'

export default class AddTotalLessonsCountToCourses extends BaseSchema {
  protected tableName = 'courses'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('total_lessons_count')
        .unsigned()
        .notNullable()
        .defaultTo(0)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('total_lessons_count')
    })
  }
}
