import { BaseModel, column } from "@adonisjs/lucid/orm"
import { DateTime } from "luxon"

export default class Article extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare title: string

    @column()
    declare subtitle: string | null

    @column()
    declare content: string

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime
}
