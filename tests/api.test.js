const request = require('supertest')
const app = require('../index')
const { pool } = require('../database')

describe('API de Clientes', () => {
  
  describe('POST /clientes', () => {
    
    test('deve criar um cliente com dados válidos', async () => {
      const clienteData = {
        nome: 'João Silva Test',
        email: 'joao.test@email.com',
        telefone: '(11) 99999-9999'
      }

      const response = await request(app)
        .post('/clientes')
        .send(clienteData)
        .expect(201)

      expect(response.body).toHaveProperty('message', 'Cliente criado com sucesso')
      expect(response.body).toHaveProperty('cliente')
      expect(response.body.cliente).toHaveProperty('id')
      expect(response.body.cliente.nome).toBe(clienteData.nome)
      expect(response.body.cliente.email).toBe(clienteData.email)
      expect(response.body.cliente.telefone).toBe(clienteData.telefone)
    })

    test('deve retornar erro 400 quando nome não for fornecido', async () => {
      const clienteData = {
        email: 'test.sem.nome@email.com',
        telefone: '(11) 99999-9999'
      }

      const response = await request(app)
        .post('/clientes')
        .send(clienteData)
        .expect(400)

      expect(response.body).toHaveProperty('error', 'Dados inválidos')
      expect(response.body.details).toContain('Nome é obrigatório')
    })

    test('deve retornar erro 400 quando email não for fornecido', async () => {
      const clienteData = {
        nome: 'Teste Sem Email',
        telefone: '(11) 99999-9999'
      }

      const response = await request(app)
        .post('/clientes')
        .send(clienteData)
        .expect(400)

      expect(response.body).toHaveProperty('error', 'Dados inválidos')
      expect(response.body.details).toContain('Email é obrigatório')
    })

    test('deve retornar erro 400 quando telefone não for fornecido', async () => {
      const clienteData = {
        nome: 'Teste Sem Telefone',
        email: 'test.sem.telefone@email.com'
      }

      const response = await request(app)
        .post('/clientes')
        .send(clienteData)
        .expect(400)

      expect(response.body).toHaveProperty('error', 'Dados inválidos')
      expect(response.body.details).toContain('Telefone é obrigatório')
    })

    test('deve retornar erro 400 quando email for inválido', async () => {
      const clienteData = {
        nome: 'Teste Email Inválido',
        email: 'email-invalido',
        telefone: '(11) 99999-9999'
      }

      const response = await request(app)
        .post('/clientes')
        .send(clienteData)
        .expect(400)

      expect(response.body).toHaveProperty('error', 'Dados inválidos')
      expect(response.body.details).toContain('Email deve ter formato válido')
    })

    test('deve retornar erro 409 quando email já existir', async () => {
      const clienteData = {
        nome: 'Primeiro Cliente Test',
        email: 'duplicado.test@email.com',
        telefone: '(11) 99999-9999'
      }

      // Criar primeiro cliente
      await request(app)
        .post('/clientes')
        .send(clienteData)
        .expect(201)

      // Tentar criar segundo cliente com mesmo email
      const clienteData2 = {
        nome: 'Segundo Cliente Test',
        email: 'duplicado.test@email.com',
        telefone: '(11) 88888-8888'
      }

      const response = await request(app)
        .post('/clientes')
        .send(clienteData2)
        .expect(409)

      expect(response.body).toHaveProperty('error', 'Email já está em uso')
    })
  })

  describe('GET /clientes', () => {
    
    test('deve retornar lista vazia quando não há clientes', async () => {
      const response = await request(app)
        .get('/clientes')
        .expect(200)

      expect(response.body).toHaveProperty('message', 'Clientes listados com sucesso')
      expect(response.body).toHaveProperty('clientes')
      expect(Array.isArray(response.body.clientes)).toBe(true)
    })

    test('deve retornar lista de clientes quando existem clientes', async () => {
      // Criar alguns clientes de teste
      const cliente1 = {
        nome: 'Cliente 1 Test',
        email: 'cliente1.test@email.com',
        telefone: '(11) 11111-1111'
      }
      
      const cliente2 = {
        nome: 'Cliente 2 Test',
        email: 'cliente2.test@email.com',
        telefone: '(11) 22222-2222'
      }

      await request(app).post('/clientes').send(cliente1)
      await request(app).post('/clientes').send(cliente2)

      const response = await request(app)
        .get('/clientes')
        .expect(200)

      expect(response.body).toHaveProperty('message', 'Clientes listados com sucesso')
      expect(response.body).toHaveProperty('clientes')
      expect(Array.isArray(response.body.clientes)).toBe(true)
      expect(response.body.clientes.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('GET /clientes/:id', () => {
    
    test('deve retornar cliente quando ID existe', async () => {
      // Criar cliente de teste
      const clienteData = {
        nome: 'Cliente Busca Test',
        email: 'busca.test@email.com',
        telefone: '(11) 33333-3333'
      }

      const createResponse = await request(app)
        .post('/clientes')
        .send(clienteData)

      const clienteId = createResponse.body.cliente.id

      const response = await request(app)
        .get(`/clientes/${clienteId}`)
        .expect(200)

      expect(response.body).toHaveProperty('message', 'Cliente encontrado')
      expect(response.body).toHaveProperty('cliente')
      expect(response.body.cliente.id).toBe(clienteId)
      expect(response.body.cliente.nome).toBe(clienteData.nome)
    })

    test('deve retornar erro 404 quando ID não existe', async () => {
      const response = await request(app)
        .get('/clientes/99999')
        .expect(404)

      expect(response.body).toHaveProperty('error', 'Cliente não encontrado')
    })

    test('deve retornar erro 400 quando ID não é um número', async () => {
      const response = await request(app)
        .get('/clientes/abc')
        .expect(400)

      expect(response.body).toHaveProperty('error', 'ID deve ser um número válido')
    })
  })

  describe('PUT /clientes/:id', () => {
    
    test('deve atualizar cliente com dados válidos', async () => {
      // Criar cliente de teste
      const clienteData = {
        nome: 'Cliente Original Test',
        email: 'original.test@email.com',
        telefone: '(11) 44444-4444'
      }

      const createResponse = await request(app)
        .post('/clientes')
        .send(clienteData)

      const clienteId = createResponse.body.cliente.id

      // Atualizar cliente
      const updateData = {
        nome: 'Cliente Atualizado Test',
        email: 'atualizado.test@email.com',
        telefone: '(11) 55555-5555'
      }

      const response = await request(app)
        .put(`/clientes/${clienteId}`)
        .send(updateData)
        .expect(200)

      expect(response.body).toHaveProperty('message', 'Cliente atualizado com sucesso')
      expect(response.body).toHaveProperty('cliente')
      expect(response.body.cliente.nome).toBe(updateData.nome)
      expect(response.body.cliente.email).toBe(updateData.email)
      expect(response.body.cliente.telefone).toBe(updateData.telefone)
    })

    test('deve atualizar apenas campos fornecidos', async () => {
      // Criar cliente de teste
      const clienteData = {
        nome: 'Cliente Parcial Test',
        email: 'parcial.test@email.com',
        telefone: '(11) 66666-6666'
      }

      const createResponse = await request(app)
        .post('/clientes')
        .send(clienteData)

      const clienteId = createResponse.body.cliente.id

      // Atualizar apenas nome
      const updateData = {
        nome: 'Nome Atualizado Test'
      }

      const response = await request(app)
        .put(`/clientes/${clienteId}`)
        .send(updateData)
        .expect(200)

      expect(response.body.cliente.nome).toBe(updateData.nome)
      expect(response.body.cliente.email).toBe(clienteData.email) // Deve manter original
      expect(response.body.cliente.telefone).toBe(clienteData.telefone) // Deve manter original
    })

    test('deve retornar erro 404 quando ID não existe', async () => {
      const updateData = {
        nome: 'Cliente Inexistente Test'
      }

      const response = await request(app)
        .put('/clientes/99999')
        .send(updateData)
        .expect(404)

      expect(response.body).toHaveProperty('error', 'Cliente não encontrado')
    })

    test('deve retornar erro 400 quando ID não é um número', async () => {
      const updateData = {
        nome: 'Teste ID Inválido'
      }

      const response = await request(app)
        .put('/clientes/abc')
        .send(updateData)
        .expect(400)

      expect(response.body).toHaveProperty('error', 'ID deve ser um número válido')
    })

    test('deve retornar erro 400 quando nenhum campo é fornecido', async () => {
      // Criar cliente de teste
      const clienteData = {
        nome: 'Cliente Vazio Test',
        email: 'vazio.test@email.com',
        telefone: '(11) 77777-7777'
      }

      const createResponse = await request(app)
        .post('/clientes')
        .send(clienteData)

      const clienteId = createResponse.body.cliente.id

      const response = await request(app)
        .put(`/clientes/${clienteId}`)
        .send({})
        .expect(400)

      expect(response.body).toHaveProperty('error', 'Nenhum campo para atualizar foi fornecido')
    })

    test('deve retornar erro 400 quando email for inválido', async () => {
      // Criar cliente de teste
      const clienteData = {
        nome: 'Cliente Email Inválido Test',
        email: 'email.invalido.test@email.com',
        telefone: '(11) 88888-8888'
      }

      const createResponse = await request(app)
        .post('/clientes')
        .send(clienteData)

      const clienteId = createResponse.body.cliente.id

      const updateData = {
        email: 'email-formato-invalido'
      }

      const response = await request(app)
        .put(`/clientes/${clienteId}`)
        .send(updateData)
        .expect(400)

      expect(response.body).toHaveProperty('error', 'Dados inválidos')
      expect(response.body.details).toContain('Email deve ter formato válido')
    })
  })

  describe('DELETE /clientes/:id', () => {
    
    test('deve deletar cliente quando ID existe', async () => {
      // Criar cliente de teste
      const clienteData = {
        nome: 'Cliente Delete Test',
        email: 'delete.test@email.com',
        telefone: '(11) 99999-0000'
      }

      const createResponse = await request(app)
        .post('/clientes')
        .send(clienteData)

      const clienteId = createResponse.body.cliente.id

      const response = await request(app)
        .delete(`/clientes/${clienteId}`)
        .expect(200)

      expect(response.body).toHaveProperty('message', 'Cliente deletado com sucesso')

      // Verificar se cliente foi realmente deletado
      await request(app)
        .get(`/clientes/${clienteId}`)
        .expect(404)
    })

    test('deve retornar erro 404 quando ID não existe', async () => {
      const response = await request(app)
        .delete('/clientes/99999')
        .expect(404)

      expect(response.body).toHaveProperty('error', 'Cliente não encontrado')
    })

    test('deve retornar erro 400 quando ID não é um número', async () => {
      const response = await request(app)
        .delete('/clientes/abc')
        .expect(400)

      expect(response.body).toHaveProperty('error', 'ID deve ser um número válido')
    })
  })

  describe('GET /health', () => {
    
    test('deve retornar status OK', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200)

      expect(response.body).toHaveProperty('status', 'OK')
      expect(response.body).toHaveProperty('message', 'API funcionando corretamente')
    })
  })
})

