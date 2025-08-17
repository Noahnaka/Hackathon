const Banco = require('./Banco');

class UserData {
    constructor() {
        this._localizacao = ''; 
        this._telefone = ''; 
        this._nome = ''; 
    }



    async save_data() {
        const conexao = Banco.getConexao(); 
        const SQL = 'INSERT INTO tbl_dados_usuario (telefone, localizacao, nome) VALUES (?, ?, ?);'; 
        try {
            const [result] = await conexao.promise().execute(SQL, [this._telefone, this._localizacao, this._nome]); 
            return result.affectedRows > 0; 
        } catch (error) {
            console.error('Erro ao criar o usuario:', error); 
            return false; 
        }
    }


    get localizacao() {
        return this._localizacao;
    }
    
    set localizacao(localizacao) {
        this._localizacao = localizacao;
    }

    get telefone() {
        return this._telefone;
    }
    
    set telefone(telefone) {
        this._telefone = telefone;
    }

    get nome() {
        return this._nome;
    }
    
    set nome(nome) {
        this._nome = nome;
    }
}

module.exports = UserData;
