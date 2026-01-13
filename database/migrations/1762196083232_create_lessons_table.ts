// database/migrations/xxx_create_lessons_table.ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'lessons'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('module_id').unsigned().references('id').inTable('modules').onDelete('CASCADE')
      table.string('title',191).notNullable()
      table.text('description').nullable()
      table.enum('difficulty_level', ['beginner', 'intermediate', 'advanced']).nullable()
      table.integer('order').defaultTo(0)
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}