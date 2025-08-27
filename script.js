document.addEventListener("DOMContentLoaded", () => {
  // --- DEFINIÇÕES GLOBAIS ---
  const STORAGE_KEYS = {
    ELEITORES: "eleitores_v8",
    NAO_PERMITIDOS: "nao_permitidos_v8",
    HISTORICO: "historico_votacao_v8",
    APP_STATE: "app_state_v8",
  };

  // --- SELETORES DO DOM ---
  const settingsFieldset = document.getElementById("settings-fieldset");
  const eleitoresFieldset = document.getElementById("eleitores-fieldset");
  const naoPermitidosFieldset = document.getElementById(
    "nao-permitidos-fieldset"
  );
  const eleitorForm = document.getElementById("eleitor-form");
  const eleitorProntuarioInput = document.getElementById("eleitor-prontuario");
  const eleitorNomeInput = document.getElementById("eleitor-nome");
  const eleitoresTableBody = document.querySelector("#eleitores-table tbody");
  const importEleitoresInput = document.getElementById(
    "import-eleitores-input"
  );
  const importEleitoresBtn = document.getElementById("import-eleitores-btn");
  const downloadTemplateBtn = document.getElementById("download-template-btn");
  const naoPermitidoForm = document.getElementById("nao-permitido-form");
  const eleitorToBlockSelect = document.getElementById(
    "eleitor-to-block-select"
  );
  const naoPermitidosList = document.getElementById("nao-permitidos-list");
  const toggleVotingBtn = document.getElementById("toggle-voting-btn");
  const votacaoForm = document.getElementById("votacao-form");
  const eleitorSelect = document.getElementById("eleitor-select");
  const representanteSelect = document.getElementById("representante-select");
  const nullVoteBtn = document.getElementById("null-vote-btn");
  const blankVoteBtn = document.getElementById("blank-vote-btn");
  const absentVoteBtn = document.getElementById("absent-vote-btn");
  const totalEleitoresSpan = document.getElementById("total-eleitores");
  const totalVotosSpan = document.getElementById("total-votos");
  const totalAusentesSpan = document.getElementById("total-ausentes");
  const totalNulosSpan = document.getElementById("total-nulos");
  const totalBrancosSpan = document.getElementById("total-brancos");
  const resultsChartCanvas = document
    .getElementById("results-chart")
    .getContext("2d");
  const downloadReportBtn = document.getElementById("download-report-btn");
  const tieBreakerSection = document.getElementById("tie-breaker-section");
  const tiedCandidatesList = document.getElementById("tied-candidates-list");
  const tieBreakerBtn = document.getElementById("tie-breaker-btn");
  const tieBreakerResult = document.getElementById("tie-breaker-result");
  const resetBtn = document.getElementById("reset-btn");
  const themeToggleBtn = document.getElementById("theme-toggle-btn");
  const statusMessage = document.getElementById("status-message");
  const allowNullVotesCheckbox = document.getElementById("allow-null-votes");
  const allowBlankVotesCheckbox = document.getElementById("allow-blank-votes");
  const allowAbsentVotersCheckbox = document.getElementById(
    "allow-absent-voters"
  );
  const backgroundColorPicker = document.getElementById(
    "background-color-picker"
  );
  const backgroundOpacitySlider = document.getElementById(
    "background-opacity-slider"
  );
  let resultsChart = null;

  // --- ESTADO DA APLICAÇÃO ---
  let AppState = {};
  const defaultState = {
    eleitores: [],
    naoPermitidos: [],
    historico: [],
    tiedCandidates: [],
    settings: { allowNull: false, allowBlank: false, allowAbsent: false },
    votingActive: false,
    ui: {
      theme: "light",
      backgroundColor: "#FFFFFF",
      backgroundOpacity: 0.85,
    },
  };

  // --- FUNÇÕES DE ESTADO E UTILITÁRIAS ---
  const loadState = () => {
    const savedEleitores =
      JSON.parse(localStorage.getItem(STORAGE_KEYS.ELEITORES)) || [];
    const savedNaoPermitidos =
      JSON.parse(localStorage.getItem(STORAGE_KEYS.NAO_PERMITIDOS)) || [];
    const savedHistorico =
      JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORICO)) || [];
    const savedAppState =
      JSON.parse(localStorage.getItem(STORAGE_KEYS.APP_STATE)) || {};
    AppState = {
      ...defaultState,
      ...savedAppState,
      eleitores: savedEleitores,
      naoPermitidos: savedNaoPermitidos,
      historico: savedHistorico,
      settings: { ...defaultState.settings, ...savedAppState.settings },
      ui: { ...defaultState.ui, ...savedAppState.ui },
    };
  };

  const saveState = () => {
    localStorage.setItem(
      STORAGE_KEYS.ELEITORES,
      JSON.stringify(AppState.eleitores)
    );
    localStorage.setItem(
      STORAGE_KEYS.NAO_PERMITIDOS,
      JSON.stringify(AppState.naoPermitidos)
    );
    localStorage.setItem(
      STORAGE_KEYS.HISTORICO,
      JSON.stringify(AppState.historico)
    );
    const appStateToSave = {
      settings: AppState.settings,
      votingActive: AppState.votingActive,
      ui: AppState.ui,
    };
    localStorage.setItem(
      STORAGE_KEYS.APP_STATE,
      JSON.stringify(appStateToSave)
    );
  };

  const showMessage = (message, type = "success") => {
    statusMessage.textContent = message;
    statusMessage.className = `status-message status-${type}`;
    setTimeout(
      () => {
        statusMessage.className = "hidden";
      },
      type === "error" ? 6000 : 4000
    );
  };

  const renderAll = () => {
    renderSettings();
    renderEleitores();
    renderNaoPermitidos();
    renderVotacao();
    updateDashboard();
    updateVotingStateUI();
  };

  // --- LÓGICA DE UI (TEMA, BACKGROUND, ESTADO DA VOTAÇÃO) ---
  const applyTheme = () =>
    document.body.classList.toggle("dark-mode", AppState.ui.theme === "dark");

  const hexToRgb = (hex) => {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(
          result[3],
          16
        )}`
      : null;
  };

  const applyBackground = () => {
    const rgb = hexToRgb(AppState.ui.backgroundColor);
    if (rgb) {
      const overlayColor = `rgba(${rgb}, ${AppState.ui.backgroundOpacity})`;
      document.documentElement.style.setProperty(
        "--overlay-color",
        overlayColor
      );
    }
  };

  const updateVotingStateUI = () => {
    const isVoting = AppState.votingActive;
    settingsFieldset.disabled = isVoting;
    eleitoresFieldset.disabled = isVoting;
    naoPermitidosFieldset.disabled = isVoting;
    toggleVotingBtn.textContent = isVoting
      ? "Encerrar Votação"
      : "Iniciar Votação";
    toggleVotingBtn.className = isVoting ? "end-btn" : "start-btn";
    votacaoForm.classList.toggle("hidden", !isVoting);
  };

  // --- GERENCIAR ELEITORES E IMPORTAÇÃO ---
  const renderEleitores = () => {
    eleitoresTableBody.innerHTML = "";
    AppState.eleitores
      .sort((a, b) => a.nome.localeCompare(b.nome))
      .forEach((eleitor) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${eleitor.prontuario}</td><td>${eleitor.nome}</td><td><button class="action-btn delete-btn" data-prontuario="${eleitor.prontuario}">Excluir</button></td>`;
        eleitoresTableBody.appendChild(tr);
      });
  };

  // --- GERENCIAR NÃO PERMITIDOS ---
  const renderNaoPermitidos = () => {
    eleitorToBlockSelect.innerHTML =
      '<option value="">Selecione para bloquear...</option>';
    AppState.eleitores
      .sort((a, b) => a.nome.localeCompare(b.nome))
      .forEach((eleitor) => {
        if (
          !AppState.naoPermitidos.some(
            (np) => np.prontuario === eleitor.prontuario
          )
        ) {
          eleitorToBlockSelect.add(
            new Option(
              `${eleitor.nome} (${eleitor.prontuario})`,
              eleitor.prontuario
            )
          );
        }
      });
    naoPermitidosList.innerHTML = "";
    AppState.naoPermitidos
      .sort((a, b) => a.nome.localeCompare(b.nome))
      .forEach((np) => {
        const li = document.createElement("li");
        li.innerHTML = `${np.nome} (${np.prontuario}) <button class="action-btn delete-btn" data-prontuario="${np.prontuario}">Remover</button>`;
        naoPermitidosList.appendChild(li);
      });
  };

  // --- REALIZAR VOTAÇÃO ---
  const renderVotacao = () => {
    const eleitoresQueNaoVotaram = AppState.eleitores.filter(
      (el) =>
        !AppState.historico.some(
          (voto) => voto.eleitorProntuario === el.prontuario
        )
    );
    eleitorSelect.innerHTML = '<option value="">Selecione...</option>';
    eleitoresQueNaoVotaram
      .sort((a, b) => a.nome.localeCompare(b.nome))
      .forEach((el) =>
        eleitorSelect.add(
          new Option(`${el.nome} (${el.prontuario})`, el.prontuario)
        )
      );
    const candidatosValidos = AppState.eleitores.filter(
      (el) =>
        !AppState.naoPermitidos.some((np) => np.prontuario === el.prontuario)
    );
    representanteSelect.innerHTML = '<option value="">Selecione...</option>';
    candidatosValidos
      .sort((a, b) => a.nome.localeCompare(b.nome))
      .forEach((cand) =>
        representanteSelect.add(new Option(cand.nome, cand.prontuario))
      );
  };

  const registrarVoto = (eleitorProntuario, votoProntuario) => {
    const eleitor = AppState.eleitores.find(
      (el) => el.prontuario === eleitorProntuario
    );
    AppState.historico.push({
      eleitorProntuario,
      votoProntuario,
      timestamp: new Date().toISOString(),
    });
    saveState();
    renderAll();
    votacaoForm.reset();
    showMessage(
      votoProntuario === "AUSENTE"
        ? `${eleitor.nome} foi marcado(a) como ausente.`
        : `Voto de ${eleitor.nome} registrado com sucesso!`
    );
  };

  // --- PAINEL DE RESULTADOS, DESEMPATE E RELATÓRIO ---
  const updateDashboard = () => {
    const votos = AppState.historico;
    totalEleitoresSpan.textContent = AppState.eleitores.length;
    totalVotosSpan.textContent = votos.filter(
      (v) => v.votoProntuario !== "AUSENTE"
    ).length;
    totalAusentesSpan.textContent = votos.filter(
      (v) => v.votoProntuario === "AUSENTE"
    ).length;
    totalNulosSpan.textContent = votos.filter(
      (v) => v.votoProntuario === "NULO"
    ).length;
    totalBrancosSpan.textContent = votos.filter(
      (v) => v.votoProntuario === "BRANCO"
    ).length;

    const voteCounts = {};
    const candidatosValidos = AppState.eleitores.filter(
      (el) =>
        !AppState.naoPermitidos.some((np) => np.prontuario === el.prontuario)
    );
    candidatosValidos.forEach((cand) => {
      voteCounts[cand.nome] = 0;
    });
    votos.forEach((voto) => {
      const candidatoVotado = candidatosValidos.find(
        (cand) => cand.prontuario === voto.votoProntuario
      );
      if (candidatoVotado) voteCounts[candidatoVotado.nome]++;
    });

    if (resultsChart) resultsChart.destroy();
    resultsChart = new Chart(resultsChartCanvas, {
      type: "bar",
      data: {
        labels: Object.keys(voteCounts),
        datasets: [
          {
            label: "Votos",
            data: Object.values(voteCounts),
            backgroundColor: "rgba(13, 110, 253, 0.7)",
          },
        ],
      },
      options: { scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } },
    });

    const voteValues = Object.values(voteCounts).filter((v) => v > 0);
    if (voteValues.length > 0) {
      const maxVotes = Math.max(...voteValues);
      AppState.tiedCandidates = Object.entries(voteCounts)
        .filter(([, votes]) => votes === maxVotes)
        .map(([nome]) => nome);
      const isTie = AppState.tiedCandidates.length > 1;
      tieBreakerSection.classList.toggle("hidden", !isTie);
      if (isTie) {
        tiedCandidatesList.innerHTML = `<strong>Candidatos Empatados:</strong> ${AppState.tiedCandidates.join(
          ", "
        )}`;
        tieBreakerResult.classList.add("hidden");
      }
    } else {
      tieBreakerSection.classList.add("hidden");
    }
  };

  // --- CONFIGURAÇÕES ---
  const renderSettings = () => {
    allowNullVotesCheckbox.checked = AppState.settings.allowNull;
    allowBlankVotesCheckbox.checked = AppState.settings.allowBlank;
    allowAbsentVotersCheckbox.checked = AppState.settings.allowAbsent;
    nullVoteBtn.classList.toggle("hidden", !AppState.settings.allowNull);
    blankVoteBtn.classList.toggle("hidden", !AppState.settings.allowBlank);
    absentVoteBtn.classList.toggle("hidden", !AppState.settings.allowAbsent);
  };

  // --- EVENT LISTENERS ---
  const setupEventListeners = () => {
    themeToggleBtn.addEventListener("click", () => {
      AppState.ui.theme = AppState.ui.theme === "light" ? "dark" : "light";
      applyTheme();
      saveState();
    });

    backgroundColorPicker.addEventListener("input", (e) => {
      AppState.ui.backgroundColor = e.target.value;
      applyBackground();
      saveState();
    });

    backgroundOpacitySlider.addEventListener("input", (e) => {
      AppState.ui.backgroundOpacity = e.target.value;
      applyBackground();
      saveState();
    });

    allowNullVotesCheckbox.addEventListener("change", (e) => {
      AppState.settings.allowNull = e.target.checked;
      saveState();
      renderSettings();
    });
    allowBlankVotesCheckbox.addEventListener("change", (e) => {
      AppState.settings.allowBlank = e.target.checked;
      saveState();
      renderSettings();
    });
    allowAbsentVotersCheckbox.addEventListener("change", (e) => {
      AppState.settings.allowAbsent = e.target.checked;
      saveState();
      renderSettings();
    });

    toggleVotingBtn.addEventListener("click", () => {
      if (AppState.votingActive) {
        if (
          confirm(
            "Tem certeza que deseja encerrar a votação? Após encerrada, não será possível registrar novos votos."
          )
        ) {
          AppState.votingActive = false;
          showMessage("Votação encerrada.", "info");
        }
      } else {
        if (AppState.eleitores.length < 2) {
          return showMessage(
            "É necessário cadastrar pelo menos 2 eleitores para iniciar a votação.",
            "error"
          );
        }
        AppState.votingActive = true;
        showMessage(
          "Votação iniciada! As configurações e cadastros foram bloqueados.",
          "success"
        );
      }
      saveState();
      updateVotingStateUI();
    });

    eleitorForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const prontuario = eleitorProntuarioInput.value.trim().toUpperCase();
      const nome = eleitorNomeInput.value.trim();
      if (!prontuario || !nome)
        return showMessage("Prontuário e Nome são obrigatórios.", "error");
      if (AppState.eleitores.some((el) => el.prontuario === prontuario))
        return showMessage("Erro: Prontuário já cadastrado.", "error");
      AppState.eleitores.push({ prontuario, nome });
      saveState();
      renderAll();
      eleitorForm.reset();
      eleitorProntuarioInput.focus();
      showMessage("Eleitor adicionado com sucesso!");
    });

    eleitoresTableBody.addEventListener("click", (e) => {
      if (e.target.classList.contains("delete-btn")) {
        const prontuario = e.target.dataset.prontuario;
        if (
          confirm(
            `Tem certeza que deseja excluir o eleitor com prontuário ${prontuario}?`
          )
        ) {
          AppState.eleitores = AppState.eleitores.filter(
            (el) => el.prontuario !== prontuario
          );
          AppState.naoPermitidos = AppState.naoPermitidos.filter(
            (np) => np.prontuario !== prontuario
          );
          saveState();
          renderAll();
          showMessage("Eleitor excluído com sucesso.");
        }
      }
    });

    downloadTemplateBtn.addEventListener("click", () => {
      const sampleData = [{ Prontuário: "SP123456", Nome: "Exemplo Aluno Um" }];
      const worksheet = XLSX.utils.json_to_sheet(sampleData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Eleitores");
      XLSX.writeFile(workbook, "Modelo_Importacao_Eleitores.xlsx");
    });

    importEleitoresBtn.addEventListener("click", () => {
      const file = importEleitoresInput.files[0];
      if (!file)
        return showMessage(
          "Por favor, selecione um arquivo para importar.",
          "error"
        );
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const json = XLSX.utils.sheet_to_json(
            workbook.Sheets[workbook.SheetNames[0]]
          );
          let importedCount = 0,
            skippedCount = 0;
          json.forEach((row) => {
            const prontuario = row.Prontuário?.toString().trim().toUpperCase();
            const nome = row.Nome?.toString().trim();
            if (prontuario && nome) {
              if (
                !AppState.eleitores.some((el) => el.prontuario === prontuario)
              ) {
                AppState.eleitores.push({ prontuario, nome });
                importedCount++;
              } else {
                skippedCount++;
              }
            }
          });
          if (importedCount > 0) {
            saveState();
            renderAll();
            showMessage(
              `${importedCount} eleitores importados. ${skippedCount} duplicados foram ignorados.`,
              "success"
            );
          } else {
            showMessage(
              skippedCount > 0
                ? `Nenhum eleitor novo importado. ${skippedCount} já existiam.`
                : "Nenhum eleitor válido encontrado no arquivo.",
              "info"
            );
          }
        } catch (error) {
          showMessage("Erro ao ler o arquivo. Verifique o formato.", "error");
        } finally {
          importEleitoresInput.value = "";
        }
      };
      reader.readAsArrayBuffer(file);
    });

    naoPermitidoForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const prontuario = eleitorToBlockSelect.value;
      if (!prontuario) return;
      const eleitor = AppState.eleitores.find(
        (el) => el.prontuario === prontuario
      );
      if (eleitor) {
        AppState.naoPermitidos.push(eleitor);
        saveState();
        renderAll();
        showMessage(
          `${eleitor.nome} foi adicionado à lista de não permitidos.`
        );
      }
    });

    naoPermitidosList.addEventListener("click", (e) => {
      if (e.target.classList.contains("delete-btn")) {
        const prontuario = e.target.dataset.prontuario;
        AppState.naoPermitidos = AppState.naoPermitidos.filter(
          (np) => np.prontuario !== prontuario
        );
        saveState();
        renderAll();
        showMessage("Eleitor removido da lista de não permitidos.");
      }
    });

    votacaoForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const eleitorProntuario = eleitorSelect.value;
      const votoProntuario = representanteSelect.value;
      if (!eleitorProntuario || !votoProntuario)
        return showMessage("Selecione o eleitor e o candidato.", "error");
      registrarVoto(eleitorProntuario, votoProntuario);
    });

    nullVoteBtn.addEventListener("click", () => {
      const el = eleitorSelect.value;
      if (!el) return showMessage("Selecione o eleitor.", "error");
      registrarVoto(el, "NULO");
    });
    blankVoteBtn.addEventListener("click", () => {
      const el = eleitorSelect.value;
      if (!el) return showMessage("Selecione o eleitor.", "error");
      registrarVoto(el, "BRANCO");
    });
    absentVoteBtn.addEventListener("click", () => {
      const el = eleitorSelect.value;
      if (!el) return showMessage("Selecione o eleitor.", "error");
      registrarVoto(el, "AUSENTE");
    });

    tieBreakerBtn.addEventListener("click", () => {
      const winner =
        AppState.tiedCandidates[
          Math.floor(Math.random() * AppState.tiedCandidates.length)
        ];
      tieBreakerResult.innerHTML = `🎉 O vencedor por sorteio é: <strong>${winner}</strong>! 🎉`;
      tieBreakerResult.classList.remove("hidden");
      showMessage(`Sorteio realizado! O vencedor é ${winner}.`);
    });

    downloadReportBtn.addEventListener("click", () => {
      const sumarioData = [
        {
          "Total de Eleitores": AppState.eleitores.length,
          "Total de Votos": AppState.historico.filter(
            (v) => v.votoProntuario !== "AUSENTE"
          ).length,
          Ausentes: AppState.historico.filter(
            (v) => v.votoProntuario === "AUSENTE"
          ).length,
          "Votos Nulos": AppState.historico.filter(
            (v) => v.votoProntuario === "NULO"
          ).length,
          "Votos em Branco": AppState.historico.filter(
            (v) => v.votoProntuario === "BRANCO"
          ).length,
        },
      ];
      const resultados = {};
      AppState.historico.forEach((v) => {
        resultados[v.votoProntuario] = (resultados[v.votoProntuario] || 0) + 1;
      });
      const resultadosData = Object.entries(resultados)
        .map(([p, q]) => {
          let n = "Voto Inválido";
          if (p === "NULO") n = "VOTO NULO";
          else if (p === "BRANCO") n = "VOTO EM BRANCO";
          else if (p !== "AUSENTE") {
            const c = AppState.eleitores.find((el) => el.prontuario === p);
            if (c) n = c.nome;
          }
          return { Candidato: n, Votos: q };
        })
        .filter((i) => i.Candidato !== "Voto Inválido");
      const participacaoData = AppState.historico.map((v) => {
        const el = AppState.eleitores.find(
          (e) => e.prontuario === v.eleitorProntuario
        );
        let cN = "-",
          s = "Inválido";
        if (v.votoProntuario === "NULO") s = "Nulo";
        else if (v.votoProntuario === "BRANCO") s = "Em Branco";
        else if (v.votoProntuario === "AUSENTE") s = "Ausente";
        else {
          const c = AppState.eleitores.find(
            (e) => e.prontuario === v.votoProntuario
          );
          if (c) {
            cN = c.nome;
            s = "Voto Válido";
          }
        }
        return {
          "Prontuário Eleitor": el?.prontuario || "N/A",
          "Nome Eleitor": el?.nome || "N/A",
          "Voto Para (Nome)": cN,
          Status: s,
          Horário: new Date(v.timestamp).toLocaleString("pt-BR"),
        };
      });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(sumarioData),
        "Sumário"
      );
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(resultadosData),
        "Resultados"
      );
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(participacaoData),
        "Registro de Participação"
      );
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(
          AppState.eleitores.map((el) => ({
            Prontuário: el.prontuario,
            Nome: el.nome,
          }))
        ),
        "Lista de Eleitores"
      );
      XLSX.writeFile(wb, "Relatorio_Completo_Votacao.xlsx");
    });

    resetBtn.addEventListener("click", () => {
      if (
        confirm("ATENÇÃO! Você tem certeza que deseja apagar TODOS os dados?")
      ) {
        if (
          confirm("CONFIRMAÇÃO FINAL: Realmente deseja limpar todo o sistema?")
        ) {
          Object.values(STORAGE_KEYS).forEach((key) =>
            localStorage.removeItem(key)
          );
          location.reload();
        }
      }
    });
  };

  // --- INICIALIZAÇÃO ---
  const initializeApp = () => {
    loadState();
    backgroundColorPicker.value = AppState.ui.backgroundColor;
    backgroundOpacitySlider.value = AppState.ui.backgroundOpacity;
    applyTheme();
    applyBackground();
    renderAll();
    setupEventListeners();
  };

  initializeApp();
});
