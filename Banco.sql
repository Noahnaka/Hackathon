create schema hackathon;

create table hackathon.tbl_dados_usuario(
    id int primary key auto_increment,
    telefone varchar(255) not null,
    localizacao varchar(255) not null,
    pontos int not null,
    timestamp timestamp
);