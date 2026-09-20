const activitiesContainer = document.querySelector("#activities-list");
const navToggle = document.querySelector(".nav-toggle");
const siteHeader = document.querySelector(".site-header");

function syncHeaderHeight() {
  if (siteHeader && document.body.classList.contains("home-page")) {
    document.documentElement.style.setProperty("--header-height", `${siteHeader.getBoundingClientRect().height}px`);
  }
}

function setNavOpen(open, returnFocus = false) {
  if (!navToggle || !siteHeader) return;
  siteHeader.classList.toggle("nav-open", open);
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.textContent = open ? "閉じる" : "メニュー";
  syncHeaderHeight();
  if (returnFocus) navToggle.focus();
  updateCallBar();
}

if (navToggle && siteHeader) {
  navToggle.addEventListener("click", () => setNavOpen(navToggle.getAttribute("aria-expanded") !== "true"));
  document.querySelectorAll(".site-nav a").forEach((link) => {
    link.addEventListener("click", () => setNavOpen(false));
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && siteHeader.classList.contains("nav-open")) setNavOpen(false, true);
  });
  document.addEventListener("click", (event) => {
    if (siteHeader.classList.contains("nav-open") && !siteHeader.contains(event.target)) setNavOpen(false);
  });
  if ("ResizeObserver" in window) new ResizeObserver(syncHeaderHeight).observe(siteHeader);
  syncHeaderHeight();
}

// Keep the existing article navigation offset; the TOP uses one native CSS offset.
if (!document.body.classList.contains("home-page")) {
  document.querySelectorAll('.site-nav a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      const headerHeight = siteHeader?.offsetHeight || 0;
      const y = target.getBoundingClientRect().top + window.scrollY - headerHeight - 18;
      window.scrollTo({ top: Math.max(0, y), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      history.pushState(null, "", link.getAttribute("href"));
    });
  });
}

const callBar = document.querySelector(".home-page .mobile-call-bar");
const mobileQuery = window.matchMedia("(max-width: 640px)");
function updateCallBar() {
  if (!callBar) return;
  const headerBottom = siteHeader?.getBoundingClientRect().bottom || 0;
  const ctaVisible = Array.from(document.querySelectorAll("[data-call-cta]")).some((cta) => {
    const rect = cta.getBoundingClientRect();
    // Suppress the fixed bar before its own height could cover the inline button.
    return rect.top < window.innerHeight && rect.bottom > headerBottom;
  });
  const focusInBar = callBar.contains(document.activeElement);
  callBar.hidden = !mobileQuery.matches || Boolean(siteHeader?.classList.contains("nav-open")) || (ctaVisible && !focusInBar);
}
window.addEventListener("scroll", updateCallBar, { passive: true });
window.addEventListener("resize", updateCallBar);
document.addEventListener("focusin", updateCallBar);
mobileQuery.addEventListener("change", updateCallBar);
updateCallBar();

function formatDate(dateString) {
  const date = new Date(`${dateString}T00:00:00+09:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function createActivityCard(activity) {
  const article = document.createElement("article");
  article.className = "activity-card";
  const media = document.createElement("div");
  media.className = "activity-media";
  if (activity.image) {
    const image = document.createElement("img");
    image.src = activity.image;
    image.alt = activity.alt || activity.title || "活動記録の写真";
    image.loading = "lazy";
    image.addEventListener("error", () => {
      image.remove();
      media.classList.add("is-placeholder");
      media.textContent = "写真を読み込めませんでした";
    });
    media.append(image);
  } else {
    media.textContent = "写真はありません";
  }
  const body = document.createElement("div");
  body.className = "activity-body";
  const meta = document.createElement("div");
  meta.className = "activity-meta";
  const date = document.createElement("time");
  date.dateTime = activity.date;
  date.textContent = formatDate(activity.date);
  const category = document.createElement("span");
  category.textContent = activity.category;
  meta.append(date, category);
  const title = document.createElement("h3");
  const link = document.createElement("a");
  link.href = activity.url;
  link.textContent = activity.title;
  title.append(link);
  const summary = document.createElement("p");
  summary.textContent = activity.summary;
  body.append(meta, title, summary);
  article.append(media, body);
  return article;
}

async function renderActivities() {
  if (!activitiesContainer) return;
  try {
    const response = await fetch("activities.json", { cache: "no-store" });
    if (!response.ok) throw new Error("activities.json could not be loaded");
    const activities = await response.json();
    const latest = activities.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
    if (!latest.length) return;
    activitiesContainer.replaceChildren(...latest.map(createActivityCard));
  } catch (error) {
    // The three latest static cards remain available if fetching is unavailable.
    if (!activitiesContainer.querySelector(".activity-card")) activitiesContainer.textContent = "活動記録を読み込めませんでした。時間をおいて再度ご確認ください。";
  }
}
renderActivities();
