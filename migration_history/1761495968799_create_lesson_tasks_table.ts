import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'lesson_tasks'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('lesson_id')
        .unsigned()
        .references('id')
        .inTable('lessons')
        .onDelete('CASCADE')

      table
        .integer('task_id')
        .unsigned()
        .references('id')
        .inTable('tasks')
        .onDelete('CASCADE')

      table.integer('order').defaultTo(0)

      table.timestamps(true)

      // уникальність комбінації уроку й завдання
      table.unique(['lesson_id', 'task_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
