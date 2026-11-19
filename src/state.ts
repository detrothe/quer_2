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

/** Breite der Grafik an die Fensterbreite anpassen. */
export function updateSvgWidth(): void {
    const clientWidth = document.documentElement.clientWidth;
    if (clientWidth > 1500) {
        myScreen.svgWidth = clientWidth - 900;
        byId('my-svg').style.width = myScreen.svgWidth + 'px';
    } else {
        myScreen.svgWidth = 700;
    }
}

export const app = {
    hasFSAccess: 'showSaveFilePicker' in window,
    isMac: navigator.userAgent.includes('Mac OS X'),
    npkte: 0,
};

export const Detect = new DetectOS();

export const infoBox = byId('infoBox');

/** Zeilenumbruch passend zum Betriebssystem (für die Zwischenablage). */
export const newLine = Detect.OS === 'Windows' ? '\r\n' : '\n';
