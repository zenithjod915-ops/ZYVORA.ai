
const CATEGORIES = [
  {id:"restaurant",name:"Restaurant",emoji:"🍽️",desc:"Premium dining, menu, reservations and location.",style:"Warm premium dining aesthetic with editorial food photography, rich earthy tones, elegant menu presentation and clear reservation / WhatsApp actions."},
  {id:"clinic",name:"Clinic & Healthcare",emoji:"🏥",desc:"Trustworthy clinic website with services and appointments.",style:"Calm, reassuring healthcare design with accessible typography, clear doctor and clinic information, services, appointment requests and patient-friendly navigation. Do not invent medical credentials or outcomes."},
  {id:"cafe",name:"Cafe & Coffee Shop",emoji:"☕",desc:"Modern cafe identity, menu and cosy atmosphere.",style:"Contemporary café aesthetic with warm neutrals, inviting imagery, featured drinks, menu highlights, opening hours and location."},
  {id:"beauty",name:"Beauty Parlour",emoji:"💆",desc:"Luxury beauty services, packages and bookings.",style:"Soft luxury beauty aesthetic, refined typography, service and package cards, gallery, booking calls to action and elegant warm colours."},
  {id:"salon",name:"Salon & Grooming",emoji:"✂️",desc:"Modern salon, barber or grooming studio.",style:"Contemporary premium grooming aesthetic, strong editorial layout, service menu, stylist section, gallery, booking and contact actions."},
  {id:"hotel",name:"Hotel & Hospitality",emoji:"🏨",desc:"Elegant stays, rooms, amenities and enquiries.",style:"Boutique hospitality aesthetic with immersive property imagery, room and amenity highlights, location details and enquiry / booking actions. Do not invent availability or ratings."},
  {id:"chinese",name:"Chinese Food",emoji:"🥡",desc:"Chinese restaurant, takeaway and food ordering.",style:"Vibrant but premium Asian food identity, appetising menu cards, clear veg / non-veg labels only when provided, takeaway and WhatsApp ordering."},
  {id:"ecommerce",name:"E-commerce Store",emoji:"🛍️",desc:"Premium Indian online store and product catalogue.",style:"Premium Indian D2C storefront, clean product grid, category navigation, product detail sections, cart UI demo and clear shipping / return information only when supplied."},
  {id:"realestate",name:"Real Estate",emoji:"🏡",desc:"Property listings, project details and enquiries.",style:"Trust-led real estate presentation with property cards, project highlights, enquiry forms and location details. Never fabricate property availability, prices or approvals."},
  {id:"gym",name:"Gym & Fitness",emoji:"🏋️",desc:"Fitness studio, membership plans and class enquiries.",style:"Energetic premium fitness design with clear training services, trainer details only if provided, membership enquiry and timetable if supplied."}
];

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

let currentPrompt = "";
let currentHtml = "";
let currentProjectId = null;
let selectedCategory = CATEGORIES[0];

