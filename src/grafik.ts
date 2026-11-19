import Two from 'two.js';
import type {Path} from 'two.js/src/path';
import {byId, myScreen} from './state';
import {CTrans} from './trans';
import {CQuer_polygon} from './calc/quer1';

const SCHRIFT = {family: 'Verdana, Arial, Helvetica, sans-serif', size: 15, alignment: 'left', baseline: 'baseline'} as const;

let two: Two | null = null;
let trans: CTrans | null = null;
let tooltip: HTMLDivElement | null = null;

function getTwo(): Two {
    if (!two) {
        const svg = byId('dataviz_area') as unknown as SVGSVGElement;
        two = new Two({domElement: svg, width: myScreen.svgWidth, height: svg.height.baseVal.value});

        // Cursor-Koordinaten in Weltkoordinaten anzeigen
        svg.addEventListener('mousemove', ev => {
            if (!trans) return;
            const rect = svg.getBoundingClientRect();
            const y = trans.yWorld(ev.clientX - rect.left).toFixed(1);
            const z = trans.zWorld(ev.clientY - rect.top).toFixed(1);
            byId('cursor_coordy').innerHTML = 'y&#772;:' + y;
            byId('cursor_coordz').innerHTML = 'z&#772;:' + z;
        });
    }
    return two;
}

function getTooltip(): HTMLDivElement {
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.style.position = 'absolute';
        tooltip.style.visibility = 'hidden';
        tooltip.style.zIndex = '10';
        tooltip.textContent = 'Schwerpunkt';
        byId('my-svg').appendChild(tooltip);
    }
    return tooltip;
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

/** Querschnitt, Koordinatensysteme, Hauptachsen und Schwerpunkt zeichnen. */
export function zeichneQuerschnitt(quer: CQuer_polygon): void {
    const {y, z, neck} = quer;

    let ymin = Infinity, zmin = Infinity, ymax = -Infinity, zmax = -Infinity;
    for (let i = 0; i < neck; i++) {
        ymin = Math.min(ymin, y[i]);
        zmin = Math.min(zmin, z[i]);
        ymax = Math.max(ymax, y[i]);
        zmax = Math.max(zmax, z[i]);
    }

    const t = getTwo();
    const svg = t.renderer.domElement as SVGSVGElement;
    t.renderer.setSize(myScreen.svgWidth, svg.height.baseVal.value);
    t.width = myScreen.svgWidth;
    t.clear();

    const tr = new CTrans(ymin, zmin, ymax, zmax);
    trans = tr;
    const py = (v: number) => Math.round(tr.yPix(v));
    const pz = (v: number) => Math.round(tr.zPix(v));

    // Querschnitt
    const punkte: number[] = [];
    for (let i = 0; i < neck; i++) punkte.push(py(y[i]), pz(z[i]));
    const polygon = t.makePath(...punkte);
    polygon.stroke = 'dimgrey';
    polygon.fill = 'lightgrey';
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

    // Schwerpunkt mit Tooltip
    const schwerpunkt = t.makeCircle(ys, zs, 5);
    schwerpunkt.fill = 'blue';
    schwerpunkt.noStroke();

    t.update();

    const elem = (schwerpunkt.renderer as { elem?: SVGElement }).elem;
    if (elem) {
        const tip = getTooltip();
        elem.addEventListener('mouseover', () => {
            elem.style.fill = 'orange';
            tip.style.visibility = 'visible';
        });
        elem.addEventListener('mousemove', ev => {
            tip.style.top = ev.pageY - 20 + 'px';
            tip.style.left = ev.pageX + 10 + 'px';
        });
        elem.addEventListener('mouseout', () => {
            elem.style.fill = 'blue';
            tip.style.visibility = 'hidden';
        });
    }
}
