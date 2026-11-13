import pg from 'pg';

const { Pool } = pg;

// Configuração das credenciais de acesso ao PostgreSQL local
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'meu_banco_db',
    password: 'amods',
    port: 7777,
});

export default pool;