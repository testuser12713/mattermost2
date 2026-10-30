/* Mockup behaviour only: live search in the menu, form validation, delete, caret.
   The product itself implements these as React components. */
(function () {
  "use strict";

  // Menu search: case-insensitive substring filter on the title.
  document.querySelectorAll(".menu").forEach(function (menu) {
    var input = menu.querySelector("[data-menu-search]");
    if (!input) return;
    var items = Array.prototype.slice.call(menu.querySelectorAll(".menu__list > li"));
    var empty = menu.querySelector(".menu__empty");
    function run() {
      var q = input.value.trim().toLowerCase();
      var hits = 0;
      items.forEach(function (li) {
        var match = !q || li.textContent.toLowerCase().indexOf(q) !== -1;
        li.hidden = !match;
        if (match) hits++;
      });
      if (empty) empty.hidden = hits > 0;
    }
    input.addEventListener("input", run);
    run();
  });

  // Template form: errors only after typing or a save attempt.
  document.querySelectorAll("form.template-form").forEach(function (form) {
    var fields = Array.prototype.slice.call(form.querySelectorAll("[data-field]"));

    function check(field) {
      var input = field.querySelector("input, textarea");
      var max = parseInt(input.dataset.max, 10);
      var len = input.value.length;
      var counter = field.querySelector(".field__counter");
      var error = field.querySelector(".field__error");
      var problem = null;
      if (!input.value.trim()) problem = input.dataset.msgEmpty;
      else if (len > max) problem = input.dataset.msgLong;
      counter.textContent = len + "/" + max;
      counter.classList.toggle("is-over", len > max);
      var show = field.dataset.touched === "true" && problem;
      field.classList.toggle("field--invalid", !!show);
      input.setAttribute("aria-invalid", show ? "true" : "false");
      error.textContent = show ? problem : "";
      error.hidden = !show;
      return !problem;
    }

    fields.forEach(function (field) {
      field.querySelector("input, textarea").addEventListener("input", function () {
        field.dataset.touched = "true";
        check(field);
      });
      check(field);
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var ok = true;
      fields.forEach(function (field) {
        field.dataset.touched = "true";
        if (!check(field)) ok = false;
      });
      if (ok && form.dataset.success) window.location.href = form.dataset.success;
    });
  });

  // Delete removes the entry straight away (no dialog in the specification).
  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-delete]");
    if (!button) return;
    var item = button.closest("li");
    var list = item.parentNode;
    item.remove();
    var count = list.querySelectorAll(":scope > li:not(.template--editing)").length;
    document.querySelectorAll("[data-template-count]").forEach(function (el) { el.textContent = count; });
  });

  // Caret behind inserted text, focus stays in the textbox.
  document.querySelectorAll("textarea[data-caret]").forEach(function (area) {
    var pos = parseInt(area.dataset.caret, 10);
    area.focus({ preventScroll: true });
    area.setSelectionRange(pos, pos);
  });

  // Narrow screens: bring the active settings tab into view inside its own scroller.
  var nav = document.querySelector(".settings-nav");
  var active = nav && nav.querySelector('[aria-selected="true"]');
  if (nav && active && nav.scrollWidth > nav.clientWidth) {
    nav.scrollLeft = active.offsetLeft - 16;
  }
})();
