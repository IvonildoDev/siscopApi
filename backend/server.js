const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database configuration
const connection = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mydb',
    connectionLimit: 10,
    multipleStatements: true // Para permitir múltiplas consultas em uma única chamada
});

// Cache em memória
let equipeAtiva = null;
let operacaoAtiva = null;

// Inicializar banco de dados
function initializeDatabase() {
    const checkAndCreateQuery = `
        SHOW TABLES LIKE 'equipes';
        SHOW TABLES LIKE 'operacoes';
        SHOW TABLES LIKE 'deslocamentos';
        SHOW TABLES LIKE 'aguardos';
        SHOW TABLES LIKE 'refeicoes';
        SHOW TABLES LIKE 'abastecimentos';
    `;

    connection.query(checkAndCreateQuery, (err, results) => {
        if (err) {
            console.error('Erro ao verificar tabelas:', err);
            return;
        }

        // Cada consulta SHOW TABLES retorna um array diferente
        if (results && results.length >= 6) {
            console.log('Tabelas verificadas com sucesso');

            // Carregar equipe e operação ativas na inicialização
            carregarEquipeAtiva();
            carregarOperacaoAtiva();
        } else {
            console.error('Algumas tabelas podem não existir. Execute o script SQL para criá-las.');
        }
    });
}

// Carregar equipe ativa do banco
function carregarEquipeAtiva() {
    connection.query('SELECT * FROM equipes WHERE status = "ativo" ORDER BY id DESC LIMIT 1', (err, results) => {
        if (err) {
            console.error('Erro ao carregar equipe ativa:', err);
        } else if (results.length > 0) {
            equipeAtiva = results[0];
            console.log('Equipe ativa carregada com sucesso');
        } else {
            console.log('Nenhuma equipe ativa encontrada');
            equipeAtiva = null;
        }
    });
}

// Carregar operação ativa do banco
function carregarOperacaoAtiva() {
    connection.query('SELECT * FROM operacoes WHERE status = "ativo" AND etapa_atual != "FINALIZADA" ORDER BY id DESC LIMIT 1', (err, results) => {
        if (err) {
            console.error('Erro ao carregar operação ativa:', err);
        } else if (results.length > 0) {
            operacaoAtiva = results[0];
            console.log('Operação ativa carregada com sucesso');
        } else {
            console.log('Nenhuma operação ativa encontrada');
            operacaoAtiva = null;
        }
    });
}

// Validadores
const equipeValidators = [
    body('operador').trim().isLength({ min: 2, max: 100 }).withMessage('Nome do operador inválido'),
    body('auxiliar').trim().isLength({ min: 2, max: 100 }).withMessage('Nome do auxiliar inválido'),
    body('unidade').trim().isLength({ min: 2, max: 100 }).withMessage('Unidade inválida'),
    body('placa').trim().isLength({ min: 3, max: 20 }).withMessage('Placa inválida')
];

const operacaoValidators = [
    body('tipo_operacao').isIn(['TERMICA', 'ESTANQUEIDADE', 'LIMPEZA', 'PIG']).withMessage('Tipo de operação inválido'),
    body('poco').optional().trim().isLength({ max: 100 }),
    body('cidade').optional().trim().isLength({ max: 100 }),
    body('observacoes').optional().trim()
];

const deslocamentoValidators = [
    body('origem').trim().isLength({ min: 2, max: 100 }).withMessage('Origem inválida'),
    body('destino').trim().isLength({ min: 2, max: 100 }).withMessage('Destino inválido'),
    body('km_inicial').isNumeric().withMessage('Quilometragem inicial inválida'),
    body('observacoes').optional().trim()
];

const aguardoValidators = [
    body('motivo').trim().isLength({ min: 2, max: 255 }).withMessage('Motivo inválido'),
    body('observacoes').optional().trim()
];

const abastecimentoValidators = [
    body('tipo_abastecimento').isIn(['AGUA', 'COMBUSTIVEL']).withMessage('Tipo de abastecimento inválido'),
    body('observacoes').optional().trim()
];

// Inicializar BD assim que o servidor iniciar
initializeDatabase();

// Middleware para verificar se há equipe ativa
function verificarEquipeAtiva(req, res, next) {
    if (!equipeAtiva) {
        return res.status(400).json({ error: 'Não há equipe ativa. Cadastre uma equipe primeiro.' });
    }
    next();
}

// Middleware para verificar se há operação ativa
function verificarOperacaoAtiva(req, res, next) {
    if (!operacaoAtiva) {
        return res.status(400).json({ error: 'Não há operação ativa. Inicie uma operação primeiro.' });
    }
    next();
}

