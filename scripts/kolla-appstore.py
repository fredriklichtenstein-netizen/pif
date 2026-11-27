#!/usr/bin/env python3
"""Kontrollerar en versions texter i appstore/metadata.md (eller playstore/metadata.md
med --play): längder, emoji och att alla rubriker finns.
  python3 scripts/kolla-appstore.py 2.0.0
  python3 scripts/kolla-appstore.py 2.0.0 --play"""
import re, sys

version = sys.argv[1]
play = "--play" in sys.argv
fil = "playstore/metadata.md" if play else "appstore/metadata.md"
text = open(fil, encoding="utf-8").read()
fel = []

def avsnitt_for(rubrik, källa):
    m = re.search(rf"^## {re.escape(rubrik)}\n(.*?)(?=^## |\Z)", källa, re.S | re.M)
    return m.group(1) if m else None

def under(rubrik, källa):
    r = re.search(rf"^### {re.escape(rubrik)}[^\n]*\n(.*?)(?=^### |\Z)", källa, re.S | re.M)
    return r.group(1).strip() if r else None

def textrad(block, hoppa=("Visas överst", "Kommaseparerade")):
    rader = [r for r in block.splitlines() if r.strip() and not r.startswith(hoppa)]
    return rader[0] if rader else ""

def kolla(namn, värde, gräns):
    print(f"{namn}: {len(värde)}/{gräns}")
    if len(värde) > gräns:
        fel.append(f"{namn} är för lång ({len(värde)} > {gräns})")

info = avsnitt_for("App-information", text) or ""
for etikett, gräns in [("App-namn" if play else "Namn", 30), ("Underrubrik", 30)]:
    m = re.search(rf"\*\*{etikett} \(\d+\):\*\* (.+)", info)
    if m:
        kolla(etikett, m.group(1).strip(), gräns)
    elif not (play and etikett == "Underrubrik"):
        fel.append(f"Hittar inte '{etikett}' under App-information")

avsnitt = avsnitt_for(f"Version {version}", text)
if avsnitt is None:
    sys.exit(f"Hittar inget avsnitt '## Version {version}' i {fil}")

if play:
    krav = [("Kort beskrivning", 80), ("Fullständig beskrivning", 4000),
            ("Nyheter i den här versionen", 500)]
    for rubrik, gräns in krav:
        t = under(rubrik, avsnitt)
        if t is None: fel.append(f"Saknar '### {rubrik}'")
        else: kolla(rubrik, textrad(t) if gräns <= 80 else t, gräns)
else:
    t = under("Promotional Text", avsnitt)
    if t is None: fel.append("Saknar '### Promotional Text (Reklamtext, 170 tecken)'")
    else: kolla("Promotional Text", textrad(t), 170)
    t = under("Nyckelord", avsnitt)
    if t is None: fel.append("Saknar '### Nyckelord'")
    else:
        ord_ = textrad(t)
        kolla("Nyckelord", ord_, 100)
        if ", " in ord_: fel.append("Nyckelord: inga mellanslag efter komma (de räknas)")
    for rubrik, gräns in [("Nyheter i den här versionen", 4000), ("Beskrivning", 4000)]:
        t = under(rubrik, avsnitt)
        if t is None: fel.append(f"Saknar '### {rubrik}'")
        else: kolla(rubrik, t, gräns)
    if under("Anteckning till granskningen", avsnitt) is None:
        fel.append("Saknar '### Anteckning till granskningen'")

# Butikerna avvisar emoji i texterna.
emoji = re.compile("[\U0001F000-\U0001FAFF☀-➿️⬀-⯿]")
for i, rad in enumerate(avsnitt.splitlines(), 1):
    if emoji.search(rad):
        fel.append(f"Emoji på rad {i} i avsnittet: {rad[:60]}")

print("\n".join("FEL: " + f for f in fel) if fel else "OK")
sys.exit(1 if fel else 0)
