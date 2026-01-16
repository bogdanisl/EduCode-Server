import { BaseSchema } from '@adonisjs/lucid/schema'

export default class AlterCoursesContent extends BaseSchema {
  public async up() {
    this.schema.alterTable('courses', (table) => {
      table.specificType('description', 'MEDIUMTEXT').alter()
    })
  }

  public async down() {
    this.schema.alterTable('courses', (table) => {
      table.text('description').alter()
    })
  }
}
