async function carregarDashboard() {
  const res = await fetch(`${API_URL}/dashboard`);
  const data = await res.json();
  console.log('atualizou');
  const container = document.getElementById("dashboard");
  container.innerHTML = "";

  for (const cliente of data) {
    const divCliente = document.createElement("div");
    divCliente.className = "cliente";
    const spanStatus = document.createElement("span");
    const clienteStatusClass = (cliente.status || '').toLowerCase().replace(/\s+/g, '-');
    spanStatus.className = `status status-${clienteStatusClass}`;
    spanStatus.innerText = cliente.status || '';
    divCliente.innerHTML = `<strong>${cliente.nome}</strong> `;
    divCliente.appendChild(spanStatus);

    divCliente.onclick = () => {
      const conteudo = divCliente.nextElementSibling;
      conteudo.style.display = conteudo.style.display === "block" ? "none" : "block";
    };

    const divConteudo = document.createElement("div");
    divConteudo.className = "conteudo";

    for (const projeto of cliente.projetos) {
      const tituloProjeto = document.createElement("h3");
      const projStatusSpan = document.createElement("span");
      const projStatusClass = (projeto.status || '').toLowerCase().replace(/\s+/g, '-');
      projStatusSpan.className = `status status-${projStatusClass}`;
      projStatusSpan.innerText = projeto.status || '';
      tituloProjeto.innerHTML = `${projeto.nome} `;
      tituloProjeto.appendChild(projStatusSpan);
      divConteudo.appendChild(tituloProjeto);

      for (const sub of projeto.subprojetos) {
        const divSub = document.createElement("div");
        divSub.className = "subprojeto";
        const subStatusClass = (sub.status || '').toLowerCase().replace(/\s+/g, '-');
        let html = `${sub.nome} <span class="status status-${subStatusClass}">${sub.status || ''}</span>`;

        if (sub.observacao) {
          html += ` <button onclick="mostrarObservacao('${sub.observacao.replace(/'/g, "\\'")}')">🔔</button>`;
        }

        html += `
          <div class="barra">
            <div class="progresso" style="width: ${sub.progresso}%"></div>
          </div>
          <div style="text-align:right; font-size: 12px;">${sub.progresso}%</div>
        `;

        divSub.innerHTML = html;

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

    container.appendChild(divCliente);
    container.appendChild(divConteudo);
  }
}
carregarDashboard();