const esc = s => String(s || "").replace(/[&<>"']/g, c => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[c]));

const getProjects = () => {
  try {
    return JSON.parse(localStorage.getItem("zyvora_projects") || "[]");
  } catch {
    return [];
  }
};

const setProjects = p =>
  localStorage.setItem("zyvora_projects", JSON.stringify(p));

function toast(msg) {
  const t = $("#toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2600);
}

function go(page) {
  $$(".page").forEach(p =>
    p.classList.toggle("active", p.id === "page-" + page)
  );

  $$(".nav-link[data-page]").forEach(b =>
    b.classList.toggle("active", b.dataset.page === page)
  );

  const crumb = $("#crumb");
  if (crumb) {
    crumb.textContent = ({
      dashboard:"Dashboard",
      builder:"AI Website Builder",
      library:"Prompt Library",
      projects:"My Projects",
      publish:"Publish & Deliver",
      settings:"AI & Settings"
    })[page] || page;
  }

  $("#sidebar")?.classList.remove("open");

  if (page === "projects") renderProjects();
  if (page === "publish") renderPublishSelect();
  if (page === "dashboard") renderDashboard();

  window.scrollTo(0, 0);
}

document.addEventListener("click", e => {
  const b = e.target.closest("[data-page]");
  if (b) {
    e.preventDefault();
    go(b.dataset.page);
  }
});

$("#mobileMenu")?.addEventListener("click", () =>
  $("#sidebar")?.classList.toggle("open")
);

if ($("#todayLabel")) {
  $("#todayLabel").textContent = new Date().toLocaleDateString("en-IN", {
    weekday:"short",
    day:"numeric",
    month:"short"
  }).toUpperCase();
}

function initCategories() {
  const sel = $("#businessCategory");

  if (sel) {
    sel.innerHTML = CATEGORIES.map(c =>
      `<option value="${c.id}">${c.emoji} ${c.name}</option>`
    ).join("");
  }

  renderCategoryCards();
}

function renderCategoryCards(filter = "") {
  const grid = $("#categoryGrid");
  if (!grid) return;

  const list = CATEGORIES.filter(c =>
    (c.name + " " + c.desc).toLowerCase().includes(filter.toLowerCase())
  );

  grid.innerHTML = list.map(c => `
    <button class="category-card" data-category="${c.id}">
      <span class="category-emoji">${c.emoji}</span>
      <span class="card-arrow">↗</span>
      <h3>${c.name}</h3>
      <p>${c.desc}</p>
    </button>
  `).join("") || '<div class="empty-state">No matching categories.</div>';

  $$("[data-category]").forEach(b => {
    b.addEventListener("click", () => openCategory(b.dataset.category));
  });
}

function buildPrompt(data, cat) {
  return `Act as a senior web designer, UX strategist and front-end developer. Create a complete, polished, responsive, production-quality website for the following client.

BUSINESS CATEGORY: ${cat.name}
BUSINESS NAME: ${data.name}
PHONE / WHATSAPP: ${data.phone || "Not supplied — use a clear placeholder, do not invent"}
EMAIL: ${data.email || "Not supplied — omit or use a clearly marked placeholder"}
ADDRESS: ${data.address || "Not supplied — do not invent"}
SERVICES / PRODUCTS: ${data.services || "Not supplied — create neutral editable placeholders, do not invent specific claims"}
PRICES: ${data.prices || "Not supplied — do not invent prices"}
OPENING HOURS: ${data.hours || "Not supplied — show an editable placeholder or omit"}
SOCIAL / MAP LINKS: ${data.social || "Not supplied — omit"}
SPECIAL NOTES: ${data.notes || "No additional notes"}

DESIGN DIRECTION: ${cat.style}

REQUIREMENTS:
- Create a complete multi-section website with a strong first screen, clear navigation, polished footer and consistent visual system.
- Make it mobile-first, responsive, accessible and fast-loading.
- Use a distinctive premium colour palette appropriate to this business; avoid generic template styling.
- Include only sections relevant to this business: hero, about, services/products/menu, gallery, testimonials only if supplied, FAQs, contact and footer as appropriate.
- Use professional copy, but never fabricate reviews, awards, credentials, addresses, opening hours, prices, statistics or business claims. Clearly mark missing information as editable placeholders.
- Make phone, WhatsApp, email, navigation and enquiry actions work where details are provided. Do not create fake payment or booking integrations.
- Use high-quality image URLs from reliable public image sources only if necessary; avoid broken image links and provide graceful fallbacks.
- Include basic SEO title, description and semantic HTML.
- Return ONE complete standalone HTML document with embedded CSS and JavaScript. No Markdown fences, no explanation, no external build tools. The first characters must be <!doctype html>.
- Keep all code self-contained so it can be previewed and downloaded as index.html.

Now create the finished website.`;
}

$("#clientForm")?.addEventListener("submit", e => {
  e.preventDefault();

  const cat = CATEGORIES.find(c =>
    c.id === $("#businessCategory").value
  );

  if (!cat) return;

  selectedCategory = cat;

  const data = {
    name:$("#businessName").value.trim(),
    phone:$("#phone").value.trim(),
    email:$("#email").value.trim(),
    address:$("#address").value.trim(),
    services:$("#services").value.trim(),
    prices:$("#prices").value.trim(),
    hours:$("#hours").value.trim(),
    notes:$("#notes").value.trim(),
    social:$("#social").value.trim()
  };

  if (!data.name) return;

  currentProjectId = null;
  currentPrompt = buildPrompt(data, cat);

  $("#generatedPrompt").value = currentPrompt;
  $("#promptResult").classList.remove("hidden");
  $("#aiOutput").classList.add("hidden");

  $("#promptResult").scrollIntoView({
    behavior:"smooth",
    block:"start"
  });
});

$("#copyPrompt")?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText($("#generatedPrompt").value);
    toast("Prompt copied. Paste it into your AI generator.");
  } catch {
    $("#generatedPrompt").select();
    toast("Select and copy the prompt.");
  }
});

