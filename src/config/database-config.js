
import mysql from 'mysql2/promise';
import dotenv from "dotenv";
dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database:  process.env.DB_DATABASE
};

export const connectDB = async () => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database');
        return connection;
    } catch (err) {
        console.error('Database connection failed:', err);
        throw err;
    }
};
