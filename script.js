document.addEventListener("DOMContentLoaded", function () {
  const ORCID_ID = "0000-0003-4868-5806";
  const resumeUrl = "Dhawan Singh_Full_Resume.pdf";

  try {
    new QRCode(document.getElementById("qr"), {
      text: window.location.href || resumeUrl,
      width: 100,
      height: 100,
      correctLevel: QRCode.CorrectLevel.H
    });
  } catch (e) {}

  const body = document.body;
  const toggle = document.getElementById("themeToggle");
  const icon = document.getElementById("themeIcon");
  const label = document.getElementById("themeLabel");

  function setTheme(theme) {
    body.setAttribute("data-theme", theme);
    icon.textContent = theme === "dark" ? "☀️" : "🌙";
    label.textContent = theme === "dark" ? "Light" : "Dark";
    try {
      localStorage.setItem("drds-theme", theme);
    } catch (e) {}
  }

  try {
    const saved = localStorage.getItem("drds-theme");
    if (saved === "dark" || saved === "light") {
      setTheme(saved);
    }
  } catch (e) {}

  toggle.addEventListener("click", function () {
    const nextTheme = body.getAttribute("data-theme") === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  });

  async function loadPublications() {
    const meta = document.getElementById("pub-meta");
    const list = document.getElementById("pub-list");
    const track = document.getElementById("pub-scroll-track");

    try {
      const res = await fetch(`https://pub.orcid.org/v3.0/${ORCID_ID}/works`, {
        headers: { Accept: "application/json" }
      });

      if (!res.ok) {
        throw new Error(res.status);
      }

      const data = await res.json();
      const works = data.group || [];

      if (!works.length) {
        meta.textContent = "No public works found on ORCID.";
        return;
      }

      meta.textContent = `${works.length} works found on ORCID · Sorted by recent`;

      works.slice(0, 20).forEach(function (g, i) {
        const summary = (g["work-summary"] && g["work-summary"][0]) || {};
        const title = (summary.title && summary.title.title && summary.title.title.value) || "Untitled";
        const year = (summary["publication-date"] && summary["publication-date"].year && summary["publication-date"].year.value) || "";
        const journal = (summary["journal-title"] && summary["journal-title"].value) || "";

        const li = document.createElement("li");
        li.className = "pub-item";
        li.innerHTML =
          '<span class="pub-num">' + (i + 1) + "</span>" +
          "<strong>" + title + "</strong>" +
          (journal ? ' <span style="color:var(--muted)">· ' + journal + "</span>" : "") +
          (year ? ' <span style="color:var(--light);font-size:12px"> · ' + year + "</span>" : "");

        list.appendChild(li);
      });

      if (list.children.length > 4) {
        const clonedList = list.cloneNode(true);
        clonedList.id = "";
        track.appendChild(clonedList);
      } else {
        track.style.animation = "none";
      }
    } catch (e) {
      meta.textContent = "Unable to load from ORCID. Check your profile visibility settings.";
    }
  }

  async function loadPeerReviews() {
    const meta = document.getElementById("peer-meta");
    const list = document.getElementById("peer-review-list");

    try {
      const res = await fetch(`https://pub.orcid.org/v3.0/${ORCID_ID}/peer-reviews`, {
        headers: { Accept: "application/json" }
      });

      if (!res.ok) {
        throw new Error(res.status);
      }

      const data = await res.json();
      const groups = data.group || [];

      if (!groups.length) {
        meta.textContent = "No public peer review activity found on ORCID.";
        return;
      }

      meta.textContent = groups.length + " peer review group(s) on ORCID";

      groups.forEach(function (group) {
        const prGroups = group["peer-review-group"] || [];
        const summaries = prGroups[0] && prGroups[0]["peer-review-summary"] ? prGroups[0]["peer-review-summary"] : [];
        const reviewCount = summaries.length;

        let journalName = "Peer Review Activity";
        if (summaries.length > 0) {
          const first = summaries[0];
          if (first["convening-organization"] && first["convening-organization"]["name"]) {
            journalName = first["convening-organization"]["name"];
          } else if (
            first["review-group-id"] &&
            first["review-group-id"]["external-identifier"] &&
            first["review-group-id"]["external-identifier"]["value"]
          ) {
            journalName = first["review-group-id"]["external-identifier"]["value"];
          }
        }

        const card = document.createElement("div");
        card.className = "peer-card";
        card.innerHTML =
          '<div class="peer-title">' + journalName + "</div>" +
          '<div class="peer-sub">Review activity from your public ORCID record</div>' +
          '<span class="peer-badge">' + reviewCount + " review(s)</span>";

        list.appendChild(card);
      });
    } catch (e) {
      meta.textContent = "Unable to load peer review activity. Check ORCID visibility settings.";
    }
  }

  loadPublications();
  loadPeerReviews();
});