$("#generateAI")?.addEventListener("click", async () => {
  const btn = $("#generateAI");

  if (btn.disabled) return;

  btn.disabled = true;
  btn.textContent = "Generating...";

  try {
    const res = await fetch("/.netlify/functions/generate", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        prompt:$("#generatedPrompt").value
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "AI generation failed");
    }

    currentHtml = cleanHtml(data.code || data.html || "");

    if (
      !currentHtml.toLowerCase().includes("<html") &&
      !currentHtml.toLowerCase().includes("<!doctype")
    ) {
      throw new Error("AI did not return a complete HTML page. Try again.");
    }

    $("#previewFrame").srcdoc = currentHtml;
    $("#aiOutput").classList.remove("hidden");

    $("#aiOutput").scrollIntoView({
      behavior:"smooth",
      block:"start"
    });

    toast("Website draft generated! Review it before delivery.");
  } catch (err) {
    toast(err.message || "Could not generate. Check your API setup.");
  } finally {
    btn.disabled = false;
    btn.innerHTML = "✦ Generate website";
  }
});

function cleanHtml(s) {
  return String(s || "")
    .replace(/^```(?:html)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

$("#previewOutput")?.addEventListener("click", () =>
  $("#previewFrame").scrollIntoView({behavior:"smooth"})
);

$("#downloadOutput")?.addEventListener("click", () => {
  if (!currentHtml) {
    toast("Generate a website first.");
    return;
  }

  downloadHtml(
    currentHtml,
    `${slug(selectedCategory.name)}-website.html`
  );
});

$("#saveOutput")?.addEventListener("click", () => {
  if (!currentHtml) {
    toast("Generate a website first.");
    return;
  }

  saveProject();
});

function slug(s) {
  return String(s || "website")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "website";
}

function downloadHtml(html, name) {
  const a = document.createElement("a");
  const url = URL.createObjectURL(
    new Blob([html], {type:"text/html"})
  );

  a.href = url;
  a.download = name;
  a.click();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function saveProject() {
  const projects = getProjects();
  const name = $("#businessName").value.trim() || selectedCategory.name;

  const p = {
    id:currentProjectId || Date.now().toString(),
    name,
    category:selectedCategory.name,
    html:currentHtml,
    prompt:currentPrompt,
    updated:new Date().toISOString()
  };

  const idx = projects.findIndex(x => x.id === p.id);

  if (idx >= 0) {
    projects[idx] = p;
  } else {
    projects.unshift(p);
  }

  setProjects(projects);
  currentProjectId = p.id;

  toast("Project saved on this device.");
  renderDashboard();
}

function openCategory(id) {
  const c = CATEGORIES.find(x => x.id === id);
  if (!c) return;

  selectedCategory = c;

  $("#modalTitle").textContent = c.name;
  $("#modalDescription").textContent = c.desc + " " + c.style;
  $("#categoryModal").classList.remove("hidden");

  $("#copyTemplate").onclick = async () => {
    const p = buildPrompt({name:"[CLIENT BUSINESS NAME]"}, c);

    try {
      await navigator.clipboard.writeText(p);
      toast("Template copied.");
    } catch {
      toast("Copy not available in this browser.");
    }
  };

  $("#useTemplate").onclick = () => {
    $("#businessCategory").value = c.id;
    $("#categoryModal").classList.add("hidden");
    go("builder");
    $("#businessName").focus();
  };
}

$("#closeModal")?.addEventListener("click", () =>
  $("#categoryModal").classList.add("hidden")
);

$("#categoryModal")?.addEventListener("click", e => {
  if (e.target.id === "categoryModal") {
    e.currentTarget.classList.add("hidden");
  }
});

$("#promptSearch")?.addEventListener("input", e =>
  renderCategoryCards(e.target.value)
);

function renderDashboard() {
  const el = $("#dashboardProjects");
  if (!el) return;

  const p = getProjects();

  if (!p.length) {
    el.innerHTML = `
      <div class="empty-state">
        <span>✧</span>
        <b>Your next great project starts here.</b>
        <p>Generated and saved websites will appear here.</p>
        <button class="btn btn-outline" data-page="builder">
          Create your first project
        </button>
      </div>`;
    return;
  }

  el.innerHTML = p.slice(0, 3).map(projectRow).join("");
}

function projectRow(p) {
  return `
    <div class="project-row">
      <div class="project-thumb">✦</div>
      <div class="project-meta">
        <b>${esc(p.name)}</b>
        <small>${esc(p.category)} · Updated ${new Date(p.updated).toLocaleDateString()}</small>
      </div>
      <div class="project-actions">
        <button class="btn btn-outline btn-small" data-open="${esc(p.id)}">Open</button>
        <button class="btn btn-outline btn-small" data-download="${esc(p.id)}">Download</button>
        <button class="btn btn-outline btn-small" data-delete="${esc(p.id)}">Delete</button>
      </div>
    </div>`;
}

function renderProjects() {
  const search = $("#projectSearch");
  const output = $("#allProjects");

  if (!output) return;

  const q = (search?.value || "").toLowerCase();

  const p = getProjects().filter(x =>
    (x.name + " " + x.category).toLowerCase().includes(q)
  );

  output.innerHTML = p.length
    ? p.map(projectRow).join("")
    : `
      <div class="empty-state">
        <span>▣</span>
        <b>No saved projects yet.</b>
        <p>Generate a website and press Save project.</p>
        <button class="btn btn-primary" data-page="builder">Create a project</button>
      </div>`;
}

$("#projectSearch")?.addEventListener("input", renderProjects);

document.addEventListener("click", e => {
  const open = e.target.closest("[data-open]");

  if (open) {
    const p = getProjects().find(x => x.id === open.dataset.open);

    if (p) {
      currentProjectId = p.id;
      currentHtml = p.html;
      currentPrompt = p.prompt;

      selectedCategory =
        CATEGORIES.find(c => c.name === p.category) || CATEGORIES[0];

      $("#businessName").value = p.name;
      $("#generatedPrompt").value = p.prompt;

      $("#promptResult").classList.remove("hidden");
      $("#aiOutput").classList.remove("hidden");
      $("#previewFrame").srcdoc = p.html;

      go("builder");
    }
  }

  const dl = e.target.closest("[data-download]");

  if (dl) {
    const p = getProjects().find(x => x.id === dl.dataset.download);

    if (p) downloadHtml(p.html, slug(p.name) + ".html");
  }

  const del = e.target.closest("[data-delete]");

  if (del && confirm("Delete this saved project from this browser?")) {
    setProjects(
      getProjects().filter(x => x.id !== del.dataset.delete)
    );

    renderProjects();
    renderDashboard();
    renderPublishSelect();
    toast("Project deleted.");
  }
});

function renderPublishSelect() {
  const sel = $("#publishProject");
  if (!sel) return;

  const ps = getProjects();

  sel.innerHTML =
    '<option value="">Choose a project...</option>' +
    ps.map(p =>
      `<option value="${esc(p.id)}">${esc(p.name)} — ${esc(p.category)}</option>`
    ).join("");
}

$("#publishProject")?.addEventListener("change", () => {
  const p = getProjects().find(
    x => x.id === $("#publishProject").value
  );

  $("#publishPreview").innerHTML = p
    ? `<b>${esc(p.name)}</b><p>${esc(p.category)} · Saved ${new Date(p.updated).toLocaleDateString()}</p>`
    : '<span>▣</span><p>Your selected project details will appear here.</p>';
});

// Publishing is temporarily disabled until a separate client-site
// deployment target is configured. This protects the ZYVORA workspace.
$("#publishNetlify")?.addEventListener("click", () => {
  toast("Client publishing setup is not ready yet. Your workspace is protected.");
});

$("#saveKey")?.addEventListener("click", () => {
  const key = $("#geminiKey").value.trim();

  if (!key) {
    toast("Paste your Gemini API key first.");
    return;
  }

  localStorage.setItem("zyvora_gemini_key", key);
  $("#keyStatus").textContent =
    "Saved in this browser. Server generation uses the Netlify environment variable GEMINI_API_KEY.";

  toast("Key saved in this browser.");
});

(function loadKey() {
  const k = localStorage.getItem("zyvora_gemini_key");

  if (k) {
    $("#geminiKey").value = k;
    $("#keyStatus").textContent = "A key is saved in this browser.";
  }
})();

initCategories();
renderDashboard();
