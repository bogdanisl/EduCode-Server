import { BaseSchema } from '@adonisjs/lucid/schema'

export default class AlterTasksContent extends BaseSchema {
  public async up() {
    this.schema.alterTable('tasks', (table) => {
      table.specificType('description', 'MEDIUMTEXT').alter()
    })
  }

  public async down() {
    this.schema.alterTable('tasks', (table) => {
      table.text('description').alter()
      table.text('start_code').alter()
      table.text('correct_output').alter()
    })
  }
}
