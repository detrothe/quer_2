import Two from 'two.js';
import type {Path} from 'two.js/src/path';
import {byId, myScreen} from './state';
import {CTrans} from './trans';
import {CQuer_polygon} from './calc/quer1';
import type {SigmaFunktion} from './calc/spannung';

const SCHRIFT = {
    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    size: 15, alignment: 'left', baseline: 'baseline',
} as const;

const FANGWEITE = 20;   // Pixel, wie in der 3D-Ansicht und in d2beam-gui

let two: Two | null = null;
let trans: CTrans | null = null;

/** Punkt, an dem der Cursor einrastet (Eckpunkte und Schwerpunkt), mit Text für die Wertanzeige. */
interface Fangpunkt {
    px: number;
    pz: number;
    y: number;          // Weltkoordinaten (Eingabe)
    z: number;
    html: string;       // Inhalt der Wertanzeige
    istSchwerpunkt: boolean;
}

let fangpunkte: Fangpunkt[] = [];
let schwerpunktElem: SVGElement | null = null;

// Fangkreuz (Finger/Stift), Ring um den gefangenen Punkt und Wertanzeige neben dem Cursor
let cursorH: SVGLineElement;
let cursorV: SVGLineElement;
let ring: SVGCircleElement;
let cursorSvg: SVGSVGElement;
let wertAnzeige: HTMLDivElement;

/** Daten der Eingabe für die Wertanzeige an den Eckpunkten. */
export interface Eingabepunkte {
    y: ArrayLike<number>;
    z: ArrayLike<number>;
    sigma: SigmaFunktion;
}

/** Farbe aus einer CSS-Variablen von #my-svg (Farbschema der Grafik in main.css). */
function farbe(name: string, ersatz: string): string {
    return getComputedStyle(byId('my-svg')).getPropertyValue(name).trim() || ersatz;
}

function getTwo(): Two {
    if (!two) {
        const svg = byId('dataviz_area') as unknown as SVGSVGElement;
        two = new Two({domElement: svg, width: myScreen.svgWidth, height: myScreen.svgHeight});
        initAbfrage(svg);
    }
    return two;
}

//----------------------------------------------------------------------------------------------------------------------
// Koordinatenanzeige und Fangen an Eckpunkten und Schwerpunkt – Maus, Stift und Finger

function initAbfrage(svg: SVGSVGElement): void {
    const container = byId('my-svg');
    const svgNS = 'http://www.w3.org/2000/svg';
    cursorSvg = document.createElementNS(svgNS, 'svg');
    cursorSvg.classList.add('grafik-cursor');
    cursorH = document.createElementNS(svgNS, 'line');
    cursorV = document.createElementNS(svgNS, 'line');
    ring = document.createElementNS(svgNS, 'circle');
    ring.setAttribute('r', '7');
    ring.classList.add('ring');
    cursorSvg.append(ring, cursorH, cursorV);
    container.appendChild(cursorSvg);

    wertAnzeige = document.createElement('div');
    wertAnzeige.className = 'grafik-wert';
    container.appendChild(wertAnzeige);
    abfrageAusblenden();

    const bewegt = (ev: PointerEvent) => {
        if (!trans) return;
        const rect = svg.getBoundingClientRect();
        let x = ev.clientX - rect.left;
        let y = ev.clientY - rect.top;
        // Finger: Cursor über dem Finger, damit man sieht, wo man ist (wie in 3D und d2beam-gui)
        if (ev.pointerType === 'touch') y -= Math.hypot(rect.width, rect.height) / 10;
        abfragen(x, y, ev.pointerType !== 'mouse');
    };
    svg.addEventListener('pointermove', bewegt);
    svg.addEventListener('pointerdown', bewegt);
    svg.addEventListener('pointerleave', ev => {
        if (ev.pointerType === 'mouse') abfrageAusblenden();
    });
}

function abfrageAusblenden(): void {
    cursorSvg.style.display = 'none';
    wertAnzeige.style.display = 'none';
    if (schwerpunktElem) schwerpunktElem.style.fill = '';
}

