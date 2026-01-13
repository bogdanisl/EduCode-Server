import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('full_name').notNullable().unique()
      table.string('email').notNullable().unique()
      table.string('password').notNullable()

      table
        .enum('role', ['admin', 'user', 'pro', 'tester'])
        .notNullable()
        .defaultTo('user')

      table.integer('lives').defaultTo(10)
      table.timestamp('lives_reset_at').nullable()

      table.boolean('is_active').defaultTo(true)

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
