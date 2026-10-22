// Ribeiro, Vilela & Ribeiro · comportamento do site (sem bibliotecas).
(function () {
  const raiz = document.documentElement;

  function guardar(chave, valor) {
    try { valor === null ? localStorage.removeItem(chave) : localStorage.setItem(chave, valor); } catch (e) {}
  }

  // ---------- menu do celular ----------
  const botaoMenu = document.querySelector(".menu-btn");
  const menu = document.getElementById("menu");
  function fecharMenu() {
    menu.classList.remove("aberto");
    botaoMenu.setAttribute("aria-expanded", "false");
  }
  botaoMenu.addEventListener("click", function () {
    const abrir = !menu.classList.contains("aberto");
    menu.classList.toggle("aberto", abrir);
    botaoMenu.setAttribute("aria-expanded", String(abrir));
  });
  menu.querySelectorAll("a, [data-abrir]").forEach(function (el) { el.addEventListener("click", fecharMenu); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") fecharMenu(); });

  // ---------- painel de acessibilidade ----------
  const botaoAcess = document.querySelector("[data-acess-btn]");
  const painelAcess = document.getElementById("acess-painel");
  function fecharAcess() { painelAcess.hidden = true; botaoAcess.setAttribute("aria-expanded", "false"); }
  botaoAcess.addEventListener("click", function (e) {
    e.stopPropagation();
    const abrir = painelAcess.hidden;
    painelAcess.hidden = !abrir;
    botaoAcess.setAttribute("aria-expanded", String(abrir));
  });
  painelAcess.addEventListener("click", function (e) { e.stopPropagation(); });
  document.addEventListener("click", fecharAcess);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") fecharAcess(); });
  document.querySelector("[data-libras]").addEventListener("click", function () {
    const vw = document.querySelector("#vlibras-access-wrapper [role='button'], #vlibras-access-wrapper button, #vlibras-access-wrapper img, #vlibras-access-wrapper")
      || document.querySelector("[vw-access-button]");
    if (vw) vw.click();
    fecharAcess();
  });

  // ---------- tamanho do texto ----------
  const ESCALAS = [0.9, 1, 1.15, 1.3];
  function escalaAtual() { return parseFloat(getComputedStyle(raiz).getPropertyValue("--escala")) || 1; }
  document.querySelectorAll("[data-fonte]").forEach(function (b) {
    b.addEventListener("click", function () {
      const passo = Number(b.dataset.fonte);
      let i = ESCALAS.indexOf(escalaAtual());
      if (i < 0) i = 1;
      const nova = passo === 0 ? 1 : ESCALAS[Math.min(ESCALAS.length - 1, Math.max(0, i + passo))];
      raiz.style.setProperty("--escala", nova);
      guardar("rvr-escala", nova === 1 ? null : String(nova));
    });
  });

  // ---------- alto contraste ----------
  const botaoContraste = document.querySelector("[data-contraste-btn]");
  function marcarContraste() { botaoContraste.setAttribute("aria-pressed", String(raiz.hasAttribute("data-contraste"))); }
  marcarContraste();
  botaoContraste.addEventListener("click", function () {
    raiz.toggleAttribute("data-contraste");
    guardar("rvr-contraste", raiz.hasAttribute("data-contraste") ? "1" : null);
    marcarContraste();
  });

  // ---------- ouvir a página ----------
  const botaoOuvir = document.querySelector("[data-ouvir]");
  if (!("speechSynthesis" in window)) {
    botaoOuvir.hidden = true;
  } else {
    const rotuloOuvir = botaoOuvir.querySelector("span");
    function pararLeitura() {
      speechSynthesis.cancel();
      botaoOuvir.setAttribute("aria-pressed", "false");
      rotuloOuvir.textContent = "Ouvir esta página";
    }
    botaoOuvir.addEventListener("click", function () {
      if (speechSynthesis.speaking) { pararLeitura(); return; }
      // Lê o conteúdo principal; listas fechadas entram só pelo título.
      const partes = [];
      document.querySelectorAll("main h1, main h2, main h3, main p, main summary, main li").forEach(function (el) {
        if (el.closest("details:not([open])") && !el.matches("summary, summary *")) return;
        if (el.closest(".escondido") || el.offsetParent === null && !el.matches("summary")) return;
        const t = el.innerText.trim();
        if (t && partes[partes.length - 1] !== t) partes.push(t);
      });
      const vozes = speechSynthesis.getVoices();
      const voz = vozes.find(function (v) { return v.lang === "pt-BR"; }) || vozes.find(function (v) { return /^pt/.test(v.lang); });
      partes.forEach(function (t, i) {
        const fala = new SpeechSynthesisUtterance(t);
        fala.lang = "pt-BR";
        fala.rate = 0.95;
        if (voz) fala.voice = voz;
        if (i === partes.length - 1) fala.onend = pararLeitura;
        speechSynthesis.speak(fala);
      });
      botaoOuvir.setAttribute("aria-pressed", "true");
      rotuloOuvir.textContent = "Parar a leitura";
    });
    window.addEventListener("pagehide", function () { speechSynthesis.cancel(); });
  }

  // ---------- janelas ----------
  const janelaCliente = document.getElementById("janela-cliente");
  document.querySelectorAll('[data-abrir="cliente"]').forEach(function (b) {
    b.addEventListener("click", function () { janelaCliente.showModal(); });
  });

  const janelaSaida = document.getElementById("janela-saida");
  const irSaida = janelaSaida.querySelector("[data-saida-ir]");
  const dominioSaida = janelaSaida.querySelector("[data-saida-dominio]");
  document.querySelectorAll("a[data-externo]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      irSaida.href = a.href;
      dominioSaida.textContent = new URL(a.href).hostname;
      janelaSaida.showModal();
    });
  });
  irSaida.addEventListener("click", function () { setTimeout(function () { janelaSaida.close(); }, 100); });
  document.querySelectorAll("dialog.janela").forEach(function (j) {
    j.addEventListener("click", function (e) { // clique fora da janela fecha
      if (e.target !== j) return;
      const r = j.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) j.close();
    });
  });

  // ---------- mosaico: cada bloco abre a sua situação ----------
  const janelaMomento = document.getElementById("janela-momento");
  function abrirMomento(id) {
    janelaMomento.querySelectorAll(".momento-art").forEach(function (art) { art.hidden = art.id !== id; });
    janelaMomento.setAttribute("aria-labelledby", id + "-tit");
    const tit = janelaMomento.querySelector("#" + id + " h2");
    if (tit) tit.id = id + "-tit";
    janelaMomento.showModal();
    janelaMomento.scrollTop = 0;
  }
  document.querySelectorAll("[data-momento]").forEach(function (b) {
    b.addEventListener("click", function () { abrirMomento(b.dataset.momento); });
  });

  // ---------- busca "Como podemos ajudar?" ----------
  const campo = document.getElementById("busca");
  if (campo) {
    const blocos = Array.from(document.querySelectorAll("button[data-momento]"));
    const perguntas = Array.from(document.querySelectorAll("#duvidas details"));
    const resultado = document.querySelector("[data-busca-resultado]");
    const normal = function (s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
    const texto = function (el) { return normal((el.dataset.busca || "") + " " + el.innerText); };
    const textosBlocos = blocos.map(texto);
    const textosPerguntas = perguntas.map(function (el) { return normal((el.dataset.busca || "") + " " + el.querySelector("summary").innerText); });
    let espera;

    function buscar(abrir) {
      // Compara pelo começo da palavra, para "negaram" achar "negado" e "doente" achar "doença".
      const termos = normal(campo.value).split(/\s+/).filter(function (t) { return t.length > 1; })
        .map(function (t) { return t.length > 5 ? t.slice(0, Math.max(4, t.length - 3)) : t; });
      const bate = function (txt) { return termos.some(function (t) { return txt.indexOf(t) >= 0; }); };
      let primeiroBloco = null, primeiraPergunta = null, achados = 0;

      blocos.forEach(function (el, i) {
        const ok = termos.length > 0 && bate(textosBlocos[i]);
        el.classList.toggle("achado", ok);
        el.classList.toggle("apagado", termos.length > 0 && !ok);
        if (ok) { achados++; if (!primeiroBloco) primeiroBloco = el; }
      });
      perguntas.forEach(function (el, i) {
        const ok = termos.length === 0 || bate(textosPerguntas[i]);
        el.classList.toggle("escondido", !ok);
        if (ok && termos.length) { achados++; if (!primeiraPergunta) primeiraPergunta = el; }
      });

      if (!termos.length) { resultado.textContent = ""; return; }
      if (!achados) {
        resultado.innerHTML = 'Não achamos esse assunto aqui. <a href="https://wa.me/5582993278827" target="_blank" rel="noopener">Pergunte pelo WhatsApp</a>.';
        return;
      }
      resultado.textContent = achados === 1 ? "1 resultado encontrado logo abaixo." : achados + " resultados encontrados logo abaixo.";
      if (abrir) {
        if (primeiroBloco) abrirMomento(primeiroBloco.dataset.momento);
        else { primeiraPergunta.open = true; primeiraPergunta.scrollIntoView({ behavior: "smooth", block: "center" }); }
      }
    }
    campo.addEventListener("input", function () { clearTimeout(espera); espera = setTimeout(function () { buscar(false); }, 200); });
    document.querySelector("[data-busca-form]").addEventListener("submit", function (e) { e.preventDefault(); buscar(true); });
    document.querySelectorAll("[data-sugestao]").forEach(function (b) {
      b.addEventListener("click", function () { campo.value = b.dataset.sugestao; buscar(true); });
    });
  }

  // ---------- imprimir a lista da situação aberta ----------
  document.querySelectorAll("[data-imprimir]").forEach(function (b) {
    b.addEventListener("click", function () {
      const art = janelaMomento.querySelector(".momento-art:not([hidden])");
      let caixa = document.getElementById("impressao");
      if (!caixa) { caixa = document.createElement("div"); caixa.id = "impressao"; document.body.appendChild(caixa); }
      caixa.innerHTML = '<p>Ribeiro, Vilela &amp; Ribeiro Advogados Associados · (82) 99327-8827</p>' + art.innerHTML;
      janelaMomento.close();
      document.body.classList.add("imprimindo");
      window.print();
    });
  });
  window.addEventListener("afterprint", function () { document.body.classList.remove("imprimindo"); });

  // ---------- Libras (VLibras, do governo federal) ----------
  if (window.VLibras) {
    try { new window.VLibras.Widget("https://vlibras.gov.br/app"); } catch (e) {}
  }

  document.querySelectorAll("[data-ano]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
