// Middleware de verificação de sessão (Exportação Nomeada ES6)
export function verificarAutenticacao(req, res, next) {
    // Verifica se a sessão existe e se o objeto usuario foi definido no login
    if (req.session && req.session.usuario) {
        return next(); // Permite o acesso à próxima função/rota
    }
    // Caso contrário, bloqueia e redireciona para a tela de login
    res.redirect('/login');
}
