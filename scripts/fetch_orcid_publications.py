#!/usr/bin/env python3
import json
import os
import re
import sys
from datetime import datetime, timezone

import requests

ORCID = os.environ.get("ORCID_ID", "").strip()
if not ORCID:
    print("ERROR: ORCID_ID env var missing.")
    sys.exit(1)

OUT_PATH = os.environ.get("OUT_PATH", "assets/publications.json").strip()

WORKS_URL = f"https://pub.orcid.org/v3.0/{ORCID}/works"
HEADERS = {
    "Accept": "application/json",
    "User-Agent": "dhawan-publications-bot (GitHub Actions)"
}

def clean(s):
    if not s:
        return ""
    return re.sub(r"\s+", " ", str(s)).strip()

def pick_best_external_id(external_ids):
    if not external_ids:
        return None
    items = external_ids.get("external-id", []) or []
    # Prefer DOI if present
    for it in items:
        if clean(it.get("external-id-type")).lower() == "doi":
            return it
    return items[0] if items else None

def main():
    r = requests.get(WORKS_URL, headers=HEADERS, timeout=30)
    # If your ORCID works are not public, ORCID may return 401/403/404.
    r.raise_for_status()
    data = r.json()

    pubs = []
    for group in (data.get("group") or []):
        summaries = group.get("work-summary") or []
        if not summaries:
            continue
        s = summaries[0]

        title = clean((((s.get("title") or {}).get("title") or {}).get("value")))
        work_type = clean(s.get("type"))

        pub_year = None
        pub_date = s.get("publication-date") or {}
        if (pub_date.get("year") or {}).get("value"):
            try:
                pub_year = int(pub_date["year"]["value"])
            except Exception:
                pub_year = None

        ext = pick_best_external_id(s.get("external-ids") or {})
        doi = ""
        url = ""
        if ext:
            ext_type = clean(ext.get("external-id-type")).lower()
            ext_value = clean(ext.get("external-id-value"))
            ext_url = clean(((ext.get("external-id-url") or {}).get("value")))
            if ext_type == "doi" and ext_value:
                doi = ext_value
                url = f"https://doi.org/{doi}"
            elif ext_url:
                url = ext_url

        pubs.append({
            "title": title,
            "year": pub_year,
            "type": work_type,     # journal-article, conference-paper, book-chapter, etc.
            "doi": doi,
            "url": url,
            "orcid_put_code": s.get("put-code"),
        })

    pubs.sort(key=lambda x: ((x["year"] or 0), x["title"].lower()), reverse=True)

    output = {
        "orcid": ORCID,
        "generated_utc": datetime.now(timezone.utc).isoformat(),
        "count": len(pubs),
        "publications": pubs
    }

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(pubs)} publications → {OUT_PATH}")

if __name__ == "__main__":
    main()
