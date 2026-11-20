/*
 * Tab ꔷꔷꔷ (Einstellungen) wie in d2beam-gui: Farben der Tabellen und Akzentfarbe.
 *
 * Änderungen wirken sofort; dauerhaft (für den nächsten Start) erst nach
 * „Auswahl als Standardwerte im Browser speichern“ – wie in d2beam-gui.
 *
 * Wirkung über CSS-Variablen am Dokument (werden auch in Shadow-DOMs vererbt):
 *   --table_bg / --table_fg  → dr-tabelle und Titelleiste des Controls-Panels in 3D
 *   --user_accent + <html data-accent> → Shoelace-Primärfarbe (aktiver Tab, Rechnen-Button …), siehe main.css
 */

import '@shoelace-style/shoelace/dist/components/color-picker/color-picker.js';
import {byId} from './state';
import {alertdialog} from './components/confirm_dialog';

const STANDARD_TABELLE = '#cfd915';   // wie d2beam-gui
const STANDARD_AKZENT = '#0284c7';    // Shoelace sky-600

// eigener Präfix: lokal laufen mehrere Apps auf localhost und teilen sich sonst den Speicher
const KEY_TABELLE = 'POLYQUER_color_table_out';
const KEY_TEXT = 'POLYQUER_color_table_text';
const KEY_AKZENT = 'POLYQUER_accent_color';

type Picker = HTMLElement & { value: string };

function picker(id: string): Picker {
    return byId(id) as Picker;
}

/** schwarz oder weiß, je nachdem was auf der Hintergrundfarbe besser lesbar ist (WCAG-Luminanz, aus d2beam-gui) */
function kontrastfarbe(hex: string): string {
    const m = /^#([0-9a-f]{6})$/i.exec(hex);
    if (!m) return '#000000';
    const n = parseInt(m[1], 16);
    const lin = (c: number) => {
        c /= 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
    return (L + 0.05) / 0.05 >= 1.05 / (L + 0.05) ? '#000000' : '#ffffff';
}

function tabellenfarben(hintergrund: string, text: string): void {
    const root = document.documentElement;
    root.style.setProperty('--table_bg', hintergrund);
    root.style.setProperty('--table_fg', text);
}

/** null = Shoelace-Standard (Blau) */
function akzentfarbe(farbe: string | null): void {
    const root = document.documentElement;
    if (farbe) {
        root.style.setProperty('--user_accent', farbe);
        root.dataset.accent = '1';
    } else {
        root.style.removeProperty('--user_accent');
        delete root.dataset.accent;
    }
}

function lesen(key: string): string | null {
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

function geaendert(ja: boolean): void {
    byId('id_cb_saveLocalStorage').classList.toggle('speichern_hinweis', ja);
    byId('id_speichern_hinweis').hidden = !ja;
}

function speichern(): void {
    try {
        window.localStorage.setItem(KEY_TABELLE, picker('id_color_table_out').value);
        window.localStorage.setItem(KEY_TEXT, picker('id_color_table_text').value);
        // Akzentfarbe nur speichern, wenn eine eigene gewählt ist (sonst Standard behalten)
        if (document.documentElement.dataset.accent) window.localStorage.setItem(KEY_AKZENT, picker('id_accent_color').value);
        else window.localStorage.removeItem(KEY_AKZENT);
        geaendert(false);
    } catch (e) {
        void alertdialog('ok', 'Speichern im Browser nicht möglich: ' + (e instanceof Error ? e.message : String(e)));
    }
}

function loeschen(): void {
    try {
        for (const key of [KEY_TABELLE, KEY_TEXT, KEY_AKZENT]) window.localStorage.removeItem(key);
    } catch { /* nichts zu tun */ }
    picker('id_color_table_out').value = STANDARD_TABELLE;
    picker('id_color_table_text').value = kontrastfarbe(STANDARD_TABELLE);
    picker('id_accent_color').value = STANDARD_AKZENT;
    tabellenfarben(STANDARD_TABELLE, kontrastfarbe(STANDARD_TABELLE));
    akzentfarbe(null);
    geaendert(false);
}

/** Gespeicherte Einstellungen anwenden und die Bedienelemente im Tab ꔷꔷꔷ verdrahten. */
export function initEinstellungen(): void {
    const tabelle = lesen(KEY_TABELLE) ?? STANDARD_TABELLE;
    const text = lesen(KEY_TEXT) ?? kontrastfarbe(tabelle);
    const akzent = lesen(KEY_AKZENT);

    picker('id_color_table_out').value = tabelle;
    picker('id_color_table_text').value = text;
    picker('id_accent_color').value = akzent ?? STANDARD_AKZENT;
    tabellenfarben(tabelle, text);
    akzentfarbe(akzent);
    geaendert(false);

    // neue Hintergrundfarbe → Textfarbe automatisch hell oder dunkel
    byId('id_color_table_out').addEventListener('sl-input', () => {
        const bg = picker('id_color_table_out').value;
        const fg = kontrastfarbe(bg);
        picker('id_color_table_text').value = fg;
        tabellenfarben(bg, fg);
        geaendert(true);
    });
    byId('id_color_table_text').addEventListener('sl-input', () => {
        tabellenfarben(picker('id_color_table_out').value, picker('id_color_table_text').value);
        geaendert(true);
    });
    byId('id_accent_color').addEventListener('sl-input', () => {
        akzentfarbe(picker('id_accent_color').value);
        geaendert(true);
    });
    byId('id_accent_color_reset').addEventListener('click', () => {
        akzentfarbe(null);
        picker('id_accent_color').value = STANDARD_AKZENT;
        geaendert(true);
    });
    byId('id_cb_saveLocalStorage').addEventListener('click', speichern);
    byId('id_cb_deleteLocalStorage').addEventListener('click', loeschen);
}