// Middleware para verificação opcional de operação ativa
function verificarOperacaoOpcional(req, res, next) {
    // Se existe operação ativa, adiciona ao body
    if (operacaoAtiva) {
        req.operacaoAtiva = operacaoAtiva;
    }
    next();
}

// ROTAS DE EQUIPE //

// Rota POST - Cadastrar equipe
app.post('/equipes', equipeValidators, (req, res) => {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { operador, auxiliar, unidade, placa } = req.body;
    const query = 'INSERT INTO equipes (operador, auxiliar, unidade, placa) VALUES (?, ?, ?, ?)';

    connection.query(query, [operador, auxiliar, unidade, placa], (err, result) => {
        if (err) {
            console.error('Erro ao adicionar equipe:', err);
            return res.status(500).json({ error: 'Erro ao adicionar equipe' });
        }

        // Atualizar equipes antigas para inativo
        connection.query('UPDATE equipes SET status = "inativo" WHERE id != ?', [result.insertId], (updateErr) => {
            if (updateErr) {
                console.error('Aviso: Erro ao atualizar status das equipes antigas', updateErr);
            }

            // Armazena equipe ativa em memória também para acesso rápido
            equipeAtiva = {
                id: result.insertId,
                operador,
                auxiliar,
                unidade,
                placa,
                status: 'ativo',
                data_cadastro: new Date()
            };

            res.status(201).json(equipeAtiva);
        });
    });
});

// Rota GET - Obter equipe ativa
app.get('/equipes/ativa', (req, res) => {
    if (equipeAtiva) {
        return res.json(equipeAtiva);
    }

    // Se não tem em memória, busca a última equipe cadastrada no banco
    connection.query('SELECT * FROM equipes WHERE status = "ativo" ORDER BY id DESC LIMIT 1', (err, results) => {
        if (err) {
            console.error('Erro ao buscar equipe ativa:', err);
            return res.status(500).json({ error: 'Erro ao buscar equipe ativa' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Nenhuma equipe ativa encontrada' });
        }

        equipeAtiva = results[0];
        res.json(equipeAtiva);
    });
});

// Rota GET - Listar todas as equipes
app.get('/equipes', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    connection.query('SELECT * FROM equipes ORDER BY id DESC LIMIT ? OFFSET ?',
        [limit, offset], (err, results) => {
            if (err) {
                console.error('Erro ao buscar equipes:', err);
                return res.status(500).json({ error: 'Erro ao buscar equipes' });
            }

            // Contar total para paginação
            connection.query('SELECT COUNT(*) as total FROM equipes', (countErr, countResults) => {
                if (countErr) {
                    console.error('Erro ao contar equipes:', countErr);
                    return res.json({ data: results });
                }

                const total = countResults[0].total;
                res.json({
                    data: results,
                    pagination: {
                        total,
                        pages: Math.ceil(total / limit),
                        currentPage: page,
                        perPage: limit
                    }
                });
            });
        });
});

// Rota GET - Buscar equipe por ID
app.get('/equipes/:id', (req, res) => {
    const id = req.params.id;

    connection.query('SELECT * FROM equipes WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar equipe:', err);
            return res.status(500).json({ error: 'Erro ao buscar equipe' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Equipe não encontrada' });
        }

        res.json(results[0]);
    });
});

// ROTAS DE OPERAÇÕES //

// Rota POST - Iniciar operação
app.post('/operacoes', verificarEquipeAtiva, operacaoValidators, (req, res) => {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Verificar se já tem operação ativa
    if (operacaoAtiva) {
        return res.status(400).json({ error: 'Já existe uma operação ativa. Finalize-a antes de iniciar uma nova.' });
    }

    const { tipo_operacao, poco, cidade, observacoes } = req.body;
    const query = `
        INSERT INTO operacoes 
        (equipe_id, tipo_operacao, poco, cidade, observacoes, status, etapa_atual) 
        VALUES (?, ?, ?, ?, ?, 'ativo', 'EM_MOBILIZACAO')
    `;

    connection.query(query, [equipeAtiva.id, tipo_operacao, poco, cidade, observacoes], (err, result) => {
        if (err) {
            console.error('Erro ao adicionar operação:', err);
            return res.status(500).json({ error: 'Erro ao adicionar operação' });
        }

        // Buscar a operação completa que acabou de ser inserida
        connection.query('SELECT * FROM operacoes WHERE id = ?', [result.insertId], (selectErr, selectResults) => {
            if (selectErr || selectResults.length === 0) {
                console.error('Erro ao buscar a operação inserida:', selectErr);
                return res.status(500).json({ error: 'Erro ao recuperar dados da operação' });
            }

            // Armazenar em memória
            operacaoAtiva = selectResults[0];
            res.status(201).json(operacaoAtiva);
        });
    });
});

