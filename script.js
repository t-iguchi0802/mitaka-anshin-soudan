const activitiesContainer = document.querySelector("#activities-list");
const navToggle = document.querySelector(".nav-toggle");
const siteHeader = document.querySelector(".site-header");

if (navToggle && siteHeader) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteHeader.classList.toggle("nav-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  document.querySelectorAll(".site-nav a").forEach((link) => {
    link.addEventListener("click", () => {
      siteHeader.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

document.querySelectorAll('.site-nav a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;

    event.preventDefault();
    const headerHeight = document.querySelector(".site-header")?.offsetHeight || 0;
    const y = target.getBoundingClientRect().top + window.scrollY - headerHeight - 18;
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    history.pushState(null, "", link.getAttribute("href"));
  });
});

function formatDate(dateString) {
  const date = new Date(`${dateString}T00:00:00+09:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
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
    image.addEventListener("load", () => {
      media.classList.remove("is-placeholder");
    });
    image.addEventListener("error", () => {
      image.remove();
      media.classList.add("is-placeholder");
      media.textContent = activity.category || "活動写真";
    });
    media.append(image);
  } else {
    media.classList.add("is-placeholder");
    media.textContent = activity.category || "活動写真";
  }

  const body = document.createElement("div");
  body.className = "activity-body";

  const meta = document.createElement("div");
  meta.className = "activity-meta";
  meta.innerHTML = `<span>${formatDate(activity.date)}</span><span>${activity.category}</span>`;

  const title = document.createElement("h3");
  title.textContent = activity.title;

  const summary = document.createElement("p");
  summary.textContent = activity.summary;

  const link = document.createElement("a");
  link.className = "text-link";
  link.href = activity.url || "#";
  link.textContent = "詳しく見る";

  body.append(meta, title, summary, link);
  article.append(media, body);
  return article;
}

async function renderActivities() {
  if (!activitiesContainer) return;

  try {
    const response = await fetch("activities.json", { cache: "no-store" });
    if (!response.ok) throw new Error("activities.json could not be loaded");

    const activities = await response.json();
    const latest = activities
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3);

    activitiesContainer.textContent = "";
    latest.forEach((activity) => activitiesContainer.append(createActivityCard(activity)));
  } catch (error) {
    if (!activitiesContainer.querySelector(".activity-card")) {
      activitiesContainer.innerHTML = '<p class="loading">活動記録を読み込めませんでした。時間をおいて再度ご確認ください。</p>';
    }
  }
}

renderActivities();
