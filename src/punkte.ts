/*
 * Zugriff auf die Punkte-Tabelle (dr-tabelle aus d2beam-gui) und den Zähler „Anzahl Punkte“.
 *
 * dr-tabelle legt ihre Tabelle im (offenen) Shadow DOM an: <table id="mytable">, Zeile 0 ist die
 * Kopfzeile, Spalte 0 die Nummer, Spalte 1 = y, Spalte 2 = z; in jeder Zelle steckt ein <input>.
 * Alle Zugriffe darauf laufen über dieses Modul.
 */

import {byId} from './state';
import type {drButtonPM} from './components/dr-button-pm';

export const TABELLE_ID = 'id_punkte_tabelle';
export const ZAEHLER_ID = 'id_button_npkte';
export const MIN_PUNKTE = 3;

// Startbeispiel: Rahmenquerschnitt mit 10 Punkten (Loch über einen Schlitz)
export const START_Y = [0, 30, 30, 0, 10, 20, 20, 10, 10, 0];
export const START_Z = [0, 0, 30, 30, 20, 20, 10, 10, 20, 30];

function tabelleElement(): HTMLElement {
    return byId(TABELLE_ID);
}

function mytable(): HTMLTableElement {
    const t = tabelleElement().shadowRoot?.getElementById('mytable');
    if (!t) throw new Error('Punkte-Tabelle noch nicht aufgebaut');
    return t as HTMLTableElement;
}

function zelle(zeile: number, spalte: number): HTMLInputElement {
    return mytable().rows[zeile].cells[spalte].firstElementChild as HTMLInputElement;
}

export function anzahlPunkte(): number {
    return mytable().rows.length - 1;
}

/** Zeilenzahl der Tabelle und den Zähler auf n setzen. */
export function setzeAnzahl(n: number): void {
    n = Math.max(MIN_PUNKTE, Math.round(n));
    byId<drButtonPM>(ZAEHLER_ID).setValue(n);
    tabelleElement().setAttribute('nzeilen', String(n));
}

/** Zähler wurde geändert → Tabelle anpassen. */
export function zaehlerGeaendert(): void {
    const n = byId<drButtonPM>(ZAEHLER_ID).getValue();
    tabelleElement().setAttribute('nzeilen', String(Math.max(MIN_PUNKTE, n)));
}

export interface Punkte {
    y: Float64Array;
    z: Float64Array;
    fehler: number;   // Anzahl ungültiger Eingaben (werden als 0 gerechnet und markiert)
}

/** Koordinaten lesen; leere Zellen zählen als 0, ungültige werden markiert und als 0 gewertet. */
export function lesePunkte(): Punkte {
    const n = anzahlPunkte();
    const y = new Float64Array(n);
    const z = new Float64Array(n);
    let fehler = 0;
    const lese = (zeile: number, spalte: number): number => {
        const input = zelle(zeile, spalte);
        const wert = Number(input.value.replace(/,/g, '.'));
        const ungueltig = input.validity.badInput || !Number.isFinite(wert);
        input.style.backgroundColor = ungueltig ? 'salmon' : '';
        if (ungueltig) fehler++;
        return ungueltig ? 0 : wert;
    };
    for (let i = 0; i < n; i++) {
        y[i] = lese(i + 1, 1);
        z[i] = lese(i + 1, 2);
    }
    return {y, z, fehler};
}

/** Rohwerte (Text) der Zellen, z.B. zum Speichern. */
export function leseRohwerte(): { y: string[]; z: string[] } {
    const n = anzahlPunkte();
    const y: string[] = [], z: string[] = [];
    for (let i = 1; i <= n; i++) {
        y.push(zelle(i, 1).value);
        z.push(zelle(i, 2).value);
    }
    return {y, z};
}

/** Tabelle auf die Länge von y/z bringen und füllen. */
export function setzePunkte(y: ArrayLike<number | string | null>, z: ArrayLike<number | string | null>): void {
    setzeAnzahl(y.length);
    for (let i = 0; i < y.length; i++) {
        zelle(i + 1, 1).value = y[i] === null ? '' : String(y[i]);
        zelle(i + 1, 2).value = z[i] === null ? '' : String(z[i]);
    }
}

/** Alle Koordinaten löschen (Zeilenzahl bleibt). */
export function leereTabelle(): void {
    tabelleElement().setAttribute('clear', String(Date.now()));
}
