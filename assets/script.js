"use strict";

document.documentElement.classList.add("js-enabled");

// Progressive enhancement: content, links, and experience details also work without JS.
const themeButton = document.querySelector(".theme-toggle");
let storedTheme;
try { storedTheme = localStorage.getItem("eugene-theme"); } catch { /* Storage is optional. */ }

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const isLight = theme === "light";
  themeButton?.setAttribute("aria-label", `Switch to ${isLight ? "dark" : "light"} theme`);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", isLight ? "#f5f5ef" : "#111410");
}

setTheme(storedTheme === "light" ? "light" : "dark");
if (themeButton) {
  themeButton.hidden = false;
  themeButton.addEventListener("click", () => {
    const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    setTheme(theme);
    try { localStorage.setItem("eugene-theme", theme); } catch { /* Keep the current theme in memory. */ }
  });
}

const header = document.querySelector(".site-header");
const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector(".main-nav");
function closeMenu() {
  if (!header || !menuButton) return;
  header.dataset.menuOpen = "false";
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Open navigation");
}

if (menuButton && header && nav) {
  menuButton.hidden = false;
  menuButton.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") !== "true";
    header.dataset.menuOpen = String(open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", `${open ? "Close" : "Open"} navigation`);
  });
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
      closeMenu();
      menuButton.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (!header.contains(event.target)) closeMenu();
  });
  window.matchMedia("(min-width: 1001px)").addEventListener("change", closeMenu);
}

// Native details remain usable without JavaScript or when reduced motion is requested.
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
document.querySelectorAll(".experience-item, .project-item").forEach((details) => {
  const summary = details.querySelector("summary");
  let animation = null;
  let targetOpen = details.open;

  summary.addEventListener("click", (event) => {
    if (reducedMotion.matches || typeof details.animate !== "function") return;
    event.preventDefault();
    const startHeight = details.getBoundingClientRect().height;
    targetOpen = !targetOpen;
    animation?.cancel();
    details.open = true;
    details.style.height = "auto";

    const borderHeight = details.offsetHeight - details.clientHeight;
    const endHeight = targetOpen ? details.getBoundingClientRect().height : summary.getBoundingClientRect().height + borderHeight;
    details.style.height = `${startHeight}px`;
    details.style.overflow = "hidden";
    animation = details.animate(
      [{ height: `${startHeight}px` }, { height: `${endHeight}px` }],
      { duration: 280, easing: "cubic-bezier(.2,.7,.3,1)" },
    );
    animation.onfinish = () => {
      details.open = targetOpen;
      details.style.height = "";
      details.style.overflow = "";
      animation = null;
    };
  });

  // Keep the target state in sync when the browser toggles details without animation.
  details.addEventListener("toggle", () => {
    if (!animation) targetOpen = details.open;
  });
});

const filters = document.querySelector(".tool-filters");
const tools = [...document.querySelectorAll(".tool-item")];
if (filters) {
  const subfilterRow = document.querySelector(".tool-subfilter-row");
  const subfilters = document.querySelector(".tool-subfilters");
  const status = document.querySelector("#tool-filter-status");
  const emptyState = document.querySelector(".tool-empty-state");
  const activities = {
    recon: [["passive", "Passive reconnaissance"], ["active", "Active scanning"]],
    web: [["proxy", "Interception & proxying"], ["sqli", "SQL injection"]],
    exploitation: [["frameworks", "Frameworks"], ["authentication", "Authentication testing"], ["passwords", "Password auditing"]],
    ad: [["enumeration", "Enumeration & attack paths"]],
    forensics: [["acquisition", "Acquisition"], ["disk", "Disk analysis"], ["memory", "Memory analysis"]],
    reversing: [["static", "Static analysis"]],
    code: [["scripting", "Scripting"], ["infrastructure", "IT infrastructure"]],
  };
  let category = "all";
  let activity = "all";

  function updateTools() {
    let count = 0;
    tools.forEach((tool) => {
      const matchesCategory = category === "all" || tool.dataset.category === category;
      const matchesActivity = activity === "all" || tool.dataset.subcategory === activity;
      tool.hidden = !(matchesCategory && matchesActivity);
      if (!tool.hidden) count += 1;
    });
    status.textContent = `Showing ${count} of ${tools.length} ${tools.length === 1 ? "tool" : "tools"}.`;
    emptyState.hidden = count > 0;
    emptyState.querySelector("p").textContent = category === "recon" && activity === "passive"
      ? "No passive reconnaissance tools listed yet."
      : "No tools listed in this group yet.";
  }

  function renderActivities() {
    subfilters.replaceChildren();
    const options = activities[category];
    subfilterRow.hidden = !options;
    if (!options) return;
    [["all", "All activities"], ...options].forEach(([value, label]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.activity = value;
      button.textContent = label;
      button.setAttribute("aria-pressed", String(value === activity));
      subfilters.append(button);
    });
  }

  filters.hidden = false;
  filters.querySelector('[data-filter="all"] span').textContent = tools.length;
  filters.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-filter]");
    if (!button) return;
    category = button.dataset.filter;
    activity = "all";
    filters.querySelectorAll("button").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    renderActivities();
    updateTools();
  });
  subfilters.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-activity]");
    if (!button) return;
    activity = button.dataset.activity;
    subfilters.querySelectorAll("button").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    updateTools();
  });
}

if ("IntersectionObserver" in window) {
  const sectionLinks = [...document.querySelectorAll('.main-nav a[href^="#"]')];
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      sectionLinks.forEach((link) => {
        if (link.getAttribute("href") === `#${entry.target.id}`) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    });
  }, { rootMargin: "-15% 0px -60% 0px", threshold: 0 });
  sectionLinks.forEach((link) => {
    const section = document.querySelector(link.getAttribute("href"));
    if (section) observer.observe(section);
  });
}
