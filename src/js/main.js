// ================================================
// STATE
// ================================================
let currentData = {};
let currentXml = null;
let jsonDebounce = null;

// Globale Variablen für den schnellen Zugriff in allen Funktionen
let sex = '';
let partner = '';
let abteilung = '';

// ================================================
// OWN Variable(s)
// ================================================
let aktuellesDatum = new Date().toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
});

// Hilfsfunktion: Aktualisiert die globalen Variablen, sobald Daten geladen/geändert werden
function updateGlobalConstants() {
    const b = currentData.bewerbung || {};
    sex = b.geschlecht || '';
    partner = b.ansprechpartner || '';
    abteilung = b.abteilung || '';
}

// ================================================
// BOOT
// ================================================
(async function init() {
    try {
    // Load JSON
    const jsonResp = await fetch('bewerbung.json');
    if (!jsonResp.ok) throw new Error('JSON nicht gefunden');
    currentData = await jsonResp.json();

    // Globale Variablen initial befüllen
    updateGlobalConstants();

    // Populate editor
    document.getElementById('json-editor').value = JSON.stringify(currentData, null, 2);

    render();
    setStatus('Live-Vorschau aktiv', true);
    } catch (e) {
    setStatus('Fehler: ' + e.message, false);
    console.error(e);
    }
})();

// ================================================
// STATUS
// ================================================
function setStatus(msg, ok) {
    document.getElementById('status-text').textContent = msg;
    document.getElementById('status-dot').style.background = ok ? '#4CAF50' : '#F44336';
}

// ================================================
// JSON HANDLING
// ================================================
function onJsonInput(ta) {
    clearTimeout(jsonDebounce);
    const st = document.getElementById('json-status');
    try {
    JSON.parse(ta.value);
    st.textContent = '✓ Gültig';
    st.className = 'ok';
    jsonDebounce = setTimeout(() => applyJson(), 600);
    } catch (e) {
    st.textContent = '✗ ' + e.message.substring(0, 40);
    st.className = 'err';
    }
}

function applyJson() {
    try {
    currentData = JSON.parse(document.getElementById('json-editor').value);

    // Globale Variablen bei manuellem Input aktualisieren
    updateGlobalConstants();

    render();
    setStatus('Aktualisiert um ' + new Date().toLocaleTimeString('de-DE'), true);
    } catch (e) { }
}

// Helper zur Ermittlung des Ortes für Datumszeilen ("Stadt, Datum")
function getBewerbungOrt(b) {
    if (b.adresse && b.adresse.ort && b.adresse.ort.trim() !== '') {
    return b.adresse.ort;
    }
    return b.ort || '';
}

function loadJsonFile() { document.getElementById('json-file-input').click(); }

function loadFotoFile() { document.getElementById('foto-file-input').click(); }

function handleFotoFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
    const dataUrl = ev.target.result;
    currentData.person = currentData.person || {};
    currentData.person.foto = dataUrl;
    // Sidebar-Vorschau zeigen
    document.getElementById('foto-preview').src = dataUrl;
    document.getElementById('foto-preview-wrap').style.display = 'block';
    // JSON-Editor: Foto-Base64 durch Platzhalter ersetzen (zu lang zum Anzeigen)
    const displayData = JSON.parse(JSON.stringify(currentData));
    displayData.person.foto = '[Bild geladen – ' + Math.round(dataUrl.length / 1024) + ' KB]';
    document.getElementById('json-editor').value = JSON.stringify(displayData, null, 2);
    render();
    setStatus('Foto geladen: ' + file.name, true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
}

function removeFoto() {
    if (currentData.person) currentData.person.foto = '';
    document.getElementById('foto-preview-wrap').style.display = 'none';
    document.getElementById('json-editor').value = JSON.stringify(currentData, null, 2);
    render();
    setStatus('Foto entfernt', true);
}

function handleJsonFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
    try {
        currentData = JSON.parse(ev.target.result);

        // Globale Variablen bei Datei-Upload aktualisieren
        updateGlobalConstants();

        document.getElementById('json-editor').value = JSON.stringify(currentData, null, 2);
        document.getElementById('json-status').textContent = '✓ Gültig';
        document.getElementById('json-status').className = 'ok';
        render();
        setStatus('JSON geladen: ' + file.name, true);
    } catch (err) {
        setStatus('JSON-Fehler: ' + err.message, false);
    }
    };
    reader.readAsText(file);
}

