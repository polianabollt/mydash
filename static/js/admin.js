document.addEventListener("DOMContentLoaded", () => {
  carregarClientes();
  carregarProjetos();

  // CLIENTE
  document.getElementById("form-cliente").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nome = document.getElementById("nome-cliente").value;
    const status = document.getElementById("status-cliente").value;
    await fetch(`${API_URL}/clientes/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, status })
    });
    document.getElementById("form-cliente").reset();
    carregarClientes();
  });


  // PROJETO
  document.getElementById("form-projeto").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nome = document.getElementById("nome-projeto").value;
    const cliente_id = parseInt(document.getElementById("cliente-id").value);
    const status = document.getElementById("status-projeto").value;
    await fetch(`${API_URL}/projetos/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, cliente_id, status })
    });
    document.getElementById("nome-projeto").value = "";
    carregarProjetos();
  });

  // SUBPROJETO
  document.getElementById("form-subprojeto").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nome = document.getElementById("nome-subprojeto").value;
    const progresso = parseInt(document.getElementById("progresso-subprojeto").value);
    const projeto_id = parseInt(document.getElementById("projeto-id").value);
    const observacao = document.getElementById("observacao-subprojeto").value;
    const statusSub = document.getElementById("status-subprojeto").value;

   const res = await fetch(`${API_URL}/subprojetos/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: nome,
        progresso: progresso,
        projeto_id: projeto_id,
        observacao: observacao,
        status: statusSub
      })
    });

    if (res.ok) {
      document.getElementById("form-subprojeto").reset();
      carregarProjetos();
    } 
  });
});

async function carregarClientes() {
  const res = await fetch(`${API_URL}/clientes/`);
  const data = await res.json();

  const ul = document.getElementById("lista-clientes");
  ul.innerHTML = "";
  const select = document.getElementById("cliente-id");
  select.innerHTML = "<option value=''>Selecione um cliente</option>";
  data.forEach(cliente => {
    ul.innerHTML += `
      <li>
        ${cliente.nome} (Status : ${cliente.status})
        <button onclick="editarCliente(${cliente.id}, '${cliente.nome}', '${cliente.status || 'ativo'}')">✏️</button>
      </li>`;
    select.innerHTML += `<option value="${cliente.id}">${cliente.nome}</option>`;
  });
}
async function carregarProjetos() {
  const resProjetos = await fetch(`${API_URL}/projetos/`);
  const projetos = await resProjetos.json();

  const resSub = await fetch(`${API_URL}/subprojetos/`);
  const subprojetos = await resSub.json();

  const ul = document.getElementById("lista-projetos");
  ul.innerHTML = "";

  const select = document.getElementById("projeto-id");
  select.innerHTML = "<option value=''>Selecione um projeto</option>";

  projetos.forEach(proj => {
    const li = document.createElement("li");
    const titulo = document.createElement("strong");
    titulo.textContent = proj.nome;

    const botao = document.createElement("button");
    botao.innerText = "✏️";
    botao.onclick = () => editarProjeto(proj.id, proj.nome, proj.cliente_id, proj.status || 'não iniciado');

    const excluirBtn = document.createElement("button");
    excluirBtn.innerText = "🗑";
    excluirBtn.onclick = () => excluirProjeto(proj.id);

    const subUl = document.createElement("ul");
    subUl.id = `subprojetos-${proj.id}`;

    li.appendChild(titulo);
    li.append(` (Cliente ID: ${proj.cliente_id}) `);
    li.appendChild(botao);
    li.appendChild(excluirBtn);
    li.appendChild(subUl);
    ul.appendChild(li);

    select.innerHTML += `<option value="${proj.id}">${proj.nome}</option>`;
  });

  subprojetos.forEach(async sub => {
    const container = document.getElementById(`subprojetos-${sub.projeto_id}`);
    if (container) {
      const subLi = document.createElement("li");
      subLi.style.marginLeft = "1rem";
      subLi.innerHTML = `
        <div>
          <strong>${sub.nome}</strong> - ${sub.progresso}%
          <button onclick="editarSubprojeto(${sub.id}, '${sub.nome}', ${sub.progresso}, ${sub.projeto_id}, \`${sub.observacao || ""}\`, '${sub.status || 'não iniciado'}')">✏️</button>

          <button onclick="excluirSubprojeto(${sub.id})">🗑</button>
          <ul id="tarefas-${sub.id}"></ul>
          <input type="text" id="nova-tarefa-${sub.id}" placeholder="Nova tarefa">
          <button onclick="criarTarefa(${sub.id})">➕</button>
        </div>
      `;

      container.appendChild(subLi);
      document
        .getElementById(`nova-tarefa-${sub.id}`)
        .addEventListener("keyup", function (event) {
          if (event.key === "Enter") {
            criarTarefa(sub.id);
          }
        });

      await carregarTarefas(sub.id);
    }
  });
}

// editar cliente com SweetAlert2
async function editarCliente(id, nomeAtual, statusAtual) {
  const { value: formValues } = await Swal.fire({
    title: 'Editar Cliente',
    html: `
      <input id="edit-nome-cliente" class="swal2-input" placeholder="Nome" value="${nomeAtual}">
      <select id="edit-status-cliente" class="swal2-input">
        <option value="ativo" ${statusAtual === 'ativo' ? 'selected' : ''}>Ativo</option>
        <option value="inativo" ${statusAtual === 'inativo' ? 'selected' : ''}>Inativo</option>
        <option value="pendente" ${statusAtual === 'pendente' ? 'selected' : ''}>Pendente</option>
      </select>
    `,
    focusConfirm: false,
    showCancelButton: true,
    preConfirm: () => {
      return {
        nome: document.getElementById("edit-nome-cliente").value,
        status: document.getElementById("edit-status-cliente").value
      };
    }
  });

  if (formValues) {
    await fetch(`${API_URL}/clientes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, nome: formValues.nome, status: formValues.status })
    });
    carregarClientes();
  }
}


