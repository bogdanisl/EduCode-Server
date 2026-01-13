import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tasks'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('lesson_id').unsigned().references('id').inTable('lessons').onDelete('CASCADE')
      table.string('title',191).notNullable()
      table.text('description').notNullable()
      table.string('type',191).notNullable() // quiz, code, text
      table.integer('order').defaultTo(0)
      table.timestamps(true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
