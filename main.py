from fastapi import FastAPI, Depends
from sqlmodel import Session, select
from database import create_db_and_tables, get_session
from models import Cliente, Projeto, SubProjeto
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

import os
app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

# Rota principal que serve o index.html
@app.get("/")
def get_index():
    return FileResponse(os.path.join("static", "index.html"))


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

@app.get("/projetos/")
def listar_projetos(session: Session = Depends(get_session)):
    return session.exec(select(Projeto)).all()

@app.post("/projetos/")
def criar_projeto(projeto: Projeto, session: Session = Depends(get_session)):
    cliente = session.get(Cliente, projeto.cliente_id)
    if not cliente:
        return {"erro": "Cliente não encontrado"}
    
    session.add(projeto)
    session.commit()
    session.refresh(projeto)
    return projeto

@app.get("/subprojetos/")
def listar_subprojetos(session: Session = Depends(get_session)):
    return session.exec(select(SubProjeto)).all()

@app.post("/subprojetos/")
def criar_subprojeto(subprojeto: SubProjeto, session: Session = Depends(get_session)):
    projeto = session.get(Projeto, subprojeto.projeto_id)
    if not projeto:
        return {"erro": "Projeto não encontrado"}

    session.add(subprojeto)
    session.commit()
    session.refresh(subprojeto)
    return subprojeto


@app.get("/dashboard")
def dashboard(session: Session = Depends(get_session)):
    data = []
    clientes = session.exec(select(Cliente)).all()

    for cliente in clientes:
        cliente_data = {
            "id": cliente.id,
            "nome": cliente.nome,
            "projetos": []
        }

        projetos = session.exec(select(Projeto).where(Projeto.cliente_id == cliente.id)).all()

        for projeto in projetos:
            projeto_data = {
                "id": projeto.id,
                "nome": projeto.nome,
                "subprojetos": []
            }

            subprojetos = session.exec(select(SubProjeto).where(SubProjeto.projeto_id == projeto.id)).all()

            for sub in subprojetos:
                projeto_data["subprojetos"].append({
                    "id": sub.id,
                    "nome": sub.nome,
                    "progresso": sub.progresso
                })

            cliente_data["projetos"].append(projeto_data)

        data.append(cliente_data)

    return data
