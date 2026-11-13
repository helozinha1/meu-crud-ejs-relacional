// Importação do bcrypt via padrão ES6 Modules
import bcrypt from 'bcrypt';

const senhaPlana = '123456';
const saltRounds = 10; // Custo de processamento para geração do Salt

async function gerarHashSenha() {
    try {
        // Gera o hash unidirecional com salt embutido
        const hash = await bcrypt.hash(senhaPlana, saltRounds);
        console.log('====================================================');
        console.log(`Senha Original em Texto Puro: ${senhaPlana}`);
        console.log(`Hash Seguro Gerado para o Banco: ${hash}`);
        console.log('====================================================');
    } catch (erro) {
        console.error('Erro ao gerar hash:', erro);
    }
}

// Executa a função demonstrativa
gerarHashSenha();