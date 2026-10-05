async function load() {
  const status = document.getElementById("status");
  const grid = document.getElementById("grid");
  const tbody = document.querySelector("#audit-table tbody");

  try {
    const res = await fetch("/api/dashboard");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    status.textContent = `SQLite-backed state · ${data.missions.length} mission(s) · ${data.agents.length} agents`;

    grid.innerHTML = "";

    const missionCard = document.createElement("div");
    missionCard.className = "card";
    const m = data.missions[0];
    missionCard.innerHTML = `
      <h3>Mission</h3>
      <p><strong>${m?.title ?? "—"}</strong></p>
      <p class="muted">State: <span class="pill active">${m?.state ?? "—"}</span></p>
      <p class="muted">Lead: ${m?.leadRef ?? "—"}</p>
      <p class="muted">Assigned: ${(m?.assignedAgentIds ?? []).length} agents</p>
    `;
    grid.appendChild(missionCard);

    for (const agent of data.agents) {
      const card = document.createElement("div");
      card.className = "card";
      const agentTasks = data.tasks.filter((t) => t.assigneeAgentId === agent.id);
      card.innerHTML = `
        <h3>${agent.name}</h3>
        <p class="muted">${agent.role}</p>
        <p><span class="pill ${agent.status === "active" ? "active" : ""}">${agent.status}</span></p>
        <p class="muted">${agentTasks.length} task(s)</p>
      `;
      grid.appendChild(card);
    }

    const approvalCard = document.createElement("div");
    approvalCard.className = "card";
    approvalCard.innerHTML = `
      <h3>Approvals</h3>
      <ul class="muted">
        ${data.approvals
          .map(
            (a) =>
              `<li>${a.actionType}: <strong>${a.status}</strong> — ${a.payloadSummary}</li>`,
          )
          .join("")}
      </ul>
    `;
    grid.appendChild(approvalCard);

    const connectorCard = document.createElement("div");
    connectorCard.className = "card";
    const c = data.connector;
    connectorCard.innerHTML = `
      <h3>Shopify connector</h3>
      <p class="muted">${c?.detail ?? "—"}</p>
      <p><span class="pill active">${c?.mode ?? "—"} · read-only</span></p>
    `;
    grid.appendChild(connectorCard);

    tbody.innerHTML = "";
    for (const ev of data.audit) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${ev.at}</td>
        <td>${ev.actionType}</td>
        <td>${ev.outcome}</td>
        <td>${ev.message}</td>
      `;
      tbody.appendChild(tr);
    }
  } catch (err) {
    status.textContent = `Failed to load state: ${err.message}`;
    status.style.color = "#9b2226";
  }
}

load();
