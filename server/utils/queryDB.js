import mysql from 'mysql2/promise'
import 'dotenv/config'

export default async function queryDB(query) {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'test'
    })
    try {
        const [rows, fields] = await connection.query(query)

        await connection.end()
        return rows
    } catch (e) {
        console.log(e)
        await connection.end()
        return { error: e.code }
    }
}