// Shoelace-Themes wie in d2beam-gui: hell/dunkel folgt der Systemeinstellung
import '@shoelace-style/shoelace/dist/themes/light.css';
import '@shoelace-style/shoelace/dist/themes/dark.css';

import './components/dr-haupt';
import {app, byId, Detect} from './state';
import {setzeAnzahl, setzePunkte, leereTabelle, zaehlerGeaendert, tabelleZeilenGeaendert, ZAEHLER_ID, TABELLE_ID, START_Y, START_Z} from './punkte';
import {rechnen, zeichne2D} from './rechnen';
import {initDateien} from './dateien';
import {initAutosave} from './autosave';
import {starteVersionspruefung} from './sw_update';
import {initEinstellungen} from './einstellungen';
import {enableTouchHints} from './components/touch_hint';
import {confirmdialog} from './components/confirm_dialog';

// dunkles Theme von Shoelace über die Klasse sl-theme-dark (wie d2beam-gui)
const dunkel = window.matchMedia('(prefers-color-scheme: dark)');
const themaSetzen = () => document.documentElement.classList.toggle('sl-theme-dark', dunkel.matches);
themaSetzen();
dunkel.addEventListener('change', themaSetzen);

function geraeteInfo(): void {
    const info = byId('infoBox');
    const zeilen = [
        `Bildschirm: ${document.documentElement.clientWidth} × ${document.documentElement.clientHeight} px, Pixeldichte ${window.devicePixelRatio}`,
        `Browser: ${Detect.browser} ${Detect.version ?? ''}`,
        `Betriebssystem: ${Detect.OS}${app.isMac ? ' (Mac)' : ''}`,
        `Touch-Punkte: ${navigator.maxTouchPoints}`,
        `Dateidialog (showSaveFilePicker): ${app.hasFSAccess ? 'ja' : 'nein, Speichern als Download'}`,
    ];
    info.innerHTML = zeilen.join('<br>');
    navigator.permissions?.query({name: 'clipboard-write' as PermissionName}).then(result => {
        info.innerHTML += `<br>Zwischenablage schreiben: ${result.state === 'denied' ? 'nicht erlaubt' : 'erlaubt'}`;
    }).catch(() => {
        info.innerHTML += '<br>Zwischenablage schreiben: nicht unterstützt';
    });
}

async function neueEingabe(): Promise<void> {
    if (!await confirmdialog('ja', 'nein', 'Neue Eingabe beginnen? Die aktuelle Eingabe wird gelöscht.')) return;
    for (const id of ['N_kraft', 'My', 'Mz']) byId<HTMLInputElement>(id).value = '';
    setzeAnzahl(4);
    leereTabelle();
    byId('id_dateiname').textContent = '';
}

async function start(): Promise<void> {
    const haupt = byId('id_haupt') as HTMLElementTagNameMap['dr-haupt'];
    await haupt.updateComplete;

    // Startbeispiel, danach ggf. letzte Eingabe wiederherstellen
    setzePunkte(START_Y, START_Z);

    byId('rechnen').addEventListener('click', () => rechnen());
    byId('neueEingabe').addEventListener('click', () => void neueEingabe());
    byId(ZAEHLER_ID).addEventListener('change', zaehlerGeaendert);
    byId(TABELLE_ID).addEventListener('rows-changed', tabelleZeilenGeaendert);
    initDateien();
    initEinstellungen();
    // Hilfetext bei langem Drücken (Finger/Stift) bzw. Überfahren (Maus) wie in d2beam-gui
    enableTouchHints(byId('id_file_toolbar'));
    enableTouchHints(byId('id_panel_einstellungen'));
    geraeteInfo();
    // vor dem ersten Rechnen ist eine Berechnung erforderlich → Rechnen-Button in Akzentfarbe
    byId('rechnen').classList.add('veraltet');

    // nach dem Rechnen auf den Tab Ergebnisse wechseln
    document.addEventListener('berechnet', ev => {
        byId('id_hinweis_rechnen').hidden = true;
        byId('rechnen').classList.remove('veraltet');
        if ((ev as CustomEvent).detail?.zeigeErgebnisse) haupt.zeigeTab('ergebnisse');
    });
    // Eingabe geändert → Rechnen-Button in Akzentfarbe (wie d2beam-gui)
    document.addEventListener('berechnung-erforderlich', () => {
        byId('rechnen').classList.add('veraltet');
    });
    for (const id of ['N_kraft', 'My', 'Mz']) {
        byId(id).addEventListener('input', () => document.dispatchEvent(new CustomEvent('berechnung-erforderlich')));
    }

    // 2D-Grafik erst zeichnen, wenn ihr Tab sichtbar ist (vorher hat sie keine Größe)
    haupt.addEventListener('sl-tab-show', ev => {
        if ((ev as CustomEvent).detail?.name === 'ergebnisse') requestAnimationFrame(zeichne2D);
    });
    let resizeTimer = 0;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(zeichne2D, 150);
    });

    // letzte Eingabe wiederherstellen und künftig automatisch sichern
    initAutosave();

    // Service Worker registrieren und auf neue Versionen prüfen (auch beim Zurückkehren aus dem Hintergrund)
    starteVersionspruefung();
}

void start();
