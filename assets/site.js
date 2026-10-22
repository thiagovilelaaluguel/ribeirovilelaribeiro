// Endereço do perfil do escritório no Instagram. Enquanto estiver vazio,
// o botão "Seguir no Instagram" fica escondido.
const INSTAGRAM = "";

(function () {
  const botao = document.querySelector(".menu-btn");
  const menu = document.getElementById("menu");

  function fechar() {
    menu.classList.remove("aberto");
    botao.setAttribute("aria-expanded", "false");
    botao.setAttribute("aria-label", "Abrir menu");
  }

  botao.addEventListener("click", function () {
    const abrir = !menu.classList.contains("aberto");
    menu.classList.toggle("aberto", abrir);
    botao.setAttribute("aria-expanded", String(abrir));
    botao.setAttribute("aria-label", abrir ? "Fechar menu" : "Abrir menu");
  });
  menu.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", fechar); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") fechar(); });

  if (INSTAGRAM) {
    document.querySelectorAll("[data-instagram]").forEach(function (a) {
      a.href = INSTAGRAM;
      a.hidden = false;
    });
  }

  document.querySelectorAll("[data-ano]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
