import DetectOS from 'detectos.js';

/** Liefert ein Element per id; wirft, wenn es fehlt (Fehler im HTML). */
export function byId<T extends HTMLElement = HTMLElement>(id: string): T {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Element #${id} nicht gefunden`);
    return el as T;
}

/** Größe der 2D-Grafik in Pixeln (wird vor jedem Zeichnen aus dem Container bestimmt). */
export const myScreen = {
    svgWidth: 700,
    svgHeight: 700,
};

export const app = {
    hasFSAccess: 'showSaveFilePicker' in window,
    isMac: navigator.userAgent.includes('Mac OS X'),
    gerechnet: false,                // wurde schon gerechnet? (für das Wiederherstellen nach Hintergrund/Neustart)
    berechnungErforderlich: false,   // Eingabe nach dem letzten Rechnen geändert
};

export const Detect = new DetectOS();

/** Zeilenumbruch passend zum Betriebssystem (für die Zwischenablage). */
export const newLine = Detect.OS === 'Windows' ? '\r\n' : '\n';
