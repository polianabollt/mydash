async function carregarClienteDashboard(clienteId) {
  const res = await fetch(`${API_URL}/api/dashboard/${clienteId}`);
  const data = await res.json();

  const container = document.getElementById("dashboard");
  container.innerHTML = "";

  const divCliente = document.createElement("div");
  divCliente.className = "cliente";
  divCliente.innerText = data.nome;
  container.appendChild(divCliente);

  const divConteudo = document.createElement("div");
  divConteudo.className = "conteudo";

  for (const projeto of data.projetos) {
    const tituloProjeto = document.createElement("h3");
    tituloProjeto.innerText = projeto.nome;
    divConteudo.appendChild(tituloProjeto);

    for (const sub of projeto.subprojetos) {
      const divSub = document.createElement("div");
      divSub.className = "subprojeto";
      
      // Ícone de alerta se tiver observação
      const alertaBtn = sub.observacao
        ? `<button onclick="mostrarObservacao(\`${sub.observacao}\`)">🔔</button>`
        : "";

      divSub.innerHTML = `
        ${sub.nome} ${alertaBtn}
        <div class="barra">
          <div class="progresso" style="width: ${sub.progresso}%"></div>
        </div>
        <div style="text-align:right; font-size: 12px;">${sub.progresso}%</div>
      `;

      const ul = document.createElement("ul");
      ul.style.marginLeft = "1rem";

      const tarefasRes = await fetch(`${API_URL}/tarefas/${sub.id}`);
      const tarefas = await tarefasRes.json();

      tarefas.forEach(tarefa => {
        const li = document.createElement("li");
        li.innerHTML = tarefa.concluida
          ? `<s>✔ ${tarefa.nome}</s>`
          : `☐ ${tarefa.nome}`;
        ul.appendChild(li);
      });

      divSub.appendChild(ul);
      divConteudo.appendChild(divSub);
    }
  }

  container.appendChild(divConteudo);
}
 
function mostrarObservacao(texto) {
  Swal.fire({
    icon: "info",
    title: "Observação",
    text: texto
  });
}