// ================================================
// TEMPLATE ENGINE  –  {key.subkey} replacement
// ================================================
function resolve(tpl, data) {
    return tpl.replace(/\{([^}]+)\}/g, (_, path) => {
    const val = path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), data);
    return val !== undefined ? val : '';
    });
}

function get(path) {
    return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), currentData);
}

// ================================================
// RENDER PIPELINE
// ================================================
function render() {
    const container = document.getElementById('pages-container');
    container.innerHTML = '';

    container.appendChild(buildDeckblatt());
    container.appendChild(buildAnschreiben());
    container.appendChild(buildLebenslauf());
    const seite2 = buildLebenslaufSeite2();
    if (seite2) container.appendChild(seite2);
    const anlagenDeckblatt = buildAnlagenDeckblatt();
    if (anlagenDeckblatt) container.appendChild(anlagenDeckblatt);
}

// ================================================
// PAGE 1 – DECKBLATT
// ================================================
function buildDeckblatt() {
    const d = currentData;
    const p = d.person || {};
    const b = d.bewerbung || {};

    const page = el('div', 'a4-page');
    const inner = el('div', 'seite-deckblatt');

    // Kopf
    const kopf = el('div', 'deckblatt-kopf');
    const empf = el('div', 'deckblatt-empfaenger');

    // Basis-Empfängerzeile mit Anrede (Frau/Herr), falls vorhanden
    let zeile2 = '';
    if (partner && partner.trim() !== '') {
    const prefix = (sex === 'm') ? 'Herr ' : (sex === 'w') ? 'Frau ' : '';
    zeile2 = prefix + partner;
    } else if (abteilung) {
    zeile2 = abteilung;
    }

    let empfHTML = `<strong>${b.unternehmen || ''}</strong>`;
    if (zeile2) {
    empfHTML += `<br>${zeile2}`;
    }

    // Firmenadresse auf dem Deckblatt sinnvoll ergänzen
    if (b.adresse && b.adresse.straße && b.adresse.straße.trim() !== '') {
    empfHTML += `<br>${b.adresse.straße}`;
    const plz = b.adresse.plz || '';
    const ort = b.adresse.ort || '';
    if (plz || ort) {
        empfHTML += `<br>${[plz, ort].filter(Boolean).join(' ')}`;
    }
    } else {
    // Altes Fallback-Format für das Deckblatt
    if (b.strasse) empfHTML += `<br>${b.strasse}`;
    if (b.plz_ort) empfHTML += `<br>${b.plz_ort}`;
    }

    empf.innerHTML = empfHTML;
    kopf.appendChild(empf);

    const fotoWrap = el('div', 'deckblatt-foto-wrap');
    if (p.foto) {
    const img = document.createElement('img');
    img.src = p.foto;
    img.alt = 'Bewerbungsfoto';
    fotoWrap.appendChild(img);
    } else {
    const ph = el('div', 'deckblatt-foto-placeholder');
    ph.textContent = 'Foto\nhier';
    fotoWrap.appendChild(ph);
    }
    kopf.appendChild(fotoWrap);
    inner.appendChild(kopf);

    // Akzentlinie
    inner.appendChild(el('div', 'deckblatt-akzent'));

    // Mitte
    const mitte = el('div', 'deckblatt-mitte');
    const label = el('div', 'deckblatt-bewerbung-label');
    label.textContent = 'Bewerbung';
    mitte.appendChild(label);

    const name = el('div', 'deckblatt-name');
    name.innerHTML = `${p.vorname || ''}<br><strong>${p.nachname || ''}</strong>`;
    mitte.appendChild(name);

    const trenn = el('div', 'deckblatt-trenn');
    mitte.appendChild(trenn);

    const stelle = el('div', 'deckblatt-stelle');
    stelle.textContent = 'als ' + (b.stelle || '');
    mitte.appendChild(stelle);
    inner.appendChild(mitte);

    // Fuß
    const fuss = el('div', 'deckblatt-fuss');
    const kz = el('div', 'deckblatt-kontakt-zeilen');

    const kontakte = [
    { icon: '📍', text: [p.adresse, p.plz + ' ' + p.stadt].filter(Boolean).join(' · ') },
    { icon: '📞', text: p.telefon },
    { icon: '✉', text: p.email },
    { icon: '🔗', text: p.linkedin },
    { icon: '🐙', text: p.GitHub },
    ];

    kontakte.forEach(k => {
    if (!k.text) return;
    const item = el('div', 'kontakt-item');
    const ic = el('span', 'icon');
    ic.textContent = k.icon;
    item.appendChild(ic);

    if (k.text.includes('github.com')) {
        const lines = k.text.split('\n');
        const labels = ['Frontend-SkillNest', 'Backend-SkillNest'];
        lines.forEach((line, idx) => {
        if (idx > 0) item.appendChild(document.createElement('br'));
        const urlMatch = line.match(/https?:\/\/\S+/);
        if (urlMatch) {
            const a = el('a', '');
            a.href = urlMatch[0];
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.style.color = 'inherit';
            a.textContent = labels[idx] || urlMatch[0];
            item.appendChild(a);
        } else {
            item.appendChild(txt(line));
        }
        });
    } else {
        item.appendChild(txt(k.text));
    }
    kz.appendChild(item);
    });

    fuss.appendChild(kz);

    const datumWrap = el('div', '');
    datumWrap.style.textAlign = 'right';
    datumWrap.style.fontSize = '8pt';
    datumWrap.style.color = '#6A7A90';
    datumWrap.textContent = `${getBewerbungOrt(b)}, ${b.datum || aktuellesDatum}`;
    fuss.appendChild(datumWrap);
    inner.appendChild(fuss);

    page.appendChild(inner);
    page.dataset.pageId = 'deckblatt';
    return page;
}

