import type Database from 'better-sqlite3'

import tables, { DB_VERSION } from './tables'

const setDbVersion = (db: Database.Database, value: string) => {
  db.prepare('UPDATE "main"."metadata" SET "field_value"=@value WHERE "field_name"=@name').run({
    name: 'db_version',
    value,
  })
}

const migrateV1 = (db: Database.Database) => {
  const sql = `
    BEGIN TRANSACTION;
    -- 1. rename old table
    ALTER TABLE play_list_music_info RENAME TO play_list_music_info_old;

    -- 2. create new table
    ${tables.get('play_list_music_info')}

    -- 3. data migration
    INSERT INTO play_list_music_info (item_id, position, played, play_later, id, list_id, name, singer, interval, is_local, meta, source)
    SELECT item_id, position, played, play_later, id, list_id, name, singer, interval, is_local, meta, 0 AS source
    FROM play_list_music_info_old;

    -- 4. drop old table
    DROP TABLE play_list_music_info_old;
    COMMIT;
  `
  db.exec(sql)
  setDbVersion(db, '2')
}

// v2 -> v3: 新增收藏的专辑/歌单表
const migrateV2 = (db: Database.Database) => {
  db.exec(tables.get('my_collected_list')!)
  setDbVersion(db, '3')
}

export default (db: Database.Database) => {
  // PRAGMA user_version = x
  // console.log(db.prepare('PRAGMA user_version').get().user_version)
  // https://github.com/WiseLibs/better-sqlite3/issues/668#issuecomment-1145285728
  const dbVersion = (
    db.prepare<[string]>('SELECT "field_value" FROM "main"."metadata" WHERE "field_name" = ?').get('db_version') as {
      field_value: string
    }
  ).field_value
  // 逐级迁移(无 break,顺序向上累积),最终落到 DB_VERSION=${DB_VERSION}
  switch (dbVersion) {
    case '1':
      migrateV1(db)
    // eslint-disable-next-line no-fallthrough
    case '2':
      migrateV2(db)
    // eslint-disable-next-line no-fallthrough
    default:
      break
  }
}
