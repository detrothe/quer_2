/*
 * Umgebung für die aus d2beam-gui übernommenen Komponenten (dr-tabelle.ts).
 *
 * dr-tabelle.ts ist bis auf die Import-Zeilen unverändert aus d2beam-gui kopiert, damit sich
 * Verbesserungen von dort leicht übernehmen lassen. Die Module, die dr-tabelle in d2beam-gui
 * importiert (querschnitte, haupt, globals, utility, @lit/localize, confirm_dialog), werden
 * hier durch das ersetzt, was quer_2 braucht.
 */

import {app, Detect} from '../state';

export {Detect};

// --- pages/querschnitte: quer_2 hat keine Auswahlspalten (select) mit Querschnitten
export const nQuerschnittSets = 0;

export function get_querschnittRechteck_name(index: number): string {
    return 'Querschnitt ' + (index + 1);
}

// --- pages/globals
/** Fingerauswahl (Ziehen über mehrere Zellen) in Tabellen erlauben – wie Standard in d2beam-gui. */
export const touch_support_table = true;

/** Eingabe geändert: angezeigte Ergebnisse passen nicht mehr dazu. */
export function berechnungErforderlich(erforderlich = true): void {
    if (!erforderlich) return;
    app.berechnungErforderlich = true;
    document.dispatchEvent(new CustomEvent('berechnung-erforderlich'));
}

// --- pages/utility
export function write(text: string): void {
    console.log(text);
}

// --- @lit/localize: quer_2 ist nur deutsch, Texte unverändert zurückgeben
export function msg(text: string): string {
    return text;
}

export function str(strings: TemplateStringsArray, ...werte: unknown[]): string {
    return strings.reduce((s, teil, i) => s + teil + (i < werte.length ? String(werte[i]) : ''), '');
}

// --- pages/confirm_dialog: unverändert aus d2beam-gui übernommen
export {ConfirmDialog} from './confirm_dialog';
