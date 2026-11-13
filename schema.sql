-- 1. Criação da tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL
);

-- 2. Criação da tabela de Grupos de Produtos (Nova Tabela)
CREATE TABLE IF NOT EXISTS grupos (
    id SERIAL PRIMARY KEY,
    descricao_grupo VARCHAR(100) NOT NULL
);

-- 3. Criação da tabela de Produtos com a Chave Estrangeira 'grupo_id'
-- A cláusula REFERENCES estabelece o relacionamento N:1 com a tabela grupos.
-- ON DELETE SET NULL garante que, se um grupo for excluído, os produtos vinculados não serão apagados, apenas perderão o vínculo.
CREATE TABLE IF NOT EXISTS produtos (
    id SERIAL PRIMARY KEY,
    nome_produto VARCHAR(100) NOT NULL,
    peso NUMERIC(10, 2) NOT NULL,
    preco NUMERIC(10, 2) NOT NULL,
    grupo_id INT REFERENCES grupos(id) ON DELETE SET NULL
);

-- 4. Inserção do usuário administrador inicial
-- EXPLICAÇÃO DA CLÁUSULA 'ON CONFLICT (email) DO NOTHING':
-- Garante a IDEMPOTÊNCIA do script. Se a carga SQL for executada múltiplas vezes no banco,
-- o PostgreSQL ignora a inserção caso o e-mail já esteja cadastrado (devido à restrição UNIQUE), 
-- evitando erros de duplicação.
INSERT INTO usuarios (nome, email, senha) 
VALUES ('Administrador', 'admin@email.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQOEg6Lruj3vjPGga31lW')
ON CONFLICT (email) DO NOTHING;

-- 5. Inserção de grupos padrão para testes iniciais
INSERT INTO grupos (descricao_grupo) VALUES 
( 'Eletrônicos'),
( 'Periféricos'),
('Acessórios')
ON CONFLICT (id) DO NOTHING;

-- 6. Inserção de produtos vinculados aos grupos
INSERT INTO produtos (nome_produto, peso, preco, grupo_id) VALUES 
('Monitor UltraWide 29"', 4.20, 1299.00, 1),
('Teclado Mecânico RGB', 0.95, 280.00, 2),
('Mousepad Extra Large', 0.40, 65.00, 3)
ON CONFLICT DO NOTHING;