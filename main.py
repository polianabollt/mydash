from fastapi import FastAPI, Depends
from sqlmodel import Session, select
from database import create_db_and_tables, get_session
from models import Cliente, Projeto, SubProjeto, Tarefa
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse 

import os
app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

# Rota principal que serve o index.html
@app.get("/")
def get_index():
    return FileResponse(os.path.join("static", "index.html"))

@app.get("/admin")
def get_admin():
    return FileResponse(os.path.join("static", "admin.html"))

@app.get("/dashboard/cliente/{cliente_id}", response_class=FileResponse)
def get_cliente_html(cliente_id: int):
    return FileResponse(os.path.join("static", "cliente.html"))



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

@app.put("/clientes/{cliente_id}")
def atualizar_cliente(cliente_id: int, cliente: Cliente, session: Session = Depends(get_session)):
    db_cliente = session.get(Cliente, cliente_id)
    if not db_cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    db_cliente.nome = cliente.nome
    session.add(db_cliente)
    session.commit()
    session.refresh(db_cliente)
    return db_cliente

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

@app.put("/projetos/{projeto_id}")
def atualizar_projeto(projeto_id: int, projeto: Projeto, session: Session = Depends(get_session)):
    db_projeto = session.get(Projeto, projeto_id)
    if not db_projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    db_projeto.nome = projeto.nome
    db_projeto.cliente_id = projeto.cliente_id
    session.add(db_projeto)
    session.commit()
    session.refresh(db_projeto)
    return db_projeto

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

@app.put("/subprojetos/{subprojeto_id}")
def atualizar_subprojeto(subprojeto_id: int, subprojeto: SubProjeto, session: Session = Depends(get_session)):
    db_sub = session.get(SubProjeto, subprojeto_id)
    if not db_sub:
        raise HTTPException(status_code=404, detail="Subprojeto não encontrado")

    db_sub.nome = subprojeto.nome
    db_sub.progresso = subprojeto.progresso
    db_sub.projeto_id = subprojeto.projeto_id
    db_sub.observacao = subprojeto.observacao
    session.add(db_sub)
    session.commit()
    session.refresh(db_sub)
    return db_sub


@app.get("/dashboard")
def dashboard(session: Session = Depends(get_session)):
    data = []
    clientes = session.exec(select(Cliente)).all()

    for cliente in clientes:
        cliente_data = {
            "id": cliente.id,
            "nome": cliente.nome,
            "projetos": [],
            'status': cliente.status
        }

        projetos = session.exec(select(Projeto).where(Projeto.cliente_id == cliente.id)).all()

        for projeto in projetos:
            projeto_data = {
                "id": projeto.id,
                "nome": projeto.nome,
                "subprojetos": [],
                'status': projeto.status
            }

            subprojetos = session.exec(select(SubProjeto).where(SubProjeto.projeto_id == projeto.id)).all()

            for sub in subprojetos:
                projeto_data["subprojetos"].append({
                    "id": sub.id,
                    "nome": sub.nome,
                    "progresso": sub.progresso,
                    'status': sub.status,
                    "observacao": sub.observacao 
                })

            cliente_data["projetos"].append(projeto_data)

        data.append(cliente_data)

    return data



#delete
@app.delete("/projetos/{id}")
def deletar_projeto(id: int, session: Session = Depends(get_session)):
    projeto = session.get(Projeto, id)
    if not projeto:
        return {"erro": "Projeto não encontrado"}

    session.delete(projeto)
    session.commit()
    return {"mensagem": "Projeto excluído"}

@app.delete("/subprojetos/{id}")
def deletar_subprojeto(id: int, session: Session = Depends(get_session)):
    sub = session.get(SubProjeto, id)
    if not sub:
        return {"erro": "Subprojeto não encontrado"}

    session.delete(sub)
    session.commit()
    return {"mensagem": "Subprojeto excluído"}

@app.delete("/clientes/{id}")
def deletar_cliente(id: int, session: Session = Depends(get_session)):
    cliente = session.get(Cliente, id)
    if not cliente:
        return {"erro": "Cliente não encontrado"}

    session.delete(cliente)
    session.commit()
    return {"mensagem": "Cliente excluído"}


@app.get("/tarefas/{subprojeto_id}")
def listar_tarefas(subprojeto_id: int, session: Session = Depends(get_session)):
    return session.exec(select(Tarefa).where(Tarefa.subprojeto_id == subprojeto_id)).all()

@app.post("/tarefas/")
def criar_tarefa(tarefa: Tarefa, session: Session = Depends(get_session)):
    session.add(tarefa)
    session.commit()
    session.refresh(tarefa)
    return tarefa

@app.put("/tarefas/{id}")
def atualizar_tarefa(id: int, tarefa: Tarefa, session: Session = Depends(get_session)):
    tarefa_db = session.get(Tarefa, id)
    if not tarefa_db:
        return {"erro": "Tarefa não encontrada"}

    tarefa_db.nome = tarefa.nome
    tarefa_db.concluida = tarefa.concluida
    session.commit()
    session.refresh(tarefa_db)
    return tarefa_db

@app.delete("/tarefas/{id}")
def deletar_tarefa(id: int, session: Session = Depends(get_session)):
    tarefa = session.get(Tarefa, id)
    if not tarefa:
        return {"erro": "Tarefa não encontrada"}

    session.delete(tarefa)
    session.commit()
    return {"mensagem": "Tarefa excluída"}


@app.get("/api/dashboard/{cliente_id}")
def dashboard_cliente(cliente_id: int, session: Session = Depends(get_session)):
    cliente = session.get(Cliente, cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

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
                "progresso": sub.progresso,
                "observacao": sub.observacao 
            })

        cliente_data["projetos"].append(projeto_data)

    return cliente_data
