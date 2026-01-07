async function loadPublications() {
  const meta = document.getElementById("pub-meta");
  const list = document.getElementById("pub-list");

  try {
    const res = await fetch("assets/publications.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Cannot load publications.json");

    const data = await res.json();
    meta.textContent = `Total: ${data.count} | Updated (UTC): ${data.generated_utc}`;

    list.innerHTML = "";
    for (const p of (data.publications || [])) {
      if (!p.title) continue;

      const li = document.createElement("li");

      const title = document.createElement("span");
      title.textContent = p.title;

      if (p.url) {
        const a = document.createElement("a");
        a.href = p.url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.appendChild(title);
        li.appendChild(a);
      } else {
        li.appendChild(title);
      }

      const info = [];
      if (p.year) info.push(p.year);
      if (p.type) info.push(p.type);
      if (p.doi) info.push(`DOI: ${p.doi}`);

      if (info.length) {
        const small = document.createElement("div");
        small.style.opacity = "0.85";
        small.style.fontSize = "0.9rem";
        small.textContent = info.join(" | ");
        li.appendChild(small);
      }

      list.appendChild(li);
    }
  } catch (e) {
    meta.textContent = "Publications could not be loaded.";
    console.error(e);
  }
}

document.addEventListener("DOMContentLoaded", loadPublications);
