import DetectOS from 'detectos.js';

/** Liefert ein Element per id; wirft, wenn es fehlt (Fehler im HTML). */
export function byId<T extends HTMLElement = HTMLElement>(id: string): T {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Element #${id} nicht gefunden`);
    return el as T;
}

/** Auswahlzustand in der Punkte-Tabelle (#polygonTable). */
export const selectedCellPoly = {
    isSelected: false,
    col: -1,
    row: -1,
    wert: '',
    activatedMember: null as HTMLTableCellElement | null,
    selColY: [] as boolean[],
    selColZ: [] as boolean[],
    startRowIndex: 0,
    startCellIndex: 0,
    startx: 0,
    starty: 0,
    zelle: null as HTMLElement | null,
};

export const myScreen = {
    clientWidth: document.documentElement.clientWidth,
    clientHeight: document.documentElement.clientHeight,
    svgWidth: 700,
};

/** Ab dieser Fensterbreite steht die 3D-Ansicht neben der 2D-Grafik (gleicher Wert wie in main.css). */
export const breitBildschirm = window.matchMedia('(min-width: 1500px)');

/** Breite der 2D-Grafik (und daneben der 3D-Ansicht) an die Fensterbreite anpassen. */
export function updateSvgWidth(): void {
    const clientWidth = document.documentElement.clientWidth;
    if (breitBildschirm.matches) {
        // 2D- und 3D-Grafik teilen sich den Platz rechts neben Eingabe und Querschnittswerten
        myScreen.svgWidth = Math.max(500, Math.floor((clientWidth - 940) / 2));
        byId('my-svg').style.width = myScreen.svgWidth + 'px';
        byId('view3d').style.width = myScreen.svgWidth + 'px';
    } else {
        myScreen.svgWidth = 700;
        byId('my-svg').style.width = '';
        byId('view3d').style.width = '';
    }
}

export const app = {
    hasFSAccess: 'showSaveFilePicker' in window,
    isMac: navigator.userAgent.includes('Mac OS X'),
    npkte: 0,
    gerechnet: false,   // wurde schon gerechnet? (für das Wiederherstellen nach Hintergrund/Neustart)
};

export const Detect = new DetectOS();

export const infoBox = byId('infoBox');

/** Zeilenumbruch passend zum Betriebssystem (für die Zwischenablage). */
export const newLine = Detect.OS === 'Windows' ? '\r\n' : '\n';