// Rota GET - Obter operação ativa
app.get('/operacoes/ativa', (req, res) => {
    if (operacaoAtiva) {
        return res.json(operacaoAtiva);
    }

    // Se não tem em memória, busca no banco
    connection.query(
        'SELECT * FROM operacoes WHERE status = "ativo" AND etapa_atual != "FINALIZADA" ORDER BY id DESC LIMIT 1',
        (err, results) => {
            if (err) {
                console.error('Erro ao buscar operação ativa:', err);
                return res.status(500).json({ error: 'Erro ao buscar operação ativa' });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: 'Nenhuma operação ativa encontrada' });
            }

            operacaoAtiva = results[0];
            res.json(operacaoAtiva);
        }
    );
});

// Rota GET - Listar todas as operações
app.get('/operacoes', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    connection.query(
        'SELECT * FROM operacoes ORDER BY id DESC LIMIT ? OFFSET ?',
        [limit, offset],
        (err, results) => {
            if (err) {
                console.error('Erro ao buscar operações:', err);
                return res.status(500).json({ error: 'Erro ao buscar operações' });
            }

            // Contar total para paginação
            connection.query('SELECT COUNT(*) as total FROM operacoes', (countErr, countResults) => {
                if (countErr) {
                    console.error('Erro ao contar operações:', countErr);
                    return res.json(results);
                }

                const total = countResults[0].total;
                res.json({
                    data: results,
                    pagination: {
                        total,
                        pages: Math.ceil(total / limit),
                        currentPage: page,
                        perPage: limit
                    }
                });
            });
        }
    );
});