/** Koordinaten an (x, y) anzeigen; liegt ein Eck- oder der Schwerpunkt innerhalb der Fangweite, dort einrasten. */
function abfragen(x: number, y: number, kreuz: boolean): void {
    if (!trans) return;

    let fang: Fangpunkt | null = null;
    let bestD = FANGWEITE;
    for (const p of fangpunkte) {
        const d = Math.hypot(p.px - x, p.pz - y);
        if (d <= bestD) {
            bestD = d;
            fang = p;
        }
    }
    if (fang) {
        x = fang.px;
        y = fang.pz;
    }

    const yw = fang ? fang.y : trans.yWorld(x);
    const zw = fang ? fang.z : trans.zWorld(y);
    byId('cursor_coordy').innerHTML = 'y&#772;: ' + yw.toFixed(1);
    byId('cursor_coordz').innerHTML = 'z&#772;: ' + zw.toFixed(1);

    // Fangkreuz nur bei Finger/Stift (die Maus hat ihren eigenen Zeiger), Ring bei jedem gefangenen Punkt
    cursorSvg.style.display = kreuz || fang ? 'block' : 'none';
    cursorSvg.classList.toggle('gefangen', !!fang);
    cursorSvg.classList.toggle('ohne_kreuz', !kreuz);
    cursorH.setAttribute('x1', String(x - FANGWEITE));
    cursorH.setAttribute('x2', String(x + FANGWEITE));
    cursorH.setAttribute('y1', String(y));
    cursorH.setAttribute('y2', String(y));
    cursorV.setAttribute('x1', String(x));
    cursorV.setAttribute('x2', String(x));
    cursorV.setAttribute('y1', String(y - FANGWEITE));
    cursorV.setAttribute('y2', String(y + FANGWEITE));
    ring.setAttribute('cx', String(x));
    ring.setAttribute('cy', String(y));
    ring.style.display = fang && !fang.istSchwerpunkt ? '' : 'none';

    if (schwerpunktElem) schwerpunktElem.style.fill = fang?.istSchwerpunkt ? 'orange' : '';

    if (fang) {
        wertAnzeige.innerHTML = fang.html;
        wertAnzeige.style.display = 'block';
        // rechts oben neben das Kreuz, am Rand nach innen klappen
        const w = byId('my-svg').clientWidth;
        const bw = wertAnzeige.offsetWidth, bh = wertAnzeige.offsetHeight;
        let lx = x + FANGWEITE + 6, ly = y - FANGWEITE - bh - 2;
        if (lx + bw > w) lx = x - FANGWEITE - 6 - bw;
        if (ly < 0) ly = y + FANGWEITE + 2;
        wertAnzeige.style.left = lx + 'px';
        wertAnzeige.style.top = ly + 'px';
    } else {
        wertAnzeige.style.display = 'none';
    }
}

/** Fangpunkte: Eckpunkte der Eingabe (doppelte Punkte zusammengefasst) und Schwerpunkt. */
function bestimmeFangpunkte(quer: CQuer_polygon, eingabe: Eingabepunkte | undefined,
                            py: (v: number) => number, pz: (v: number) => number): Fangpunkt[] {
    const punkte: Fangpunkt[] = [];
    if (eingabe) {
        const nummern = new Map<string, number[]>();
        for (let i = 0; i < eingabe.y.length; i++) {
            const key = `${eingabe.y[i]}|${eingabe.z[i]}`;
            nummern.set(key, [...(nummern.get(key) ?? []), i + 1]);
        }
        for (const [key, nr] of nummern) {
            const [y, z] = key.split('|').map(Number);
            const titel = nr.length > 1 ? `Punkte ${nr.join(', ')}` : `Punkt ${nr[0]}`;
            punkte.push({
                px: py(y), pz: pz(z), y, z, istSchwerpunkt: false,
                html: `<b>${titel}</b><br>y&#772; = ${y.toFixed(2)}&nbsp; z&#772; = ${z.toFixed(2)} cm`
                    + `<br>&sigma; = <b>${eingabe.sigma(y, z).toFixed(3)}</b> kN/cm²`,
            });
        }
    }
    punkte.push({
        px: py(quer.ys), pz: pz(quer.zs), y: quer.ys, z: quer.zs, istSchwerpunkt: true,
        html: `<b>Schwerpunkt</b><br>y<sub>s</sub> = ${quer.ys.toFixed(2)}&nbsp; z<sub>s</sub> = ${quer.zs.toFixed(2)} cm`,
    });
    return punkte;
}

/**
 * Linie mit gefüllter Pfeilspitze am Ende.
 * Die Spitze ist wie der frühere SVG-Marker proportional zur Linienbreite
 * (Länge 6·b, Breite 4·b) und mittig auf dem Linienende platziert.
 */
function pfeil(t: Two, x1: number, y1: number, x2: number, y2: number, farbe: string, breite: number): void {
    const linie = t.makeLine(x1, y1, x2, y2);
    linie.stroke = farbe;
    linie.linewidth = breite;

    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len === 0) return;
    const ux = (x2 - x1) / len, uy = (y2 - y1) / len;   // Richtung
    const nx = -uy, ny = ux;                              // Normale
    const l2 = 3 * breite, b2 = 2 * breite;

    const spitze: Path = t.makePath(
        x2 + ux * l2, y2 + uy * l2,
        x2 - ux * l2 + nx * b2, y2 - uy * l2 + ny * b2,
        x2 - ux * l2 - nx * b2, y2 - uy * l2 - ny * b2,
    );
    spitze.fill = farbe;
    spitze.noStroke();
}

