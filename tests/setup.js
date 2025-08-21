const { pool } = require('../database')

// Configuração global para todos os testes
beforeAll(async () => {
  // Aguardar um pouco para garantir que o banco esteja pronto
  await new Promise(resolve => setTimeout(resolve, 1000))
})

// Limpeza após todos os testes
afterAll(async () => {
  try {
    // Limpar tabela de testes
    await pool.execute('DELETE FROM clientes WHERE email LIKE "%test%"')
    
    // Fechar pool de conexões
    await pool.end()
  } catch (error) {
    console.error('Erro na limpeza dos testes:', error)
  }
})

// Limpeza antes de cada teste
beforeEach(async () => {
  try {
    // Limpar dados de teste antes de cada teste
    await pool.execute('DELETE FROM clientes WHERE email LIKE "%test%"')
  } catch (error) {
    console.error('Erro na limpeza antes do teste:', error)
  }
})