// ================================================
// PAGE 2 – ANSCHREIBEN
// ================================================
function buildAnschreiben() {
    const p = currentData.person || {};
    const b = currentData.bewerbung || {};
    const a = currentData.anschreiben || {};
    const anlagen = currentData.anlagen || [];

    const page = el('div', 'a4-page');
    const inner = el('div', 'seite-anschreiben');

    // Topline
    inner.appendChild(el('div', 'anschreiben-topline'));

    // Absender rechts
    const abs = el('div', 'anschreiben-absender');
    abs.innerHTML = `
    <div class="abs-name">${p.vorname || ''} ${p.nachname || ''}</div>
    <div class="abs-info">${p.adresse || ''}, ${p.plz || ''} ${p.stadt || ''}<br>${p.telefon || ''} · ${p.email || ''}</div>
    `;
    inner.appendChild(abs);

    // Empfänger links mit vollständiger Anschrift
    const emp = el('div', 'anschreiben-empfaenger');
    let empHTML = `<div class="emp-firma"><strong>${b.unternehmen || ''}</strong></div>`;

    if (partner) {
    const prefix = (sex === 'm') ? 'Herr ' : (sex === 'w') ? 'Frau ' : '';
    empHTML += `<div class="emp-person">${prefix}${partner}</div>`;
    } else if (abteilung) {
    empHTML += `<div class="emp-abteilung">${abteilung}</div>`;
    }

    // Flexibles Einbinden der Firmenadresse (Objekt-Struktur vs. alte Keys)
    if (b.adresse && b.adresse.straße && b.adresse.straße.trim() !== '') {
    empHTML += `<div class="emp-strasse">${b.adresse.straße}</div>`;
    const plz = b.adresse.plz || '';
    const ort = b.adresse.ort || '';
    if (plz || ort) {
        empHTML += `<div class="emp-ort">${[plz, ort].filter(Boolean).join(' ')}</div>`;
    }
    } else {
    if (b.strasse) {
        empHTML += `<div class="emp-strasse">${b.strasse}</div>`;
    }
    if (b.plz_ort) {
        empHTML += `<div class="emp-ort">${b.plz_ort}</div>`;
    }
    }

    emp.innerHTML = empHTML;
    inner.appendChild(emp);

    // Datum
    const datum = el('div', 'brief-datum');
    datum.textContent = `${getBewerbungOrt(b)}, ${b.datum || aktuellesDatum}`;
    inner.appendChild(datum);

    // Betreff
    const betreff = el('div', 'brief-betreff');
    betreff.textContent = a.betreff || '';
    inner.appendChild(betreff);

    // Anrede
    const anrede = el('div', 'brief-anrede');
    if (partner && (sex === 'm' || sex === 'w')) {
    const title = (sex === 'm') ? 'Herr' : 'Frau';
    anrede.textContent = `Sehr geehrte${sex === 'm' ? 'r' : ''} ${title} ${partner},`;
    } else {
    anrede.textContent = `Sehr geehrte Damen und Herren,`;
    }
    inner.appendChild(anrede);

    // Absätze
    ['einleitung', 'hauptteil', 'schluss'].forEach(key => {
    if (!a[key]) return;
    const p_ = el('p', 'brief-absatz');
    p_.textContent = a[key];
    inner.appendChild(p_);
    });

    // Gruss
    const gruss = el('div', 'brief-gruss-block');
    gruss.innerHTML = `
    <div class="brief-gruss">Mit freundlichen Grüßen</div>
    <div class="brief-unterschrift">${p.vorname || ''} ${p.nachname || ''}</div>
    `;
    inner.appendChild(gruss);

    // Anlagen
    if (anlagen.length) {
    const ablk = el('div', 'anlagen-block');
    const lbl = el('div', 'anlagen-label');
    lbl.textContent = 'Anlagen:';
    ablk.appendChild(lbl);

    const ul = el('ul', 'anlagen-liste');
    anlagen.forEach(a_ => {
        const li = document.createElement('li');
        li.textContent = (typeof a_ === 'string') ? a_ : a_.name;
        ul.appendChild(li);
    });
    ablk.appendChild(ul);
    inner.appendChild(ablk);
    }

    page.appendChild(inner);
    page.dataset.pageId = 'anschreiben';
    return page;
}

