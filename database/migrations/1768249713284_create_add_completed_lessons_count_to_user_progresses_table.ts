import { BaseSchema } from '@adonisjs/lucid/schema'

export default class AddCompletedLessonsCountToUserProgress extends BaseSchema {
  protected tableName = 'user_progresses'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('completed_lessons_count')
        .unsigned()
        .notNullable()
        .defaultTo(0)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('completed_lessons_count')
    })
  }
}
