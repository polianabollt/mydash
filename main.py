from fastapi import FastAPI, Depends
from sqlmodel import Session, select
from database import create_db_and_tables, get_session
from models import Cliente, Projeto, SubProjeto

app = FastAPI()

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.get("/clientes/")
def listar_clientes(session: Session = Depends(get_session)):
    return session.exec(select(Cliente)).all()

@app.post("/clientes/")
def criar_cliente(cliente: Cliente, session: Session = Depends(get_session)):
    session.add(cliente)
    session.commit()
    session.refresh(cliente)
    return cliente