// ================================================
// PAGE 3 – LEBENSLAUF (Berufserfahrung)
// ================================================
function buildLebenslauf() {
    const p = currentData.person || {};
    const b = currentData.bewerbung || {};
    const lv = currentData.lebenslauf || {};
    const k = lv.kenntnisse || {};

    const page = el('div', 'a4-page');
    const inner = el('div', 'seite-lebenslauf');

    // ---- LEFT ----
    const links = el('div', 'cv-links');

    // Foto
    const fotoWrap = el('div', 'cv-foto-wrap');
    if (p.foto) {
    const img = document.createElement('img');
    img.src = p.foto; img.alt = '';
    fotoWrap.appendChild(img);
    } else {
    const ph = el('div', 'cv-foto-placeholder');
    ph.textContent = 'Bewerbungsfoto';
    fotoWrap.appendChild(ph);
    }
    links.appendChild(fotoWrap);

    // Kontakt
    links.appendChild(cvBlock('Kontakt', buildKontaktLinks(p)));

    // Kenntnisse
    if (k.technisch?.length) {
    links.appendChild(cvBlock('Kenntnisse', buildTagListe(k.technisch)));
    }

    // Sprachen
    if (k.sprachen?.length) {
    links.appendChild(cvBlock('Sprachen', buildSprachenListe(k.sprachen)));
    }

    // Zertifikate
    if (lv.zertifikate?.length) {
    links.appendChild(cvBlock('Zertifikate', buildZertListe(lv.zertifikate)));
    }

    // Interessen
    if (lv.interessen?.length) {
    links.appendChild(cvBlock('Interessen', buildTagListe(lv.interessen)));
    }

    // ---- RIGHT ----
    const rechts = el('div', 'cv-rechts');

    // Name
    const nameBlock = el('div', '');
    nameBlock.innerHTML = `
    <div class="cv-vollname">${p.vorname || ''} ${p.nachname || ''}</div>
    <div class="cv-bewerbungsstelle">${b.stelle || ''}</div>
    <div class="cv-trenn"></div>
    `;
    rechts.appendChild(nameBlock);

    // Profil
    if (lv.profil) {
    const profilSect = el('div', '');
    profilSect.innerHTML = `<div class="cv-abschnitt-titel">Profil</div>`;
    const pt = el('p', 'cv-profil-text');
    pt.textContent = lv.profil;
    profilSect.appendChild(pt);
    rechts.appendChild(profilSect);
    }

    // Berufserfahrung
    if (lv.berufserfahrung?.length) {
    rechts.appendChild(cvRechtsBlock('Berufserfahrung', buildTimeline(lv.berufserfahrung)));
    }

    inner.appendChild(links);
    inner.appendChild(rechts);
    page.appendChild(inner);
    page.dataset.pageId = 'lebenslauf';
    return page;
}

