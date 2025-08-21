const mysql = require('mysql2/promise')

// Configuração da conexão com o banco de dados
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'bcd127',
  database: 'clientes'
}
// Pool de conexões para melhor performance
const pool = mysql.createPool(dbConfig)

// Função para inicializar o banco de dados
async function initializeDatabase() {
  try {
    // Conecta ao MySQL sem especificar database para criar se não existir
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    })

    // Cria o banco de dados se não existir
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`)
    
    // Fecha a conexão inicial
    await connection.end()
    
    // Conecta novamente especificando o database
    const dbConnection = await mysql.createConnection(dbConfig)
    
    // Cria a tabela de clientes se não existir
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS clientes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        telefone VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    console.log('Banco de dados inicializado com sucesso!')
    await dbConnection.end()
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error)
    throw error
  }
}

module.exports = { pool, initializeDatabase }

