const express = require('express')
const { pool, initializeDatabase } = require('./database')

const app = express()
const PORT = process.env.PORT || 3000

// Middleware para parsing JSON
app.use(express.json())

// Middleware para CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
  } else {
    next()
  }
})

// Função auxiliar para validar dados do cliente
function validateClientData(data, isUpdate = false) {
  const errors = []
  
  if (!isUpdate && !data.nome) {
    errors.push('Nome é obrigatório')
  }
  
  if (!isUpdate && !data.email) {
    errors.push('Email é obrigatório')
  } else if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Email deve ter formato válido')
  }
  
  if (!isUpdate && !data.telefone) {
    errors.push('Telefone é obrigatório')
  }
  
  return errors
}

// ROTAS CRUD

// POST /clientes - Criar novo cliente
app.post('/clientes', async (req, res) => {
  try {
    const { nome, email, telefone } = req.body
    
    // Validação dos dados
    const errors = validateClientData(req.body)
    if (errors.length > 0) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: errors 
      })
    }

    // Inserir cliente no banco
    const [result] = await pool.execute(
      'INSERT INTO clientes (nome, email, telefone) VALUES (?, ?, ?)',
      [nome, email, telefone]
    )

    // Buscar o cliente criado
    const [rows] = await pool.execute(
      'SELECT * FROM clientes WHERE id = ?',
      [result.insertId]
    )

    res.status(201).json({
      message: 'Cliente criado com sucesso',
      cliente: rows[0]
    })

  } catch (error) {
    console.error('Erro ao criar cliente:', error)
    
    // Verificar se é erro de email duplicado
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        error: 'Email já está em uso' 
      })
    }
    
    res.status(500).json({ 
      error: 'Erro interno do servidor' 
    })
  }
})

// GET /clientes - Listar todos os clientes
app.get('/clientes', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM clientes ORDER BY id')
    
    res.json({
      message: 'Clientes listados com sucesso',
      clientes: rows
    })

  } catch (error) {
    console.error('Erro ao listar clientes:', error)
    res.status(500).json({ 
      error: 'Erro interno do servidor' 
    })
  }
})

// GET /clientes/:id - Buscar cliente por ID
app.get('/clientes/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    // Validar se ID é um número
    if (isNaN(id)) {
      return res.status(400).json({ 
        error: 'ID deve ser um número válido' 
      })
    }

    const [rows] = await pool.execute(
      'SELECT * FROM clientes WHERE id = ?',
      [id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ 
        error: 'Cliente não encontrado' 
      })
    }

    res.json({
      message: 'Cliente encontrado',
      cliente: rows[0]
    })

  } catch (error) {
    console.error('Erro ao buscar cliente:', error)
    res.status(500).json({ 
      error: 'Erro interno do servidor' 
    })
  }
})

// PUT /clientes/:id - Atualizar cliente
app.put('/clientes/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { nome, email, telefone } = req.body
    
    // Validar se ID é um número
    if (isNaN(id)) {
      return res.status(400).json({ 
        error: 'ID deve ser um número válido' 
      })
    }

    // Verificar se cliente existe
    const [existingClient] = await pool.execute(
      'SELECT * FROM clientes WHERE id = ?',
      [id]
    )

    if (existingClient.length === 0) {
      return res.status(404).json({ 
        error: 'Cliente não encontrado' 
      })
    }

    // Validação dos dados (permitindo campos opcionais)
    const errors = validateClientData(req.body, true)
    if (errors.length > 0) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: errors 
      })
    }

    // Preparar campos para atualização
    const updates = []
    const values = []
    
    if (nome !== undefined) {
      updates.push('nome = ?')
      values.push(nome)
    }
    if (email !== undefined) {
      updates.push('email = ?')
      values.push(email)
    }
    if (telefone !== undefined) {
      updates.push('telefone = ?')
      values.push(telefone)
    }

    if (updates.length === 0) {
      return res.status(400).json({ 
        error: 'Nenhum campo para atualizar foi fornecido' 
      })
    }

    values.push(id)

    // Atualizar cliente
    await pool.execute(
      `UPDATE clientes SET ${updates.join(', ')} WHERE id = ?`,
      values
    )

    // Buscar cliente atualizado
    const [updatedClient] = await pool.execute(
      'SELECT * FROM clientes WHERE id = ?',
      [id]
    )

    res.json({
      message: 'Cliente atualizado com sucesso',
      cliente: updatedClient[0]
    })

  } catch (error) {
    console.error('Erro ao atualizar cliente:', error)
    
    // Verificar se é erro de email duplicado
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        error: 'Email já está em uso' 
      })
    }
    
    res.status(500).json({ 
      error: 'Erro interno do servidor' 
    })
  }
})

// DELETE /clientes/:id - Deletar cliente
app.delete('/clientes/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    // Validar se ID é um número
    if (isNaN(id)) {
      return res.status(400).json({ 
        error: 'ID deve ser um número válido' 
      })
    }

    // Verificar se cliente existe
    const [existingClient] = await pool.execute(
      'SELECT * FROM clientes WHERE id = ?',
      [id]
    )

    if (existingClient.length === 0) {
      return res.status(404).json({ 
        error: 'Cliente não encontrado' 
      })
    }

    // Deletar cliente
    await pool.execute('DELETE FROM clientes WHERE id = ?', [id])

    res.json({
      message: 'Cliente deletado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao deletar cliente:', error)
    res.status(500).json({ 
      error: 'Erro interno do servidor' 
    })
  }
})

// Rota de health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'API funcionando corretamente' })
})

// Inicializar servidor
async function startServer() {
  try {
    // Inicializar banco de dados
    await initializeDatabase()
    
    // Iniciar servidor
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor rodando na porta ${PORT}`)
      console.log(`Acesse: http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error)
    process.exit(1)
  }
}

// Iniciar apenas se não estiver sendo importado para testes
if (require.main === module) {
  startServer()
}

module.exports = app