// ================================================
// PAGE 4 – LEBENSLAUF (Ausbildung)
// ================================================
function buildLebenslaufSeite2() {
    const p = currentData.person || {};
    const b = currentData.bewerbung || {};
    const lv = currentData.lebenslauf || {};

    if (!lv.ausbildung?.length) return null;

    const page = el('div', 'a4-page');
    const inner = el('div', 'seite-lebenslauf');

    // ---- LEFT (Fortsetzung) ----
    const links = el('div', 'cv-links');
    const fortsLabel = el('div', 'cv-block-titel');
    fortsLabel.textContent = 'Ausbildung';
    fortsLabel.style.paddingTop = '4mm';
    links.appendChild(fortsLabel);

    // ---- RIGHT ----
    const rechts = el('div', 'cv-rechts');
    rechts.appendChild(cvRechtsBlock('Ausbildung', buildTimelineAusbildung(lv.ausbildung)));

    inner.appendChild(links);
    inner.appendChild(rechts);
    page.appendChild(inner);
    page.dataset.pageId = 'lebenslauf-2';
    return page;
}

// ================================================
// PAGE 5 – ANLAGEN-TRENNBLATT
// ================================================
function buildAnlagenDeckblatt() {
    const anlagen = currentData.anlagen || [];
    if (!anlagen.length) return null;

    const page = el('div', 'a4-page');
    const inner = el('div', 'seite-anlagen-deckblatt');

    const kopf = el('div', 'anlagen-kopf');
    const label = el('div', 'anlagen-kopf-label');
    label.textContent = 'Bewerbungsmappe';
    kopf.appendChild(label);
    const titel = el('div', 'anlagen-kopf-titel');
    titel.textContent = 'Anlagen';
    kopf.appendChild(titel);
    inner.appendChild(kopf);

    inner.appendChild(el('div', 'anlagen-akzent'));

    const uebersicht = el('div', 'anlagen-uebersicht');
    anlagen.forEach((a_, idx) => {
    const name = (typeof a_ === 'string') ? a_ : a_.name;
    const seiten = (typeof a_ === 'string') ? null : a_.seiten;

    const row = el('div', 'anlagen-eintrag');
    const nr = el('div', 'anlagen-eintrag-nr');
    nr.textContent = String(idx + 1).padStart(2, '0');
    row.appendChild(nr);

    const text = el('div', 'anlagen-eintrag-text');
    text.textContent = name;
    row.appendChild(text);

    if (seiten) {
        const sz = el('div', 'anlagen-eintrag-seiten');
        sz.textContent = seiten === 1 ? '1 Seite' : seiten + ' Seiten';
        row.appendChild(sz);
    }

    uebersicht.appendChild(row);
    });
    inner.appendChild(uebersicht);

    page.appendChild(inner);
    page.dataset.pageId = 'anlagen-deckblatt';
    return page;
}

// ---- CV helpers ----
function cvBlock(title, content) {
    const wrap = el('div', '');
    const t = el('div', 'cv-block-titel');
    t.textContent = title;
    wrap.appendChild(t);
    wrap.appendChild(content);
    return wrap;
}

function cvRechtsBlock(title, content) {
    const wrap = el('div', '');
    const t = el('div', 'cv-abschnitt-titel');
    t.textContent = title;
    wrap.appendChild(t);
    wrap.appendChild(content);
    return wrap;
}