// editar projeto com SweetAlert2
async function editarProjeto(id, nomeAtual, clienteId, statusAtual) {
  const { value: formValues } = await Swal.fire({
    title: 'Editar Projeto',
    html: `
      <input id="edit-nome-projeto" class="swal2-input" placeholder="Nome" value="${nomeAtual}">
      <select id="edit-status-projeto" class="swal2-input">
        <option value="não iniciado" ${statusAtual === 'não iniciado' ? 'selected' : ''}>Não iniciado</option>
        <option value="em andamento" ${statusAtual === 'em andamento' ? 'selected' : ''}>Em andamento</option>
        <option value="finalizado" ${statusAtual === 'finalizado' ? 'selected' : ''}>Finalizado</option>
      </select>
    `,
    focusConfirm: false,
    showCancelButton: true,
    preConfirm: () => {
      return {
        nome: document.getElementById("edit-nome-projeto").value,
        status: document.getElementById("edit-status-projeto").value
      };
    }
  });

  if (formValues) {
    await fetch(`${API_URL}/projetos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, nome: formValues.nome, cliente_id: clienteId, status: formValues.status })
    });
    carregarProjetos();
  }
}


// editar subprojeto com SweetAlert2
async function editarSubprojeto(id, nome, progresso, projeto_id, observacao = "", statusAtual) {
  const { value: formValues } = await Swal.fire({
    title: "Editar Subprojeto",
    html: `
      <input id="edit-nome-sub" class="swal2-input" placeholder="Nome" value="${nome}">
      <input id="edit-progresso-sub" class="swal2-input" type="number" min="0" max="100" placeholder="Progresso" value="${progresso}">
      <input id="edit-projeto-id" class="swal2-input" type="number" placeholder="Projeto ID" value="${projeto_id}">
      <textarea id="edit-observacao-sub" class="swal2-textarea" placeholder="Observações">${observacao || ""}</textarea>
      <select id="edit-status-sub" class="swal2-input">
        <option value="não iniciado" ${statusAtual === 'não iniciado' ? 'selected' : ''}>Não iniciado</option>
        <option value="em andamento com caféead" ${statusAtual === 'em andamento com caféead' ? 'selected' : ''}>Em andamento com caféead</option>
        <option value="com o cliente" ${statusAtual === 'com o cliente' ? 'selected' : ''}>Com o cliente</option>
        <option value="em finalização" ${statusAtual === 'em finalização' ? 'selected' : ''}>Em finalização</option>
        <option value="finalizado" ${statusAtual === 'finalizado' ? 'selected' : ''}>Finalizado</option>
      </select>
    `,
    focusConfirm: false,
    showCancelButton: true,
    preConfirm: () => {
      return {
        nome: document.getElementById("edit-nome-sub").value,
        progresso: parseInt(document.getElementById("edit-progresso-sub").value),
        projeto_id: parseInt(document.getElementById("edit-projeto-id").value),
        observacao: document.getElementById("edit-observacao-sub").value,
        status: document.getElementById("edit-status-sub").value
      };
    }
  });

  if (formValues) {
    await fetch(`${API_URL}/subprojetos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formValues)
    });
    carregarProjetos();
  }
}



// Excluir projeto
async function excluirProjeto(id) {
  const confirm = await Swal.fire({
    title: "Tem certeza?",
    text: "Isso excluirá o projeto e todos os subprojetos relacionados!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sim, excluir!",
    cancelButtonText: "Cancelar"
  });

  if (confirm.isConfirmed) {
    await fetch(`${API_URL}/projetos/${id}`, { method: "DELETE" });
    carregarProjetos();
  }
}

// Excluir subprojeto
async function excluirSubprojeto(id) {
  const confirm = await Swal.fire({
    title: "Excluir subprojeto?",
    text: "Esta ação é irreversível.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sim, excluir!",
    cancelButtonText: "Cancelar"
  });

  if (confirm.isConfirmed) {
    await fetch(`${API_URL}/subprojetos/${id}`, { method: "DELETE" });
    carregarProjetos();
  }
}


async function carregarTarefas(subprojeto_id) {
  const ul = document.getElementById(`tarefas-${subprojeto_id}`);
  if (!ul) return;

  ul.innerHTML = "";

  const res = await fetch(`${API_URL}/tarefas/${subprojeto_id}`);
  const tarefas = await res.json();

  tarefas.forEach(t => {
    const li = document.createElement("li");
    li.innerHTML = `
      <label>
        <input type="checkbox" ${t.concluida ? "checked" : ""} onchange="toggleTarefa(${t.id}, this.checked)">
        ${t.nome}
      </label>
      <button onclick="excluirTarefa(${t.id}, ${subprojeto_id})">🗑️</button>
    `;
    ul.appendChild(li);
  });
}

async function criarTarefa(subprojeto_id) {
  const input = document.getElementById(`nova-tarefa-${subprojeto_id}`);
  const nome = input.value.trim();
  if (!nome) return;

  await fetch(`${API_URL}/tarefas/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, subprojeto_id, concluida: false })
  });

  input.value = "";
  carregarTarefas(subprojeto_id);
}

async function toggleTarefa(id, concluida) {
  await fetch(`${API_URL}/tarefas/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, concluida, nome: "..." }) // nome será sobrescrito na próxima função
  });
}

async function excluirTarefa(id, subprojeto_id) {
  await fetch(`${API_URL}/tarefas/${id}`, { method: "DELETE" });
  carregarTarefas(subprojeto_id);
}
