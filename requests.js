import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

export async function get_user_by_username(username) {
  const body = {
    "usernames": [
      username
    ],
    "excludeBannedUsers": false
  }

  const response = await fetch(`https://users.roblox.com/v1/usernames/users`, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  })
  const json = await response.json()
  return json;
}

export async function get_user_by_id(id) {
  const response = await fetch(`https://users.roblox.com/v1/users/${id}`)
  const json = await response.json()
  return json;
}

export async function get_data(column, table, key) {
  const validTables = ['reprimands',];
  const validColumns = ['created_at', 'discord', 'warnings', 'strikes', 'suspensions', 'demotions', 'removals', 'roblox', '*'];

  if (!validTables.includes(table)) {
      throw new Error(`Invalid table name: ${table}`);
  }
  if (!validColumns.includes(column)) {
      throw new Error(`Invalid column name: ${column}`);
  }

  if (!Array.isArray(key) || key.length !== 2) {
      throw new TypeError('Expected "key" to be an array with 2 elements');
  }

  const db = await open({
    filename: 'intelligence.db',
    driver: sqlite3.Database
  });

  const query = `
    SELECT ${column || '*'} 
    FROM ${table}
    WHERE ${key[0]} = ?
    `;

  const result = await db.get(query, [key[1],])
  return result;
}

export async function get_all_data(column, table, key) {
  const validTables = ['reprimands',];
  const validColumns = ['created_at', 'discord', 'warnings', 'strikes', 'suspensions', 'demotions', 'removals', '*'];

  if (!validTables.includes(table)) {
      throw new Error(`Invalid table name: ${table}`);
  }
  if (!validColumns.includes(column)) {
      throw new Error(`Invalid column name: ${column}`);
  }

  const db = await open({
    filename: 'intelligence.db',
    driver: sqlite3.Database
  });

  const query = `
    SELECT ${column || '*'} 
    FROM ${table}
    `;

  const result = await db.get(query, [key])
  return result;
}


export async function insert_data(columns, table, values) {
  if (typeof columns !== 'string') {
    throw new TypeError('Expected "column" to be a string');
  }
  if (typeof table !== 'string') {
    throw new TypeError('Expected "table" to be a string');
  }
  if (!Array.isArray(values)) {
    throw new TypeError('Expected "key" to be an array');
  }

  const db = await open({
    filename: 'intelligence.db',
    driver: sqlite3.Database
  });

  const placeholders = values.map(() => '?').join(', ');
  const query = `
    INSERT INTO ${table} (${columns})
    VALUES (${placeholders});
    `;
  await db.run(query, values);
}

export async function edit_data(columns, table, values) {
  if (!Array.isArray(columns)) {
    throw new TypeError('Expected "key" to be an array');
  }
  if (typeof table !== 'string') {
    throw new TypeError('Expected "table" to be a string');
  }
  if (!Array.isArray(values)) {
    throw new TypeError('Expected "key" to be an array');
  }

  const db = await open({
    filename: 'intelligence.db',
    driver: sqlite3.Database
  });

  const query = `
    UPDATE ${table}
    SET ${columns[0]} = ?
    WHERE ${columns[1]} = ?
  `;

  const result = db.run(query, values);
  return result
}

export function getSQLDateTime() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
