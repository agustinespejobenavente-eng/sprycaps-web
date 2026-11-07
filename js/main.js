/* SpryCaps · lista de espera. JS mínimo, sin dependencias, sin cookies ni almacenamiento. */
(function () {
  "use strict";

  var form = document.getElementById("waitlist-form");
  if (!form) return;

  var emailInput = document.getElementById("email");
  var consentInput = document.getElementById("consent");
  var emailError = document.getElementById("email-error");
  var consentError = document.getElementById("consent-error");
  var formError = document.getElementById("form-error");
  var success = document.getElementById("form-success");
  var button = document.getElementById("submit-btn");
  var title = document.getElementById("titulo-cierre");
  var section = document.getElementById("lista-de-espera");

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var NOT_CONNECTED = /\/f\/x{8}$/i.test(form.getAttribute("action") || "");
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Los botones "Unirme a la lista de espera" llevan al mismo formulario. */
  Array.prototype.forEach.call(document.querySelectorAll("a.cta"), function (link) {
    link.addEventListener("click", function (event) {
      if (!section || !title) return;
      event.preventDefault();
      section.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      title.focus({ preventScroll: true });
    });
  });

  function show(el, message) { el.textContent = message; el.hidden = false; }
  function hide(el) { el.textContent = ""; el.hidden = true; }

  function clearErrors() {
    hide(emailError); hide(consentError); hide(formError);
    emailInput.removeAttribute("aria-invalid");
    consentInput.removeAttribute("aria-invalid");
  }

  function validate() {
    var firstInvalid = null;
    var email = emailInput.value.trim();
    if (!email) {
      show(emailError, "Escribe tu correo para unirte a la lista.");
      emailInput.setAttribute("aria-invalid", "true");
      firstInvalid = emailInput;
    } else if (!EMAIL_RE.test(email)) {
      show(emailError, "Revisa tu correo: parece que le falta algo (por ejemplo, nombre@correo.cl).");
      emailInput.setAttribute("aria-invalid", "true");
      firstInvalid = emailInput;
    }
    if (!consentInput.checked) {
      show(consentError, "Marca la casilla para aceptar que guardemos tu correo.");
      consentInput.setAttribute("aria-invalid", "true");
      if (!firstInvalid) firstInvalid = consentInput;
    }
    return firstInvalid;
  }

  function finish(ok) {
    button.disabled = false;
    button.textContent = "Unirme a la lista de espera";
    if (ok) {
      form.hidden = true;
      success.hidden = false;
      success.focus();
    }
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    clearErrors();

    var invalid = validate();
    if (invalid) { invalid.focus(); return; }

    if (NOT_CONNECTED) {
      show(formError, "La lista de espera todavía no está conectada. Vuelve a intentarlo pronto.");
      return;
    }

    button.disabled = true;
    button.textContent = "Enviando…";

    var data = new FormData();
    data.append("email", emailInput.value.trim());
    data.append("consentimiento", "si");

    var controller = "AbortController" in window ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, 15000) : null;

    fetch(form.getAttribute("action"), {
      method: "POST",
      body: data,
      headers: { Accept: "application/json" },
      signal: controller ? controller.signal : undefined
    })
      .then(function (response) {
        if (timer) clearTimeout(timer);
        if (response.ok) { finish(true); return; }
        finish(false);
        show(formError, "No pudimos guardar tu correo. Revisa que esté bien escrito e inténtalo de nuevo.");
      })
      .catch(function () {
        if (timer) clearTimeout(timer);
        finish(false);
        show(formError, "No pudimos enviar tu correo. Revisa tu conexión e inténtalo de nuevo.");
      });
  });

  emailInput.addEventListener("input", function () { hide(emailError); emailInput.removeAttribute("aria-invalid"); });
  consentInput.addEventListener("change", function () { hide(consentError); consentInput.removeAttribute("aria-invalid"); });
})();
