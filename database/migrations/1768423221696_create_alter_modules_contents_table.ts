import { BaseSchema } from '@adonisjs/lucid/schema'

export default class AlterModulesContent extends BaseSchema {
  public async up() {
    this.schema.alterTable('modules', (table) => {
      table.specificType('description', 'MEDIUMTEXT').alter()
    })
  }

  public async down() {
    this.schema.alterTable('modules', (table) => {
      table.text('description').alter()
    })
  }
}
