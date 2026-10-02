"""
Ashwa Racing — Team Data Sync Script (JSON output)

- Reads existing team.json (never wipes manual entries)
  * First run only: if team.json doesn't exist yet, team.js (and any
    alumni-only people in alumni-data.js) are imported once, so nothing
    manual is lost.
- Reads "Parsed Team Data" sheet (form submissions)
- Merges by name — updates only form fields, preserves manual fields
- Everyone goes into team.json (one array). Alumni are just entries whose
  year has passed; the site works that out in the browser.
- Downloads new photos from Drive (folder must be public)

Optional manual fields on an entry (never touched by the sheet):
  company, position, photo, programme, easterEgg
"""

import os
import io
import re
import csv
import json
import requests
import boto3

# ─── Config ───────────────────────────────────────────────────
SHEET_CSV_URL        = os.environ["SHEET_CSV_URL"]
DRIVE_ROOT_FOLDER_ID = os.environ["DRIVE_ROOT_FOLDER_ID"]

TEAM_JSON_PATH = "assets/data/team.json"

# Legacy sources — only read (never written), and only when team.json
# doesn't exist yet
LEGACY_TEAM_JS_PATH   = "assets/js/pages/team.js"
LEGACY_ALUMNI_JS_PATH = "assets/js/pages/alumni-data.js"

# Manual flags preserved — never overwritten by sync
MANUAL_FLAGS = {
    "Vibin": {"easterEgg": False}
}

# Prototype key → programme id (used to spot redundant migrated values)
PROGRAMME_MAP = {
    "Combustion": "cv",
    "Hybrid":     "hybrid",
    "Electric":   "ev",
    "Hyperloop":  "hyperloop",
    "Driverless": "dv"
}

# ─── Helpers ──────────────────────────────────────────────────
def clean_url(url):
    url = (url or "").strip()
    if not url or url.lower() in ["na", "n/a", "-", ""]:
        return None
    return url if url.startswith("http") else "https://" + url

def clean_text(text):
    val = (text or "").strip()
    return val if val and val.lower() not in ["na", "n/a", "-", ""] else None

def parse_current_job(current_job):
    """'Position, Company' → (position, company). 'MBA' → ('MBA', '')."""
    if not current_job:
        return "", ""
    parts = [p.strip() for p in current_job.split(",", 1)]
    return parts[0], (parts[1] if len(parts) > 1 else "")

def get_programme(prototypes):
    if not prototypes:
        return ""
    return PROGRAMME_MAP.get(list(prototypes.keys())[0], "")

def normalize(e):
    """Fill defaults so merge/write code can rely on every key existing."""
    e.setdefault("name", "")
    e.setdefault("year", "")
    e.setdefault("experience", "")
    e.setdefault("roles", None)
    if not e["roles"]:
        e["roles"] = ["Member"]
    e.setdefault("subsystem", [])
    e.setdefault("prototypes", {})
    for k in ("linkedin", "github", "gmail", "testimony", "currentJob",
              "role", "batch", "photo", "company", "position", "programme"):
        e.setdefault(k, None)
    e["easterEgg"] = bool(e.get("easterEgg"))
    # legacy alumni entries store the year as "batch"
    if not e["year"] and e.get("batch"):
        e["year"] = e["batch"]
    return e

