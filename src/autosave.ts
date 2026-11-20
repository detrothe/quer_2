import {app} from './state';
import {eingabeAlsJSON, eingabeEinlesen} from './dateien';
import {rechnen} from './listener';

/*
 * Eingabe automatisch sichern und wiederherstellen (wie in d2beam-gui).
 *
 * Android und iOS beenden eine App im Hintergrund oft ohne Vorwarnung; beim Zurückkehren wird die
 * Seite neu geladen und die Eingabe wäre weg. Deshalb wird bei jedem Wechsel in den Hintergrund
 * (visibilitychange → hidden), beim Verlassen (pagehide) und beim Schließen (beforeunload) gespeichert
 * und beim Laden wieder eingelesen. Doppeltes Speichern schadet nicht, daher auf allen Plattformen.
 */

const SCHLUESSEL = 'current_input_POLYQUER';
const SCHLUESSEL_DEFEKT = 'current_input_POLYQUER_defekt';

interface Sicherung {
    eingabe: string;     // JSON wie in der Datei
    gerechnet: boolean;  // war beim Sichern ein Ergebnis zu sehen?
}

function sichern(): void {
    try {
        const daten: Sicherung = {eingabe: eingabeAlsJSON(), gerechnet: app.gerechnet};
        window.localStorage.setItem(SCHLUESSEL, JSON.stringify(daten));
    } catch (e) {
        console.error('autosave: Sichern nicht möglich', e);
    }
}

function wiederherstellen(): void {
    let text: string | null = null;
    try {
        text = window.localStorage.getItem(SCHLUESSEL);
    } catch (e) {
        console.error('autosave: localStorage nicht verfügbar', e);
        return;
    }
    if (!text) return;

    try {
        const daten = JSON.parse(text) as Sicherung;
        if (!eingabeEinlesen(daten.eingabe)) throw new Error('gespeicherte Eingabe wurde abgelehnt');
        if (daten.gerechnet) rechnen();
    } catch (error) {
        // Defekte/inkompatible Sicherung: aufheben, löschen und mit der Starteingabe weitermachen,
        // damit die App nicht bei jedem Start erneut daran scheitert.
        console.error('autosave: gespeicherte Eingabe konnte nicht gelesen werden', error);
        try {
            window.localStorage.setItem(SCHLUESSEL_DEFEKT, text);
            window.localStorage.removeItem(SCHLUESSEL);
        } catch { /* nichts mehr zu retten */ }
        alert('Die zuletzt gespeicherte Eingabe konnte nicht gelesen werden. Es wird mit der Beispieleingabe gestartet.');
    }
}

export function initAutosave(): void {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            sichern();
        } else {
            // zurück im Vordergrund: WebGL-Kontext kann verloren gegangen sein → 3D neu zeichnen
            if (app.gerechnet) import('./grafik3d').then(m => m.neuZeichnen());
        }
    });
    window.addEventListener('pagehide', sichern);
    window.addEventListener('beforeunload', sichern);

    if (document.readyState === 'complete') {
        wiederherstellen();
    } else {
        window.addEventListener('load', wiederherstellen);
    }
}