// Rota PUT - Atualizar etapa da operação
app.put('/operacoes/:id/etapa', verificarOperacaoAtiva, (req, res) => {
    const id = req.params.id;
    const { etapa } = req.body;

    if (!etapa || !['EM_MOBILIZACAO', 'EM_OPERACAO', 'EM_DESMOBILIZACAO', 'AGUARDANDO', 'FINALIZADA'].includes(etapa)) {
        return res.status(400).json({ error: 'Etapa inválida' });
    }

    // Verificar se é a operação ativa
    if (operacaoAtiva.id != id) {
        return res.status(400).json({ error: 'Não é possível atualizar uma operação que não está ativa' });
    }

    // Se a etapa for FINALIZADA, incluir timestamp de fim
    let query = 'UPDATE operacoes SET etapa_atual = ? WHERE id = ?';
    let params = [etapa, id];

    if (etapa === 'FINALIZADA') {
        query = 'UPDATE operacoes SET etapa_atual = ?, fim_operacao = CURRENT_TIMESTAMP, status = "inativo" WHERE id = ?';
    }

    connection.query(query, params, (err, result) => {
        if (err) {
            console.error('Erro ao atualizar etapa da operação:', err);
            return res.status(500).json({ error: 'Erro ao atualizar etapa da operação' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Operação não encontrada' });
        }

        // Se a operação foi finalizada, atualizar o cache
        if (etapa === 'FINALIZADA') {
            operacaoAtiva = null;
            return res.json({ message: 'Operação finalizada com sucesso' });
        }

        // Atualizar o cache
        operacaoAtiva.etapa_atual = etapa;
        res.json({ message: 'Etapa atualizada com sucesso', etapa });
    });
});

// Rota GET - Buscar operação por ID
app.get('/operacoes/:id', (req, res) => {
    const id = req.params.id;

    connection.query('SELECT * FROM operacoes WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar operação:', err);
            return res.status(500).json({ error: 'Erro ao buscar operação' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Operação não encontrada' });
        }

        res.json(results[0]);
    });
});

// ROTAS DE DESLOCAMENTO //

// Rota POST - Iniciar deslocamento
app.post('/deslocamentos', verificarEquipeAtiva, verificarOperacaoOpcional, deslocamentoValidators, (req, res) => {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Verificar se já existe um deslocamento em andamento
    connection.query(
        'SELECT id FROM deslocamentos WHERE status = "EM_ANDAMENTO" AND equipe_id = ?',
        [equipeAtiva.id],
        (checkErr, checkResults) => {
            if (checkErr) {
                console.error('Erro ao verificar deslocamentos ativos:', checkErr);
                return res.status(500).json({ error: 'Erro ao verificar deslocamentos ativos' });
            }

            if (checkResults.length > 0) {
                return res.status(400).json({ error: 'Já existe um deslocamento em andamento' });
            }

            const { origem, destino, km_inicial, observacoes } = req.body;
            // Usar operacao_id do req.body ou da operacaoAtiva, ou null
            const operacao_id = req.body.operacao_id || (req.operacaoAtiva ? req.operacaoAtiva.id : null);

            const query = `
                INSERT INTO deslocamentos 
                (equipe_id, operacao_id, origem, destino, km_inicial, observacoes) 
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            connection.query(
                query,
                [equipeAtiva.id, operacao_id, origem, destino, km_inicial, observacoes],
                (err, result) => {
                    if (err) {
                        console.error('Erro ao adicionar deslocamento:', err);
                        return res.status(500).json({ error: 'Erro ao adicionar deslocamento' });
                    }

                    connection.query('SELECT * FROM deslocamentos WHERE id = ?', [result.insertId], (selectErr, selectResults) => {
                        if (selectErr || selectResults.length === 0) {
                            console.error('Erro ao buscar deslocamento inserido:', selectErr);
                            return res.status(500).json({ error: 'Erro ao recuperar dados do deslocamento' });
                        }

                        res.status(201).json(selectResults[0]);
                    });
                }
            );
        }
    );
});

// Rota PUT - Finalizar deslocamento
app.put('/deslocamentos/:id/finalizar', verificarEquipeAtiva, (req, res) => {
    const id = req.params.id;
    const { km_final, observacoes } = req.body;

    // Validar entrada
    if (km_final === undefined || isNaN(km_final)) {
        return res.status(400).json({ error: 'Quilometragem final inválida' });
    }

    // Verificar se deslocamento existe e está em andamento
    connection.query(
        'SELECT * FROM deslocamentos WHERE id = ?',
        [id],
        (checkErr, checkResults) => {
            if (checkErr) {
                console.error('Erro ao verificar deslocamento:', checkErr);
                return res.status(500).json({ error: 'Erro ao verificar deslocamento' });
            }

            if (checkResults.length === 0) {
                return res.status(404).json({ error: 'Deslocamento não encontrado' });
            }

            const deslocamento = checkResults[0];
            if (deslocamento.status !== 'EM_ANDAMENTO') {
                return res.status(400).json({ error: 'Este deslocamento já foi finalizado ou cancelado' });
            }

            // Verificar se km_final é maior que km_inicial
            if (parseFloat(km_final) < parseFloat(deslocamento.km_inicial)) {
                return res.status(400).json({ error: 'Quilometragem final não pode ser menor que a inicial' });
            }

            // Finalizar deslocamento
            const updateQuery = `
                UPDATE deslocamentos 
                SET km_final = ?, 
                    hora_fim = CURRENT_TIMESTAMP, 
                    status = 'FINALIZADO',
                    observacoes = CASE WHEN ? IS NOT NULL THEN ? ELSE observacoes END
                WHERE id = ?
            `;

            connection.query(
                updateQuery,
                [km_final, observacoes, observacoes, id],
                (updateErr, updateResult) => {
                    if (updateErr) {
                        console.error('Erro ao finalizar deslocamento:', updateErr);
                        return res.status(500).json({ error: 'Erro ao finalizar deslocamento' });
                    }

                    // Buscar deslocamento atualizado
                    connection.query('SELECT * FROM deslocamentos WHERE id = ?', [id], (selectErr, selectResults) => {
                        if (selectErr || selectResults.length === 0) {
                            return res.json({ message: 'Deslocamento finalizado com sucesso' });
                        }

                        res.json(selectResults[0]);
                    });
                }
            );
        }
    );
});

// Rota GET - Listar deslocamentos
app.get('/deslocamentos', (req, res) => {
    // Parâmetros de filtro opcionais
    const operacao_id = req.query.operacao_id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let queryParams = [limit, offset];
    let whereClause = '';

    if (operacao_id) {
        whereClause = 'WHERE operacao_id = ?';
        queryParams.unshift(operacao_id);
    }

    const query = `SELECT * FROM deslocamentos ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`;

    connection.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Erro ao buscar deslocamentos:', err);
            return res.status(500).json({ error: 'Erro ao buscar deslocamentos' });
        }

        res.json(results);
    });
});

// ROTAS DE AGUARDO //

// Rota POST - Iniciar aguardo
app.post('/aguardos', verificarEquipeAtiva, verificarOperacaoOpcional, aguardoValidators, (req, res) => {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Verificar se já existe um aguardo em andamento
    connection.query(
        'SELECT id FROM aguardos WHERE equipe_id = ? AND fim_aguardo IS NULL',
        [equipeAtiva.id],
        (checkErr, checkResults) => {
            if (checkErr) {
                console.error('Erro ao verificar aguardos ativos:', checkErr);
                return res.status(500).json({ error: 'Erro ao verificar aguardos ativos' });
            }

            if (checkResults.length > 0) {
                return res.status(400).json({ error: 'Já existe um aguardo em andamento' });
            }

            const { motivo, observacoes } = req.body;
            // Usar operacao_id do req.body ou da operacaoAtiva, ou null
            const operacao_id = req.body.operacao_id || (req.operacaoAtiva ? req.operacaoAtiva.id : null);

            const query = `
                INSERT INTO aguardos 
                (equipe_id, operacao_id, motivo, observacoes) 
                VALUES (?, ?, ?, ?)
            `;

            connection.query(
                query,
                [equipeAtiva.id, operacao_id, motivo, observacoes],
                (err, result) => {
                    if (err) {
                        console.error('Erro ao adicionar aguardo:', err);
                        return res.status(500).json({ error: 'Erro ao adicionar aguardo' });
                    }

                    connection.query('SELECT * FROM aguardos WHERE id = ?', [result.insertId], (selectErr, selectResults) => {
                        if (selectErr || selectResults.length === 0) {
                            console.error('Erro ao buscar aguardo inserido:', selectErr);
                            return res.status(500).json({ error: 'Erro ao recuperar dados do aguardo' });
                        }

                        res.status(201).json(selectResults[0]);
                    });
                }
            );
        }
    );
});

// Rota PUT - Finalizar aguardo
app.put('/aguardos/:id/finalizar', verificarEquipeAtiva, (req, res) => {
    const id = req.params.id;
    const { observacoes } = req.body;

    // Verificar se aguardo existe e está em andamento
    connection.query(
        'SELECT * FROM aguardos WHERE id = ?',
        [id],
        (checkErr, checkResults) => {
            if (checkErr) {
                console.error('Erro ao verificar aguardo:', checkErr);
                return res.status(500).json({ error: 'Erro ao verificar aguardo' });
            }

            if (checkResults.length === 0) {
                return res.status(404).json({ error: 'Aguardo não encontrado' });
            }

            const aguardo = checkResults[0];
            if (aguardo.fim_aguardo !== null) {
                return res.status(400).json({ error: 'Este aguardo já foi finalizado' });
            }

            // Calcular tempo de aguardo em segundos
            const inicioAguardo = new Date(aguardo.inicio_aguardo);
            const agora = new Date();
            const tempoAguardo = Math.floor((agora - inicioAguardo) / 1000);

            // Finalizar aguardo
            const updateQuery = `
                UPDATE aguardos 
                SET fim_aguardo = CURRENT_TIMESTAMP,
                    tempo_aguardo = ?,
                    observacoes = CASE WHEN ? IS NOT NULL THEN ? ELSE observacoes END
                WHERE id = ?
            `;

            connection.query(
                updateQuery,
                [tempoAguardo, observacoes, observacoes, id],
                (updateErr, updateResult) => {
                    if (updateErr) {
                        console.error('Erro ao finalizar aguardo:', updateErr);
                        return res.status(500).json({ error: 'Erro ao finalizar aguardo' });
                    }

                    // Buscar aguardo atualizado
                    connection.query('SELECT * FROM aguardos WHERE id = ?', [id], (selectErr, selectResults) => {
                        if (selectErr || selectResults.length === 0) {
                            return res.json({
                                message: 'Aguardo finalizado com sucesso',
                                tempo_aguardo: tempoAguardo
                            });
                        }

                        res.json(selectResults[0]);
                    });
                }
            );
        }
    );
});

// Rota GET - Listar aguardos
app.get('/aguardos', (req, res) => {
    // Parâmetros de filtro opcionais
    const operacao_id = req.query.operacao_id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let queryParams = [];

    // Adicionar filtros se fornecidos
    if (operacao_id) {
        whereConditions.push('a.operacao_id = ?');
        queryParams.push(operacao_id);
    }

    // Se tem equipe ativa, filtrar por ela
    if (equipeAtiva) {
        whereConditions.push('a.equipe_id = ?');
        queryParams.push(equipeAtiva.id);
    }

    const whereClause = whereConditions.length > 0
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';

    // Consulta com JOIN para pegar também os dados da operação
    const query = `
        SELECT a.*, o.tipo_operacao, o.poco, o.cidade 
        FROM aguardos a 
        LEFT JOIN operacoes o ON a.operacao_id = o.id 
        ${whereClause} 
        ORDER BY a.inicio_aguardo DESC 
        LIMIT ? OFFSET ?
    `;

    // Adicionar parâmetros de paginação
    queryParams.push(limit, offset);

    connection.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Erro ao buscar aguardos:', err);
            return res.status(500).json({ error: 'Erro ao buscar aguardos' });
        }

        res.json(results);
    });
});

// Rota GET - Obter aguardo ativo
app.get('/aguardos/ativo', (req, res) => {
    if (!equipeAtiva) {
        return res.status(404).json({ error: 'Nenhuma equipe ativa encontrada' });
    }

    const query = `
        SELECT a.*, o.tipo_operacao, o.poco, o.cidade 
        FROM aguardos a 
        LEFT JOIN operacoes o ON a.operacao_id = o.id 
        WHERE a.equipe_id = ? AND a.fim_aguardo IS NULL 
        ORDER BY a.id DESC LIMIT 1
    `;

    connection.query(query, [equipeAtiva.id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar aguardo ativo:', err);
            return res.status(500).json({ error: 'Erro ao buscar aguardo ativo' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Nenhum aguardo ativo encontrado' });
        }

        res.json(results[0]);
    });
});

// ROTAS DE REFEIÇÃO //

// Rota POST - Iniciar refeição
app.post('/refeicoes', verificarEquipeAtiva, verificarOperacaoOpcional, (req, res) => {
    // Verificar se já existe uma refeição em andamento
    connection.query(
        'SELECT id FROM refeicoes WHERE equipe_id = ? AND fim_refeicao IS NULL',
        [equipeAtiva.id],
        (checkErr, checkResults) => {
            if (checkErr) {
                console.error('Erro ao verificar refeições ativas:', checkErr);
                return res.status(500).json({ error: 'Erro ao verificar refeições ativas' });
            }

            if (checkResults.length > 0) {
                return res.status(400).json({ error: 'Já existe uma refeição em andamento' });
            }

            const { observacoes } = req.body || {};
            // Usar operacao_id do req.body ou da operacaoAtiva, ou null
            const operacao_id = req.body.operacao_id || (req.operacaoAtiva ? req.operacaoAtiva.id : null);

            const query = `
                INSERT INTO refeicoes 
                (equipe_id, operacao_id, observacoes) 
                VALUES (?, ?, ?)
            `;

            connection.query(
                query,
                [equipeAtiva.id, operacao_id, observacoes],
                (err, result) => {
                    if (err) {
                        console.error('Erro ao adicionar refeição:', err);
                        return res.status(500).json({ error: 'Erro ao adicionar refeição' });
                    }

                    connection.query('SELECT * FROM refeicoes WHERE id = ?', [result.insertId], (selectErr, selectResults) => {
                        if (selectErr || selectResults.length === 0) {
                            console.error('Erro ao buscar refeição inserida:', selectErr);
                            return res.status(500).json({ error: 'Erro ao recuperar dados da refeição' });
                        }

                        res.status(201).json(selectResults[0]);
                    });
                }
            );
        }
    );
});

// Rota PUT - Finalizar refeição
app.put('/refeicoes/:id/finalizar', verificarEquipeAtiva, (req, res) => {
    const id = req.params.id;
    const { observacoes } = req.body || {};

    // Verificar se refeição existe e está em andamento
    connection.query(
        'SELECT * FROM refeicoes WHERE id = ?',
        [id],
        (checkErr, checkResults) => {
            if (checkErr) {
                console.error('Erro ao verificar refeição:', checkErr);
                return res.status(500).json({ error: 'Erro ao verificar refeição' });
            }

            if (checkResults.length === 0) {
                return res.status(404).json({ error: 'Refeição não encontrada' });
            }

            const refeicao = checkResults[0];
            if (refeicao.fim_refeicao !== null) {
                return res.status(400).json({ error: 'Esta refeição já foi finalizada' });
            }

            // Calcular tempo de refeição em segundos
            const inicioRefeicao = new Date(refeicao.inicio_refeicao);
            const agora = new Date();
            const tempoRefeicao = Math.floor((agora - inicioRefeicao) / 1000);

            // Finalizar refeição
            const updateQuery = `
                UPDATE refeicoes 
                SET fim_refeicao = CURRENT_TIMESTAMP,
                    tempo_refeicao = ?,
                    observacoes = CASE WHEN ? IS NOT NULL THEN ? ELSE observacoes END
                WHERE id = ?
            `;

            connection.query(
                updateQuery,
                [tempoRefeicao, observacoes, observacoes, id],
                (updateErr, updateResult) => {
                    if (updateErr) {
                        console.error('Erro ao finalizar refeição:', updateErr);
                        return res.status(500).json({ error: 'Erro ao finalizar refeição' });
                    }

                    // Buscar refeição atualizada
                    connection.query('SELECT * FROM refeicoes WHERE id = ?', [id], (selectErr, selectResults) => {
                        if (selectErr || selectResults.length === 0) {
                            return res.json({
                                message: 'Refeição finalizada com sucesso',
                                tempo_refeicao: tempoRefeicao
                            });
                        }

                        res.json(selectResults[0]);
                    });
                }
            );
        }
    );
});

// Rota GET - Listar refeições
app.get('/refeicoes', (req, res) => {
    // Parâmetros de filtro opcionais
    const operacao_id = req.query.operacao_id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let queryParams = [];

    // Adicionar filtros se fornecidos
    if (operacao_id) {
        whereConditions.push('r.operacao_id = ?');
        queryParams.push(operacao_id);
    }

    // Se tem equipe ativa, filtrar por ela
    if (equipeAtiva) {
        whereConditions.push('r.equipe_id = ?');
        queryParams.push(equipeAtiva.id);
    }

    const whereClause = whereConditions.length > 0
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';

    // Consulta com JOIN para pegar também os dados da operação
    const query = `
        SELECT r.*, o.tipo_operacao, o.poco, o.cidade 
        FROM refeicoes r 
        LEFT JOIN operacoes o ON r.operacao_id = o.id 
        ${whereClause} 
        ORDER BY r.inicio_refeicao DESC 
        LIMIT ? OFFSET ?
    `;

    // Adicionar parâmetros de paginação
    queryParams.push(limit, offset);

    connection.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Erro ao buscar refeições:', err);
            return res.status(500).json({ error: 'Erro ao buscar refeições' });
        }

        res.json(results);
    });
});

// Rota GET - Obter refeição ativa
app.get('/refeicoes/ativo', (req, res) => {
    if (!equipeAtiva) {
        return res.status(404).json({ error: 'Nenhuma equipe ativa encontrada' });
    }

    const query = `
        SELECT r.*, o.tipo_operacao, o.poco, o.cidade 
        FROM refeicoes r 
        LEFT JOIN operacoes o ON r.operacao_id = o.id 
        WHERE r.equipe_id = ? AND r.fim_refeicao IS NULL 
        ORDER BY r.id DESC LIMIT 1
    `;

    connection.query(query, [equipeAtiva.id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar refeição ativa:', err);
            return res.status(500).json({ error: 'Erro ao buscar refeição ativa' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Nenhuma refeição ativa encontrada' });
        }

        res.json(results[0]);
    });
});

// ROTAS DE ABASTECIMENTO //

// Rota POST - Iniciar abastecimento
app.post('/abastecimentos', verificarEquipeAtiva, verificarOperacaoOpcional, abastecimentoValidators, (req, res) => {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Verificar se já existe um abastecimento em andamento
    connection.query(
        'SELECT id FROM abastecimentos WHERE equipe_id = ? AND fim_abastecimento IS NULL',
        [equipeAtiva.id],
        (checkErr, checkResults) => {
            if (checkErr) {
                console.error('Erro ao verificar abastecimentos ativos:', checkErr);
                return res.status(500).json({ error: 'Erro ao verificar abastecimentos ativos' });
            }

            if (checkResults.length > 0) {
                return res.status(400).json({ error: 'Já existe um abastecimento em andamento' });
            }

            const { tipo_abastecimento, observacoes } = req.body;

            // Usar operacao_id do req.body ou da operacaoAtiva, ou null
            const operacao_id = req.body.operacao_id || (req.operacaoAtiva ? req.operacaoAtiva.id : null);

            const query = `
                INSERT INTO abastecimentos 
                (equipe_id, operacao_id, tipo_abastecimento, observacoes) 
                VALUES (?, ?, ?, ?)
            `;

            connection.query(
                query,
                [equipeAtiva.id, operacao_id, tipo_abastecimento, observacoes],
                (err, result) => {
                    if (err) {
                        console.error('Erro ao adicionar abastecimento:', err);
                        return res.status(500).json({ error: `Erro ao adicionar abastecimento: ${err.message}` });
                    }

                    connection.query('SELECT * FROM abastecimentos WHERE id = ?', [result.insertId], (selectErr, selectResults) => {
                        if (selectErr || selectResults.length === 0) {
                            console.error('Erro ao buscar abastecimento inserido:', selectErr);
                            return res.status(500).json({ error: 'Erro ao recuperar dados do abastecimento' });
                        }

                        res.status(201).json(selectResults[0]);
                    });
                }
            );
        }
    );
});

// Rota PUT - Finalizar abastecimento
app.put('/abastecimentos/:id/finalizar', verificarEquipeAtiva, (req, res) => {
    const id = req.params.id;
    const { observacoes } = req.body || {};

    // Verificar se abastecimento existe e está em andamento
    connection.query(
        'SELECT * FROM abastecimentos WHERE id = ?',
        [id],
        (checkErr, checkResults) => {
            if (checkErr) {
                console.error('Erro ao verificar abastecimento:', checkErr);
                return res.status(500).json({ error: 'Erro ao verificar abastecimento' });
            }

            if (checkResults.length === 0) {
                return res.status(404).json({ error: 'Abastecimento não encontrado' });
            }

            const abastecimento = checkResults[0];
            if (abastecimento.fim_abastecimento !== null) {
                return res.status(400).json({ error: 'Este abastecimento já foi finalizado' });
            }

            // Calcular tempo de abastecimento em segundos
            const inicioAbastecimento = new Date(abastecimento.inicio_abastecimento);
            const agora = new Date();
            const tempoAbastecimento = Math.floor((agora - inicioAbastecimento) / 1000);

            // Finalizar abastecimento
            const updateQuery = `
                UPDATE abastecimentos 
                SET fim_abastecimento = CURRENT_TIMESTAMP,
                    tempo_abastecimento = ?,
                    observacoes = CASE WHEN ? IS NOT NULL THEN ? ELSE observacoes END
                WHERE id = ?
            `;

            connection.query(
                updateQuery,
                [tempoAbastecimento, observacoes, observacoes, id],
                (updateErr, updateResult) => {
                    if (updateErr) {
                        console.error('Erro ao finalizar abastecimento:', updateErr);
                        return res.status(500).json({ error: 'Erro ao finalizar abastecimento' });
                    }

                    // Buscar abastecimento atualizado
                    connection.query('SELECT * FROM abastecimentos WHERE id = ?', [id], (selectErr, selectResults) => {
                        if (selectErr || selectResults.length === 0) {
                            return res.json({
                                message: 'Abastecimento finalizado com sucesso',
                                tempo_abastecimento: tempoAbastecimento
                            });
                        }

                        res.json(selectResults[0]);
                    });
                }
            );
        }
    );
});

// Rota GET - Listar abastecimentos
app.get('/abastecimentos', (req, res) => {
    // Parâmetros de filtro opcionais
    const operacao_id = req.query.operacao_id;
    const tipo = req.query.tipo;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let queryParams = [];

    // Adicionar filtros se fornecidos
    if (operacao_id) {
        whereConditions.push('a.operacao_id = ?');
        queryParams.push(operacao_id);
    }

    if (tipo) {
        whereConditions.push('a.tipo_abastecimento = ?');
        queryParams.push(tipo);
    }

    // Se tem equipe ativa, filtrar por ela
    if (equipeAtiva) {
        whereConditions.push('a.equipe_id = ?');
        queryParams.push(equipeAtiva.id);
    }

    const whereClause = whereConditions.length > 0
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';

    // Consulta com JOIN para pegar também os dados da operação
    const query = `
        SELECT a.*, o.tipo_operacao, o.poco, o.cidade 
        FROM abastecimentos a 
        LEFT JOIN operacoes o ON a.operacao_id = o.id 
        ${whereClause} 
        ORDER BY a.inicio_abastecimento DESC 
        LIMIT ? OFFSET ?
    `;

    // Adicionar parâmetros de paginação
    queryParams.push(limit, offset);

    connection.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Erro ao buscar abastecimentos:', err);
            return res.status(500).json({ error: 'Erro ao buscar abastecimentos' });
        }

        res.json(results);
    });
});

// Rota GET - Obter abastecimento ativo
app.get('/abastecimentos/ativo', (req, res) => {
    if (!equipeAtiva) {
        return res.status(404).json({ error: 'Nenhuma equipe ativa encontrada' });
    }

    const query = `
        SELECT a.*, o.tipo_operacao, o.poco, o.cidade 
        FROM abastecimentos a 
        LEFT JOIN operacoes o ON a.operacao_id = o.id 
        WHERE a.equipe_id = ? AND a.fim_abastecimento IS NULL 
        ORDER BY a.id DESC LIMIT 1
    `;

    connection.query(query, [equipeAtiva.id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar abastecimento ativo:', err);
            return res.status(500).json({ error: 'Erro ao buscar abastecimento ativo' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Nenhum abastecimento ativo encontrado' });
        }

        res.json(results[0]);
    });
});

// Rota GET - Obter abastecimento por ID
app.get('/abastecimentos/:id', (req, res) => {
    const id = req.params.id;

    const query = `
        SELECT a.*, o.tipo_operacao, o.poco, o.cidade 
        FROM abastecimentos a 
        LEFT JOIN operacoes o ON a.operacao_id = o.id 
        WHERE a.id = ?
    `;

    connection.query(query, [id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar abastecimento:', err);
            return res.status(500).json({ error: 'Erro ao buscar abastecimento' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Abastecimento não encontrado' });
        }

        res.json(results[0]);
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});