function buildKontaktLinks(p) {
    const wrap = el('div', '');
    const items = [
    { icon: '📍', text: `${p.adresse || ''}, ${p.plz || ''} ${p.stadt || ''}` },
    { icon: '📞', text: p.telefon },
    { icon: '✉', text: p.email },
    { icon: '🔗', text: p.linkedin },
    ];
    items.forEach(i => {
    if (!i.text?.trim()) return;
    const div = el('div', 'cv-kontakt-item');
    const ic = el('span', 'ci-icon');
    ic.textContent = i.icon;
    div.appendChild(ic);
    div.appendChild(txt(i.text));
    wrap.appendChild(div);
    });
    return wrap;
}

function buildTagListe(items) {
    const wrap = el('div', 'cv-tags');
    items.forEach(i => {
    const t = el('span', 'cv-tag');
    t.textContent = i;
    wrap.appendChild(t);
    });
    return wrap;
}

function buildSprachenListe(items) {
    const wrap = el('div', '');
    items.forEach(s => {
    const div = el('div', 'cv-sprache-item');
    div.innerHTML = `<div class="cv-sprache-name">${s.sprache}</div><div class="cv-sprache-niveau">${s.niveau}</div>`;
    wrap.appendChild(div);
    });
    return wrap;
}

function buildZertListe(items) {
    const wrap = el('div', '');
    items.forEach(z => {
    const div = el('div', 'cv-zertifikat-item');
    div.innerHTML = `<div class="cv-zertifikat-name">${z.name}</div><div class="cv-zertifikat-jahr">${z.jahr}</div>`;
    wrap.appendChild(div);
    });
    return wrap;
}

function buildTimeline(items) {
    const tl = el('div', 'cv-timeline');
    items.forEach(item => {
    const row = el('div', 'cv-tl-item');
    const zr = el('div', 'cv-tl-zeitraum');
    zr.textContent = item.zeitraum;
    row.appendChild(zr);

    const inhalt = el('div', 'cv-tl-inhalt');
    inhalt.innerHTML = `
        <div class="cv-tl-titel">${item.position || ''}</div>
        <div class="cv-tl-sub">${item.unternehmen || ''} · ${item.ort || ''}</div>
    `;
    if (item.aufgaben?.length) {
        const ul = el('ul', 'cv-tl-aufgaben');
        item.aufgaben.forEach(a => {
        const li = document.createElement('li');
        const match = a.match(/^(Frontend|Backend):\s*(https?:\/\/\S+)/i);
        if (match) {
            const link = el('a', '');
            link.href = match[2];
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.style.color = 'inherit';
            link.textContent = match[1] + '-SkillNest';
            li.appendChild(link);
        } else {
            li.textContent = a;
        }
        ul.appendChild(li);
        });
        inhalt.appendChild(ul);
    }
    row.appendChild(inhalt);
    tl.appendChild(row);
    });
    return tl;
}

function buildTimelineAusbildung(items) {
    const tl = el('div', 'cv-timeline');
    items.forEach(item => {
    const row = el('div', 'cv-tl-item');
    const zr = el('div', 'cv-tl-zeitraum');
    zr.textContent = item.zeitraum;
    row.appendChild(zr);

    const inhalt = el('div', 'cv-tl-inhalt');
    inhalt.innerHTML = `
        <div class="cv-tl-titel">${item.abschluss || ''}</div>
        <div class="cv-tl-sub">${item.institution || ''}</div>
        ${item.note ? `<div class="cv-tl-note">Note: ${item.note}</div>` : ''}
    `;
    row.appendChild(inhalt);
    tl.appendChild(row);
    });
    return tl;
}

// ================================================
// UTILS
// ================================================
function el(tag, cls) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
}

function txt(str) {
    return document.createTextNode(str);
}

// ================================================
// NAVIGATION
// ================================================
function scrollToPage(id, navItem) {
    const target = document.querySelector(`.a4-page[data-page-id="${id}"]`);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });

    document.querySelectorAll('.page-nav-item').forEach(i => i.classList.remove('active'));
    if (navItem) navItem.classList.add('active');
}

// ================================================
// PRINT
// ================================================
function doPrint() {
    window.print();
}