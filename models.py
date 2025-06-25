from sqlmodel import SQLModel, Field

class Cliente(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    nome: str

class Projeto(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    nome: str
    cliente_id: int

class SubProjeto(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    nome: str
    projeto_id: int
    progresso: int = 0