function text(t: Two, inhalt: string, x: number, y: number, farbe = 'black'): void {
    t.makeText(inhalt, x, y, {...SCHRIFT, fill: farbe});
}

/**
 * Querschnitt, Koordinatensysteme, Hauptachsen und Schwerpunkt zeichnen.
 * Die Grafik füllt ihren Container (#my-svg). Ist er nicht sichtbar (anderer Tab aktiv),
 * wird nichts gezeichnet und false zurückgegeben – dann beim Einblenden erneut aufrufen.
 */
export function zeichneQuerschnitt(quer: CQuer_polygon, eingabe?: Eingabepunkte): boolean {
    const container = byId('my-svg');
    if (container.clientWidth === 0 || container.clientHeight === 0) return false;
    myScreen.svgWidth = container.clientWidth;
    myScreen.svgHeight = container.clientHeight;

    const {y, z, neck} = quer;

    let ymin = Infinity, zmin = Infinity, ymax = -Infinity, zmax = -Infinity;
    for (let i = 0; i < neck; i++) {
        ymin = Math.min(ymin, y[i]);
        zmin = Math.min(zmin, z[i]);
        ymax = Math.max(ymax, y[i]);
        zmax = Math.max(zmax, z[i]);
    }

    const t = getTwo();
    t.renderer.setSize(myScreen.svgWidth, myScreen.svgHeight);
    t.width = myScreen.svgWidth;
    t.height = myScreen.svgHeight;
    t.clear();

    const tr = new CTrans(ymin, zmin, ymax, zmax);
    trans = tr;
    const py = (v: number) => Math.round(tr.yPix(v));
    const pz = (v: number) => Math.round(tr.zPix(v));

    // Querschnitt
    const punkte: number[] = [];
    for (let i = 0; i < neck; i++) punkte.push(py(y[i]), pz(z[i]));
    const polygon = t.makePath(...punkte);
    polygon.stroke = farbe('--querschnitt-rand', 'dimgrey');
    polygon.fill = farbe('--querschnitt-flaeche', 'lightgrey');
    polygon.linewidth = 1;

    const sl = Math.min(ymax - ymin, zmax - zmin) / 3;
    const ys = py(quer.ys);
    const zs = pz(quer.zs);

    // Koordinatenkreuz im Ursprung
    pfeil(t, py(0), pz(0), py(sl / 2), pz(0), 'darkslategrey', 2);
    text(t, 'ȳ', py(sl / 2) + 5, pz(0) - 7, 'darkslategrey');
    pfeil(t, py(0), pz(0), py(0), pz(sl / 2), 'darkslategrey', 2);
    text(t, 'z̄', py(0) + 5, pz(sl / 2) - 6, 'darkslategrey');

    // y-z Koordinatensystem im Schwerpunkt
    pfeil(t, ys, zs, py(quer.ys + sl / 2), zs, 'blue', 1.5);
    text(t, 'y', py(quer.ys + sl / 2) + 5, zs - 5, 'blue');
    pfeil(t, ys, zs, ys, pz(quer.zs + sl / 2), 'blue', 1.5);
    text(t, 'z', ys + 5, pz(quer.zs + sl / 2) - 5, 'blue');

    // Hauptachsen
    const achse = (winkel: number) => {
        const si = Math.sin(winkel) * sl;
        const co = Math.cos(winkel) * sl;
        return {
            y1: py(quer.ys - co), z1: pz(quer.zs - si),
            y2: py(quer.ys + co), z2: pz(quer.zs + si),
        };
    };
    const a1 = achse(quer.phi);
    pfeil(t, a1.y1, a1.z1, a1.y2, a1.z2, 'black', 2);
    text(t, ' 1', a1.y2 + 5, a1.z2 - 5);
    const a2 = achse(quer.phi + Math.PI / 2);
    pfeil(t, a2.y1, a2.z1, a2.y2, a2.z2, 'black', 2);
    text(t, ' 2', a2.y2 + 5, a2.z2 - 5);

    // Schwerpunkt (Fangen und Anzeige siehe abfragen)
    const kreis = t.makeCircle(ys, zs, 5);
    kreis.fill = 'blue';
    kreis.noStroke();

    t.update();

    schwerpunktElem = (kreis.renderer as { elem?: SVGElement }).elem ?? null;
    fangpunkte = bestimmeFangpunkte(quer, eingabe, py, pz);
    abfrageAusblenden();
    return true;
}
