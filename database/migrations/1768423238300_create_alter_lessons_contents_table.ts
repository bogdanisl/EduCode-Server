import { BaseSchema } from '@adonisjs/lucid/schema'

export default class AlterLessonsContent extends BaseSchema {
  public async up() {
    this.schema.alterTable('lessons', (table) => {
      table.specificType('description', 'MEDIUMTEXT').alter()    })
  }

  public async down() {
    this.schema.alterTable('lessons', (table) => {
      table.text('description').alter()
      table.text('content').alter()
    })
  }
}