# ─── team.json read / write ───────────────────────────────────
def read_team_json(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    entries = []
    for item in data:
        e = dict(item)
        # team.json nests socials; flatten for merging
        social = e.pop("social", None) or {}
        for k in ("linkedin", "github", "gmail"):
            if e.get(k) is None:
                e[k] = social.get(k)
        entries.append(normalize(e))

    entries = [e for e in entries if e["name"]]
    print(f"  ✅ Read {len(entries)} entries from {filepath}")
    return entries

def team_json_entry(e):
    out = {
        "name":       e.get("name", ""),
        "roles":      e.get("roles") or ["Member"],
        "subsystem":  e.get("subsystem") or [],
        "year":       e.get("year", ""),
        "experience": e.get("experience", ""),
        "social": {
            "linkedin": e.get("linkedin"),
            "github":   e.get("github"),
            "gmail":    e.get("gmail"),
        },
    }

    for key in ("prototypes", "testimony", "currentJob",
                "company", "position", "photo", "programme"):
        if e.get(key):
            out[key] = e[key]

    flags = dict(MANUAL_FLAGS.get(e.get("name", ""), {}))
    if e.get("easterEgg"):
        flags["easterEgg"] = True
    out.update(flags)

    return out

def write_team_json(filepath, entries):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    tmp = filepath + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump([team_json_entry(e) for e in entries], f, ensure_ascii=False, indent=2)
        f.write("\n")
    os.replace(tmp, filepath)
    print(f"  ✅ {filepath} updated — {len(entries)} entries")

# ─── LEGACY: read entries out of a JS file (one-time migration) ─
def extract_entry_blocks(content, array_name):
    m = re.search(rf'const\s+{array_name}\s*=\s*\[', content)
    if not m:
        print(f"  ⚠️ Could not find 'const {array_name} = [' in file")
        return []

    array_start = m.end()
    depth = 1
    i = array_start
    while i < len(content) and depth > 0:
        if content[i] == '[':
            depth += 1
        elif content[i] == ']':
            depth -= 1
        i += 1
    array_content = content[array_start:i-1]

    blocks = []
    depth  = 0
    start  = -1
    for j, ch in enumerate(array_content):
        if ch == '{':
            if depth == 0:
                start = j
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0 and start != -1:
                blocks.append(array_content[start:j+1])
                start = -1
    return blocks

def parse_js_block(block):
    entry = {}

    def get_str(key):
        m = re.search(rf'{key}:\s*"((?:[^"\\]|\\.)*)"', block)
        return m.group(1).replace('\\"', '"') if m else None

    def get_null_or_str(key):
        m = re.search(rf'{key}:\s*(null|"(?:[^"\\]|\\.)*")', block)
        if not m:
            return None
        val = m.group(1)
        return None if val == "null" else val.strip('"').replace('\\"', '"')

    def get_array(key):
        m = re.search(rf'{key}:\s*(\[[^\]]*\])', block)
        try:
            return json.loads(m.group(1)) if m else []
        except Exception:
            return []

    entry["name"]       = get_str("name")       or ""
    entry["year"]       = get_str("year")        or ""
    entry["experience"] = get_str("experience")  or ""
    entry["roles"]      = get_array("roles")     or ["Member"]
    entry["subsystem"]  = get_array("subsystem") or []
    entry["linkedin"]   = get_null_or_str("linkedin")
    entry["github"]     = get_null_or_str("github")
    entry["gmail"]      = get_null_or_str("gmail")
    entry["easterEgg"]  = bool(re.search(r'easterEgg:\s*true', block))
    entry["testimony"]  = get_str("testimony")
    entry["currentJob"] = get_str("currentJob")

    m = re.search(r'prototypes:\s*(\{[^}]*\})', block)
    try:
        entry["prototypes"] = json.loads(m.group(1)) if m else {}
    except Exception:
        entry["prototypes"] = {}

    # Alumni-specific fields
    entry["role"]      = get_str("role")
    entry["batch"]     = get_str("batch")
    entry["photo"]     = get_str("photo")
    entry["company"]   = get_str("company")
    entry["position"]  = get_str("position")
    entry["programme"] = get_str("programme")
    return entry

def read_legacy_js_entries(filepath, array_name):
    if not os.path.exists(filepath):
        print(f"  ⚠️ {filepath} not found — nothing to import.")
        return []

    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    entries = [normalize(parse_js_block(b)) for b in extract_entry_blocks(content, array_name)]
    entries = [e for e in entries if e["name"]]
    print(f"  ✅ Imported {len(entries)} entries from legacy {filepath}")
    return entries

def fold_alumni_into_team(team, alumni):
    """
    One-time: bring alumni-data.js into the team list.
    - Alumni already in the team list: copy over the manual fields
      (company, position, photo, programme) and a real role, if set.
    - Alumni-only people: added as new team entries.
    Values that the site can derive anyway (company/position from currentJob,
    programme from prototypes, the standard CDN photo URL) are dropped so
    team.json stays clean.
    """
    lookup = {e["name"].lower().strip(): e for e in team}

    for a in alumni:
        key = a["name"].lower().strip()
        e = lookup.get(key)
        if e is None:
            e = normalize({
                "name":      a["name"],
                "year":      a.get("batch") or a.get("year") or "",
                "roles":     [a["role"]] if a.get("role") else ["Member"],
                "linkedin":  a.get("linkedin"),
                "testimony": a.get("testimony"),
            })
            team.append(e)
            lookup[key] = e
            print(f"  ➕ Alumni-only: {a['name']}")
        else:
            if a.get("role") and e["roles"] == ["Member"]:
                e["roles"] = [a["role"]]
            for k in ("linkedin", "testimony"):
                if not e.get(k) and a.get(k):
                    e[k] = a[k]

        for k in ("company", "position", "photo", "programme"):
            if a.get(k) and not e.get(k):
                e[k] = a[k]

    # Drop values the site can derive on its own
    for e in team:
        pos, comp = parse_current_job(e.get("currentJob") or "")
        if e.get("position") and e["position"] == pos:
            e["position"] = None
        if e.get("company") and e["company"] == comp:
            e["company"] = None
        if e.get("programme") and e["programme"] == get_programme(e.get("prototypes")):
            e["programme"] = None
        std_photo = f'https://assets.ashwaracing.org/images/team/members/{e["year"]}/{e["name"]}.webp'
        if e.get("photo") and (e["photo"] == std_photo or "default.webp" in e["photo"]):
            e["photo"] = None

    return team

def load_team():
    """team.json if it exists, otherwise a one-time import from the legacy JS."""
    if os.path.exists(TEAM_JSON_PATH):
        return read_team_json(TEAM_JSON_PATH)

    print(f"  ℹ️ {TEAM_JSON_PATH} not found — importing from legacy JS.")
    team   = read_legacy_js_entries(LEGACY_TEAM_JS_PATH,   "teamData")
    alumni = read_legacy_js_entries(LEGACY_ALUMNI_JS_PATH, "ALUMNI")
    return fold_alumni_into_team(team, alumni)

# ─── Read Sheet ───────────────────────────────────────────────
def read_sheet():
    print("📊 Fetching sheet CSV...")
    r = requests.get(SHEET_CSV_URL, timeout=30)
    r.raise_for_status()
    rows = list(csv.DictReader(io.StringIO(r.text)))
    rows = [r for r in rows if r.get("Name", "").strip()]
    print(f"✅ {len(rows)} entries read from sheet.")
    return rows

# ─── Parse Sheet Row ──────────────────────────────────────────
def parse_row(row):
    roles      = [r.strip() for r in row.get("Roles",      "Member").split(",") if r.strip()]
    subsystems = [s.strip() for s in row.get("Subsystems", "").split(",")        if s.strip()]
    try:
        prototypes = json.loads(row.get("Prototype Roles", "{}") or "{}")
    except Exception:
        prototypes = {}

    return normalize({
        "name":       row.get("Name",  "").strip(),
        "year":       row.get("Year",  "").strip(),
        "roles":      roles or ["Member"],
        "subsystem":  subsystems,
        "prototypes": prototypes,
        "experience": clean_text(row.get("Experience",  "")),
        "linkedin":   clean_url (row.get("LinkedIn",    "")),
        "github":     clean_url (row.get("GitHub",      "")),
        "gmail":      clean_text(row.get("Email",       "")),
        "testimony":  clean_text(row.get("Testimony",   "")),
        "currentJob": clean_text(row.get("Current Job", "")),
    })

# ─── Merge ────────────────────────────────────────────────────
def merge(existing, sheet_rows):
    lookup = {e["name"].lower().strip(): i for i, e in enumerate(existing)}

    for row in sheet_rows:
        sheet = parse_row(row)
        if not sheet["name"]:
            continue

        key = sheet["name"].lower().strip()

        if key in lookup:
            e = existing[lookup[key]]
            if sheet["roles"]:      e["roles"]      = sheet["roles"]
            if sheet["subsystem"]:  e["subsystem"]  = sheet["subsystem"]
            if sheet["experience"]: e["experience"] = sheet["experience"]
            if sheet["linkedin"]:   e["linkedin"]   = sheet["linkedin"]
            if sheet["github"]:     e["github"]     = sheet["github"]
            if sheet["gmail"]:      e["gmail"]      = sheet["gmail"]
            if sheet["prototypes"]: e["prototypes"] = sheet["prototypes"]
            if sheet["testimony"]:  e["testimony"]  = sheet["testimony"]
            if sheet["currentJob"]: e["currentJob"] = sheet["currentJob"]
            # Update year in case batch changed
            if sheet["year"]:       e["year"]       = sheet["year"]
            print(f"  ✏️  Updated: {sheet['name']}")
        else:
            existing.append(sheet)
            lookup[key] = len(existing) - 1
            print(f"  ➕ Added:   {sheet['name']}")

    return existing

# ─── Sync Photos to Cloudflare R2 ────────────────────────────
def sync_photos(sheet_rows):
    print("\n📸 Syncing photos to Cloudflare R2...")

    R2_ACCOUNT_ID = os.environ["R2_ACCOUNT_ID"]
    R2_ACCESS_KEY_ID = os.environ["R2_ACCESS_KEY_ID"]
    R2_SECRET_ACCESS_KEY = os.environ["R2_SECRET_ACCESS_KEY"]
    R2_BUCKET_NAME = os.environ["R2_BUCKET_NAME"]

    r2 = boto3.client(
        "s3",
        endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        region_name="auto",
    )

    for row in sheet_rows:
        name = row.get("Name", "").strip()
        year = row.get("Year", "").strip()
        file_id = row.get("Photo File ID", "").strip()

        if not file_id or not name or not year:
            continue

        # R2 object key
        key = f"images/team/members/{year}/{name}.webp"

        # Check whether the image already exists in R2
        try:
            r2.head_object(
                Bucket=R2_BUCKET_NAME,
                Key=key
            )
            print(f"  ⏭️  Exists: {name}.webp")
            continue

        except Exception:
            # Object doesn't exist, so continue with upload.
            pass

        # Download image from Google Drive
        url = f"https://drive.google.com/uc?export=download&id={file_id}&confirm=t"

        r = requests.get(url, timeout=30)

        if r.status_code != 200 or "text/html" in r.headers.get("Content-Type", ""):
            print(f"  ❌ Failed to download: {name}")
            continue

        # Upload directly to R2
        try:
            r2.put_object(
                Bucket=R2_BUCKET_NAME,
                Key=key,
                Body=r.content,
                ContentType="image/webp",
                CacheControl="public, max-age=31536000, immutable",
            )

            print(f"  ✅ Uploaded: {name}.webp")

        except Exception as e:
            print(f"  ❌ R2 upload failed for {name}: {e}")

# ─── Main ─────────────────────────────────────────────────────
def main():
    print("🚀 Ashwa Racing sync starting...\n")

    # 1. Read sheet
    sheet_rows = read_sheet()
    if not sheet_rows:
        print("Nothing to sync.")
        return

    # 2. Sync photos
    sync_photos(sheet_rows)

    # 3. Read existing data (team.json, or legacy JS on first run)
    print("\n📖 Reading existing data...")
    team_entries = load_team()

    # 4. Merge
    print("\n🔀 Merging team data...")
    team_entries = merge(team_entries, sheet_rows)
    print(f"\n👥 Total entries: {len(team_entries)}")

    # 5. Write
    print("\n📝 Writing JSON...")
    write_team_json(TEAM_JSON_PATH, team_entries)

    print("\n🎉 Sync complete!")

if __name__ == "__main__":
    main()