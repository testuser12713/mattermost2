/* Mockup behaviour only: the real product wires these through React + Redux. */
(function () {
  "use strict";

  var TITLE_MAX = 40, TEXT_MAX = 1000, MAX_COUNT = 20;
  var input = document.getElementById("message-input");
  var toggle = document.querySelector("[data-menu-toggle]");
  var menu = document.getElementById("template-menu");
  var sendBtn = document.querySelector("[data-send]");

  function syncSend() {
    if (input && sendBtn) { sendBtn.disabled = input.value.trim() === ""; }
  }

  /* ---------- Template menu ---------- */
  function setMenu(open) {
    if (!menu || !toggle) { return; }
    menu.hidden = !open;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      var focusTarget = menu.querySelector("[data-menu-search]") || menu.querySelector(".menu-item") || menu.querySelector("a");
      if (focusTarget) { focusTarget.focus(); }
    }
  }

  if (toggle && menu) {
    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      setMenu(menu.hidden);
    });
    document.addEventListener("click", function (e) {
      if (!menu.hidden && !menu.contains(e.target)) { setMenu(false); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !menu.hidden) { setMenu(false); toggle.focus(); }
    });

    var search = menu.querySelector("[data-menu-search]");
    var note = menu.querySelector("[data-no-match]");
    var items = Array.prototype.slice.call(menu.querySelectorAll(".menu-item"));
    if (search) {
      search.addEventListener("input", function () {
        var q = search.value.toLowerCase();
        var visible = 0;
        items.forEach(function (btn) {
          var title = btn.querySelector(".menu-item-title").textContent.toLowerCase();
          var match = title.indexOf(q) !== -1;
          btn.parentNode.hidden = !match;
          if (match) { visible += 1; }
        });
        if (note) { note.hidden = visible !== 0; }
      });
    }

    /* Insert as plain text at the cursor, replacing a selection; no auto-send. */
    items.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var text = btn.getAttribute("data-text") || "";
        var start = input.selectionStart, end = input.selectionEnd;
        input.value = input.value.slice(0, start) + text + input.value.slice(end);
        var cursor = start + text.length;
        setMenu(false);
        input.focus();
        input.setSelectionRange(cursor, cursor);
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
    });
  }

  if (input) {
    input.addEventListener("input", syncSend);
    syncSend();
    if (input.hasAttribute("autofocus")) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }

  /* ---------- Send (plain text post) ---------- */
  var composer = document.querySelector("[data-composer]");
  var postList = document.querySelector(".post-list");
  if (composer && postList) {
    composer.addEventListener("submit", function (e) {
      e.preventDefault();
      if (input.value.trim() === "") { return; }
      var post = document.createElement("article");
      post.className = "post";
      var av = document.createElement("span");
      av.className = "avatar avatar-3"; av.textContent = "LF"; av.setAttribute("aria-hidden", "true");
      var body = document.createElement("div");
      body.className = "post-body";
      var meta = document.createElement("div");
      meta.className = "post-meta";
      var who = document.createElement("span");
      who.className = "post-author"; who.textContent = "Lena Fischer";
      var time = document.createElement("span");
      time.className = "post-time"; time.textContent = "now";
      meta.appendChild(who); meta.appendChild(time);
      var text = document.createElement("p");
      text.className = "post-text"; text.textContent = input.value;
      body.appendChild(meta); body.appendChild(text);
      post.appendChild(av); post.appendChild(body);
      postList.appendChild(post);
      input.value = "";
      syncSend();
      postList.scrollTop = postList.scrollHeight;
    });
  }

  /* ---------- Settings: delete ---------- */
  var list = document.querySelector("[data-template-list]");
  if (list) {
    var countEl = document.querySelector("[data-count]");
    var addBtn = document.querySelector("[data-add]");
    var limitAlert = document.querySelector("[data-limit-alert]");
    list.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-delete]");
      if (!btn) { return; }
      var row = btn.closest(".template-row");
      row.parentNode.removeChild(row);
      var n = list.querySelectorAll(".template-row").length;
      if (n === 0) { window.location.href = "settings-templates-empty.html"; return; }
      if (countEl) { countEl.textContent = n + " of " + MAX_COUNT + " templates"; }
      if (limitAlert) { limitAlert.hidden = true; }
      if (addBtn && n < MAX_COUNT) {
        addBtn.setAttribute("href", addBtn.getAttribute("data-href"));
        addBtn.classList.remove("is-disabled");
        addBtn.removeAttribute("aria-disabled");
        addBtn.removeAttribute("tabindex");
      }
    });
  }

  /* ---------- Settings: form validation ---------- */
  var form = document.querySelector("[data-template-form]");
  if (form) {
    var title = form.querySelector("[data-title]");
    var text = form.querySelector("[data-text]");
    var touched = { title: false, text: false };

    function check(field, key, max, requiredMsg, longMsg) {
      var len = field.value.length;
      var counter = form.querySelector("[data-counter='" + key + "']");
      var err = form.querySelector("[data-error='" + key + "']");
      counter.textContent = len + "/" + max;
      counter.classList.toggle("is-over", len > max);
      var msg = "";
      if (field.value.trim() === "") { msg = requiredMsg; }
      else if (len > max) { msg = longMsg; }
      var show = touched[key] && msg !== "";
      err.textContent = show ? msg : "";
      field.classList.toggle("is-invalid", show);
      if (show) { field.setAttribute("aria-invalid", "true"); } else { field.removeAttribute("aria-invalid"); }
      return msg === "";
    }
    function run() {
      var a = check(title, "title", TITLE_MAX, "Enter a title.", "Use at most " + TITLE_MAX + " characters for the title.");
      var b = check(text, "text", TEXT_MAX, "Enter the template text.", "Use at most " + TEXT_MAX + " characters for the text.");
      return a && b;
    }
    title.addEventListener("input", function () { touched.title = true; run(); });
    text.addEventListener("input", function () { touched.text = true; run(); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      touched.title = true; touched.text = true;
      if (run()) { window.location.href = "settings-templates-list.html"; }
    });
    /* Static states ship with their own error text; keep counters in sync only. */
    var pre = form.hasAttribute("data-prefilled-errors");
    if (pre) { touched.title = true; touched.text = true; }
    run();
  }
})();
