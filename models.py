from typing import Optional
from sqlmodel import SQLModel, Field

class Cliente(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nome: str
    status: Optional[str] = "ativo"

class Projeto(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nome: str
    status: Optional[str] = "em andamento"
    cliente_id: int

class SubProjeto(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nome: str
    status: Optional[str] = "pendente"
    projeto_id: int
    progresso: int = 0
    observacao: Optional[str] = None

class Tarefa(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nome: str
    concluida: bool = False
    subprojeto_id: int
