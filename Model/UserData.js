const Banco = require('./Banco');

class UserData {
    constructor() {
        this._localizacao = ''; 
        this._telefone = ''; 
        this._nome = ''; 
        this._pontos = ''; 
    }

    async update_data() {
        const conexao = Banco.getConexao(); 
        const SQL = 'UPDATE tbl_dados_usuario SET pontos = pontos + ? WHERE nome = ?;'; 
        try {
            const [result] = await conexao.promise().execute(SQL, [this._pontos, this._nome]); 
            return result.affectedRows > 0; 
        } catch (error) {
            console.error('Erro ao criar o usuario:', error); 
            return false; 
        }
    }

    async retrive_data() {
        const conexao = Banco.getConexao();
        const SQL = 'SELECT pontos, nome FROM tbl_dados_usuario;';
        try {
          const [rows] = await conexao.promise().execute(SQL);
          return rows.length > 0 ? rows : [];
        } catch (error) {
          console.error('Erro ao buscar eventos: ', error);
          return [];
        }
    }

    async save_data() {
        const conexao = Banco.getConexao(); 
        const SQL = 'INSERT INTO tbl_dados_usuario (telefone, localizacao, nome, pontos) VALUES (?, ?, ?, ?);'; 
        try {
            const [result] = await conexao.promise().execute(SQL, [this._telefone, this._localizacao, this._nome, this._pontos]); 
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

    get pontos() {
        return this._pontos;
    }
    
    set pontos(pontos) {
        this._pontos = pontos;
    }
}

module.exports = UserData;
