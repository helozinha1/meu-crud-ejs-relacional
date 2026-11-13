import express from 'express';
import session from 'express-session';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';
import { verificarAutenticacao } from './middleware/auth.js';

// Recriação de __dirname para ES6 Modules em Node.js
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configuração do motor de visualização EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Parsing de formulários HTML (application/x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true }));

// Configuração de Sessão de Usuário
app.use(session({
    secret: 'chave_secreta_relacional_saep',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 }
}));

// ==========================================
// ROTAS DE AUTENTICAÇÃO (LOGIN / LOGOUT)
// ==========================================

app.get('/login', (req, res) => {
    res.render('login', { erro: null });
});

app.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    try {
        const resultado = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        
        if (resultado.rows.length === 0) {
            return res.render('login', { erro: 'Usuário não encontrado.' });
        }

        const usuario = resultado.rows[0];
        const senhaValida = await bcrypt.compare(senha, usuario.senha);

        if (!senhaValida) {
            return res.render('login', { erro: 'Senha incorreta.' });
        }

        req.session.usuario = {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email
        };

        res.redirect('/produtos');
    } catch (err) {
        console.error(err);
        res.render('login', { erro: 'Erro interno ao realizar login.' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// ==========================================
// ROTAS DO CRUD DE GRUPOS DE PRODUTOS
// ==========================================

// Lista todos os grupos cadastrados
app.get('/grupos', verificarAutenticacao, async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM grupos ORDER BY id ASC');
        res.render('grupos', { 
            grupos: resultado.rows, 
            usuario: req.session.usuario 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao buscar grupos de produtos.');
    }
});

// Cadastra um novo grupo
app.post('/grupos/novo', verificarAutenticacao, async (req, res) => {
    const { descricao_grupo } = req.body;
    try {
        await pool.query('INSERT INTO grupos (descricao_grupo) VALUES ($1)', [descricao_grupo]);
        res.redirect('/grupos');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao cadastrar grupo.');
    }
});

// Exclui um grupo
app.get('/grupos/deletar/:id', verificarAutenticacao, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM grupos WHERE id = $1', [id]);
        res.redirect('/grupos');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao deletar grupo.');
    }
});

// ==========================================
// ROTAS DO CRUD DE PRODUTOS (COM RELACIONAMENTO)
// ==========================================

// Rota GET: Lista produtos unindo a tabela de Grupos via LEFT JOIN
app.get('/produtos', verificarAutenticacao, async (req, res) => {
    const busca = req.query.busca || '';

    try {
        // Consulta SQL utilizando LEFT JOIN para trazer o nome do grupo junto com os dados do produto
        let querySql = `
            SELECT p.id, p.nome_produto, p.peso, p.preco, p.grupo_id, g.descricao_grupo 
            FROM produtos p 
            LEFT JOIN grupos g ON p.grupo_id = g.id 
            ORDER BY p.id DESC
        `;
        let params = [];

        if (busca) {
            querySql = `
                SELECT p.id, p.nome_produto, p.peso, p.preco, p.grupo_id, g.descricao_grupo 
                FROM produtos p 
                LEFT JOIN grupos g ON p.grupo_id = g.id 
                WHERE p.nome_produto ILIKE $1 OR g.descricao_grupo ILIKE $1
                ORDER BY p.id DESC
            `;
            params = [`%${busca}%`];
;
        }

        const resultado = await pool.query(querySql, params);
        res.render('produtos', { 
            produtos: resultado.rows, 
            usuario: req.session.usuario,
            busca: busca 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao buscar produtos.');
    }
});

// Rota GET: Exibe formulário de novo produto preenchendo a lista de grupos para o <select>
app.get('/produtos/novo', verificarAutenticacao, async (req, res) => {
    try {
        const gruposResultado = await pool.query('SELECT * FROM grupos ORDER BY descricao_grupo ASC');
        res.render('novo-produto', { 
            grupos: gruposResultado.rows, 
            usuario: req.session.usuario 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao carregar formulário de produtos.');
    }
});

// Rota POST: Insere produto com a chave estrangeira grupo_id
app.post('/produtos/novo', verificarAutenticacao, async (req, res) => {
    const { nome_produto, peso, preco, grupo_id } = req.body;
    
    // Tratamento para salvar NULL caso nenhum grupo tenha sido selecionado
    const idGrupoFinal = grupo_id ? parseInt(grupo_id) : null;

    try {
        await pool.query(
            'INSERT INTO produtos (nome_produto, peso, preco, grupo_id) VALUES ($1, $2, $3, $4)',
            [nome_produto, peso, preco, idGrupoFinal]
        );
        res.redirect('/produtos');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao cadastrar produto.');
    }
});

// Rota GET: Exibe formulário de edição com o produto e a lista de grupos para pré-seleção
app.get('/produtos/editar/:id', verificarAutenticacao, async (req, res) => {
    const { id } = req.params;

    try {
        const produtoRes = await pool.query('SELECT * FROM produtos WHERE id = $1', [id]);
        const gruposRes = await pool.query('SELECT * FROM grupos ORDER BY descricao_grupo ASC');
        
        if (produtoRes.rows.length === 0) {
            return res.status(404).send('Produto não encontrado.');
        }

        res.render('editar-produto', { 
            produto: produtoRes.rows[0], 
            grupos: gruposRes.rows,
            usuario: req.session.usuario 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao buscar dados para edição.');
    }
});

// Rota POST: Atualiza produto incluindo grupo_id
app.post('/produtos/editar/:id', verificarAutenticacao, async (req, res) => {
    const { id } = req.params;
    const { nome_produto, peso, preco, grupo_id } = req.body;

    const idGrupoFinal = grupo_id ? parseInt(grupo_id) : null;

    try {
        await pool.query(
            'UPDATE produtos SET nome_produto = $1, peso = $2, preco = $3, grupo_id = $4 WHERE id = $5',
            [nome_produto, peso, preco, idGrupoFinal, id]
        );
        res.redirect('/produtos');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao atualizar produto.');
    }
});

// Rota GET: Deleta produto
app.get('/produtos/deletar/:id', verificarAutenticacao, async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM produtos WHERE id = $1', [id]);
        res.redirect('/produtos');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao deletar produto.');
    }
});

app.get('/', (req, res) => {
    res.redirect('/produtos');
});

app.listen(3000, () => {
    console.log('Servidor SSR Relacional rodando em http://localhost:3000');
});