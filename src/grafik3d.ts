import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {CSS2DObject, CSS2DRenderer} from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import GUI from 'lil-gui';
import {byId} from './state';
import {bildSpeichern} from './dateien';
import {enableTouchHints} from './components/touch_hint';
import {CQuer_polygon} from './calc/quer1';
import type {SigmaFunktion} from './calc/spannung';

/*
 * Koordinaten
 * -----------
 * Statik (rechtshändig): x Stablängsachse, y nach links, z nach unten – wie in der 2D-Grafik.
 * three.js:              X = -(y - ys),  Y = -(z - zs),  Z = x
 * Der Querschnitt liegt also in der XY-Ebene, die Spannungen werden in Z (= Stabachse) aufgetragen.
 * Von vorne (+Z) betrachtet sieht man den Querschnitt genau wie in der 2D-Grafik.
 *
 * Werteabfrage
 * ------------
 * Wie in d2beam-gui: Der Cursor ist ein Kreuz, dessen halbe Linienlänge der Fangweite entspricht.
 * Liegt eine Pfeilspitze innerhalb der Fangweite, rastet der Cursor dort ein und der Wert steht
 * neben dem Cursor. Bei Fingereingabe sitzt der Cursor versetzt über dem Finger.
 * Ein Finger fragt ab, zwei Finger drehen und zoomen. Maus/Stift: ziehen dreht, überfahren fragt ab.
 */

const FARBE_DRUCK = 0xd02020;   // σ < 0  (wie in der Dünnwand-App: rot = Druck)
const FARBE_ZUG = 0x2020d0;     // σ > 0
const FARBE_QUERSCHNITT = 0x8a8a9a;
const RASTER_TEILUNG = 10;      // Pfeilabstand: Abmessung / 10

interface Punkt {
    y: number;
    z: number;
    s: number;   // σ
}

const optionen = {
    beschriftung: false,
    normalspannung: true,
    seiten: true,
    innenPfeile: false,   // Pfeile im Inneren (die Randpfeile werden immer gezeichnet)
    skalierungPfeile: 1,
    achsen: true,
    skalierung: 1,
    fangweite: 20,   // Pixel
    bildFaktor: 2,   // Bildexport: Vielfaches der Bildschirmgröße (CSS-Pixel)
    bildWeiss: true,   // Bildexport mit weißem statt grauem Hintergrund
};

const MAX_BILDPIXEL = 16_000_000;   // Obergrenze für Canvas-Flächen in Safari/iOS (ca. 16,7 Mio. Pixel)

/*
 * Fingerbedienung wie in d2beam-gui (Tab Ergebnisse): Ein Button links unten schaltet um,
 * was ein Finger tut – verschieben (Pan) oder Werte am Fangkreuz anzeigen („123“).
 * Zwei Finger drehen und zoomen immer.
 */
let panModus = false;   // Standard: Werte anzeigen (der Button wird von neuen Anwendern leicht übersehen)

const ICON_PAN = `<svg width="1rem" height="1rem" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
<path fill="currentColor" d="M16 8l-3-3v2h-4v-4h2l-3-3-3 3h2v4h-4v-2l-3 3 3 3v-2h4v4h-2l3 3 3-3h-2v-4h4v2z"></path></svg>`;
const ICON_WERTE = `<svg width="1rem" height="1rem" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
<text x="0" y="12" fill="currentColor" style="font: bold 0.6rem sans-serif">123</text></svg>`;

let renderer: THREE.WebGLRenderer;
let labelRenderer: CSS2DRenderer;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let controls: OrbitControls;
let host: HTMLElement;
let groessenBeobachter: ResizeObserver | null = null;
let bildButtonName: ((name: string) => void) | null = null;

// aktuelles Modell
let modell: THREE.Group | null = null;
let spannungsKoerper: THREE.Group | null = null;
let seitenGruppe: THREE.Group | null = null;
let innenPfeilGruppe: THREE.Group | null = null;
let achsenGruppe: THREE.Group | null = null;
let beschriftungGruppe: THREE.Group | null = null;

let aktQuer: CQuer_polygon | null = null;
let aktSigma: SigmaFunktion | null = null;
let randPunkte: Punkt[] = [];    // Fußpunkte der Randpfeile (Eckpunkte + Punkte auf den Kanten)
let innenPunkte: Punkt[] = [];   // Fußpunkte der inneren Pfeile (Raster)
let groesse = 1;          // charakteristische Abmessung des Querschnitts
let hoehenFaktor = 1;     // Z = σ · hoehenFaktor
let kameraGroesse = 0;    // Größe, für die die Kamera zuletzt eingestellt wurde
let kameraNachholen = false;   // Kamera konnte nicht eingestellt werden, weil die Ansicht ausgeblendet war

// Cursor (Fangkreuz) und Wertanzeige
let cursorSvg: SVGSVGElement;
let cursorH: SVGLineElement;
let cursorV: SVGLineElement;
let ring: SVGCircleElement;   // markiert die gefangene Pfeilspitze (wie in der 2D-Grafik)
let wertAnzeige: HTMLDivElement;
// springen: Kreuz rastet auf der Pfeilspitze ein (Finger/Stift); bei der Maus bleibt es unter dem Zeiger
let letzterZeiger: { x: number; y: number; springen: boolean } | null = null;

//----------------------------------------------------------------------------------------------------------------------

function toV(y: number, z: number, x = 0): THREE.Vector3 {
    const q = aktQuer!;
    return new THREE.Vector3(-(y - q.ys), -(z - q.zs), x);
}

/** Lage der Pfeilspitze (bzw. des Fußpunkts, wenn die Spannungen ausgeblendet sind). */
function spitze(p: Punkt): THREE.Vector3 {
    return toV(p.y, p.z, optionen.normalspannung ? p.s * hoehenFaktor : 0);
}

function render(): void {
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

function resize(): void {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (w === 0 || h === 0) return;   // ausgeblendet (Vollbild-Ansicht geschlossen)
    renderer.setSize(w, h);
    labelRenderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (kameraNachholen) kameraZuruecksetzen();
    bildNameAktualisieren();
    render();
    if (letzterZeiger) fangen(letzterZeiger.x, letzterZeiger.y, letzterZeiger.springen);   // Kreuz bleibt auf der Pfeilspitze
}

/**
 * Kamera schräg von vorn auf den Querschnitt richten. Der Abstand wird so gewählt, dass das Modell
 * (Querschnitt + Spannungskörper) sowohl in der Höhe als auch in der Breite ins Bild passt –
 * wichtig für Smartphones im Hochformat, wo der horizontale Blickwinkel klein ist.
 */
function kameraZuruecksetzen(): void {
    if (host.clientWidth === 0 || host.clientHeight === 0) {
        kameraNachholen = true;   // erst beim Einblenden möglich (Seitenverhältnis unbekannt)
        return;
    }
    kameraNachholen = false;
    kameraGroesse = groesse;

    const radius = groesse * 1.0;    // umschließende Kugel: halbe Diagonale + Spannungshöhe, mit Rand
    const fovV = THREE.MathUtils.degToRad(camera.fov);
    const fovH = 2 * Math.atan(Math.tan(fovV / 2) * camera.aspect);
    const d = radius / Math.sin(Math.min(fovV, fovH) / 2);
    camera.position.set(0.5, 0.32, 0.8).normalize().multiplyScalar(d);
    camera.near = groesse / 100;
    camera.far = groesse * 100;
    camera.updateProjectionMatrix();
    controls.target.set(0, 0, 0);
    controls.update();
}

function initCursor(): void {
    const svgNS = 'http://www.w3.org/2000/svg';
    cursorSvg = document.createElementNS(svgNS, 'svg');
    cursorSvg.classList.add('view3d-cursor');
    cursorH = document.createElementNS(svgNS, 'line');
    cursorV = document.createElementNS(svgNS, 'line');
    ring = document.createElementNS(svgNS, 'circle');
    ring.setAttribute('r', '7');
    ring.classList.add('ring');
    cursorSvg.append(ring, cursorH, cursorV);
    host.appendChild(cursorSvg);

    wertAnzeige = document.createElement('div');
    wertAnzeige.className = 'view3d-wert';
    host.appendChild(wertAnzeige);

    cursorAusblenden();
}

function init(): void {
    host = byId('view3d-canvas');

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0xdddddd);
    host.appendChild(renderer.domElement);

    labelRenderer = new CSS2DRenderer();
    labelRenderer.domElement.className = 'view3d-labels';
    host.appendChild(labelRenderer.domElement);

    initCursor();

    scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xffffff, 1.6));
    const licht = new THREE.DirectionalLight(0xffffff, 2.0);
    licht.position.set(1, 1.5, 2);
    scene.add(licht);

    camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1000);

    controls = new OrbitControls(camera, renderer.domElement);
    // Ein Finger: Werte abfragen (keine Kamerabewegung), zwei Finger: drehen und zoomen
    controls.touches = {ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE};
    initPanButton();
    // OrbitControls setzt beim Start style.cursor = 'auto' – der Mauspfeil wird durch das Fangkreuz ersetzt
    renderer.domElement.style.cursor = 'none';
    controls.addEventListener('change', () => {
        render();
        if (letzterZeiger) fangen(letzterZeiger.x, letzterZeiger.y, letzterZeiger.springen);   // Spitzen haben sich auf dem Schirm bewegt
    });


    const canvas = renderer.domElement;
    canvas.addEventListener('pointermove', zeigerBewegt);
    canvas.addEventListener('pointerdown', zeigerBewegt);
    canvas.addEventListener('pointerleave', ev => {
        if (ev.pointerType === 'mouse') cursorAusblenden();
    });

    // Referenz behalten: ein nicht referenzierter ResizeObserver kann vom Garbage Collector
    // entfernt werden – dann bekommt die Ansicht beim Einblenden des Tabs keine Größe mehr
    groessenBeobachter = new ResizeObserver(resize);
    groessenBeobachter.observe(host);

    const neuAufbauen = () => {
        baueSpannungskoerper();
        render();
    };
    const gui = new GUI({container: byId('view3d-gui'), title: 'Bedienfeld'});
    gui.add(optionen, 'beschriftung').name('Beschriftung').onChange(sichtbarkeit);
    gui.add(optionen, 'normalspannung').name('Normalspannung').onChange(sichtbarkeit);
    gui.add(optionen, 'skalierung', 0.1, 5, 0.1).name('Skalierung').onChange(neuAufbauen);
    gui.add(optionen, 'seiten').name('Seiten anzeigen').onChange(sichtbarkeit);
    gui.add(optionen, 'innenPfeile').name('innere Pfeile').onChange(sichtbarkeit);
    gui.add(optionen, 'skalierungPfeile', 0.2, 3, 0.1).name('Skalierung Pfeile').onChange(neuAufbauen);
    gui.add(optionen, 'achsen').name('Achsen anzeigen').onChange(sichtbarkeit);
    gui.add(optionen, 'fangweite', 5, 60, 1).name('Fangweite [px]').onChange(() => {
        if (letzterZeiger) fangen(letzterZeiger.x, letzterZeiger.y, letzterZeiger.springen);
    });

    const bild = gui.addFolder('Bild speichern');
    bild.add(optionen, 'bildFaktor', {'1×': 1, '2×': 2, '3×': 3, '4×': 4, '6×': 6, '8×': 8})
        .name('Auflösung').onChange(bildNameAktualisieren);
    bild.add(optionen, 'bildWeiss').name('weißer Hintergrund');
    const knopf = bild.add({speichern: () => void bildExportieren()}, 'speichern');
    bildButtonName = name => knopf.name(name);
    bildNameAktualisieren();
    bild.close();

    gui.add({
        reset() {
            optionen.skalierung = 1;
            optionen.skalierungPfeile = 1;
            gui.controllersRecursive().forEach(c => c.updateDisplay());
            baueSpannungskoerper();
            kameraZuruecksetzen();
            render();
        },
    }, 'reset').name('Zurücksetzen');

    if (window.matchMedia('(max-width: 600px)').matches) gui.close();
}

//----------------------------------------------------------------------------------------------------------------------
// Geometrie-Hilfen

/** Polygon auf die Seite vorzeichen·σ ≥ 0 zuschneiden (Sutherland–Hodgman an der Nulllinie). */
function zuschneiden(poly: Punkt[], vorzeichen: 1 | -1): Punkt[] {
    const res: Punkt[] = [];
    for (let i = 0; i < poly.length; i++) {
        const a = poly[i];
        const b = poly[(i + 1) % poly.length];
        const fa = vorzeichen * a.s;
        const fb = vorzeichen * b.s;
        if (fa >= 0) res.push(a);
        if ((fa > 0 && fb < 0) || (fa < 0 && fb > 0)) {
            const t = fa / (fa - fb);
            res.push({y: a.y + t * (b.y - a.y), z: a.z + t * (b.z - a.z), s: 0});
        }
    }
    return res;
}

/** Punkt-in-Polygon-Test (Strahlverfahren, gerade/ungerade). */
function imPolygon(y: number, z: number, poly: Punkt[]): boolean {
    let innen = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const a = poly[i], b = poly[j];
        if ((a.z > z) !== (b.z > z) && y < (b.y - a.y) * (z - a.z) / (b.z - a.z) + a.y) innen = !innen;
    }
    return innen;
}

function dispose(obj: THREE.Object3D): void {
    obj.traverse(o => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Line) {
            o.geometry.dispose();
            const m = o.material as THREE.Material | THREE.Material[];
            (Array.isArray(m) ? m : [m]).forEach(x => x.dispose());
        }
        if (o instanceof CSS2DObject) o.element.remove();
    });
}

function label(text: string, pos: THREE.Vector3, klasse = 'label3d'): CSS2DObject {
    const div = document.createElement('div');
    div.className = klasse;
    div.textContent = text;
    const obj = new CSS2DObject(div);
    obj.position.copy(pos);
    return obj;
}

function linie(punkte: THREE.Vector3[], farbe: number, geschlossen = false): THREE.Line {
    const geo = new THREE.BufferGeometry().setFromPoints(punkte);
    const mat = new THREE.LineBasicMaterial({color: farbe});
    return geschlossen ? new THREE.LineLoop(geo, mat) : new THREE.Line(geo, mat);
}

function flaechenMaterial(farbe: number, opacity: number): THREE.MeshBasicMaterial {
    return new THREE.MeshBasicMaterial({
        color: farbe, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false,
    });
}

//----------------------------------------------------------------------------------------------------------------------
// Modell aufbauen

function baueQuerschnitt(quer: CQuer_polygon): THREE.Group {
    const g = new THREE.Group();
    const umriss = Array.from({length: quer.neck}, (_, i) => toV(quer.y[i], quer.z[i]));

    const dicke = groesse * 0.02;
    const shape = new THREE.Shape(umriss.map(v => new THREE.Vector2(v.x, v.y)));
    const geo = new THREE.ExtrudeGeometry(shape, {depth: dicke, bevelEnabled: false});
    geo.translate(0, 0, -dicke);   // Scheibe hinter der Ebene x = 0
    g.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({color: FARBE_QUERSCHNITT})));
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({color: 0x555566})));
    return g;
}

const KREISTEILUNG = 10;   // Segmente im Umfang von Schaft und Spitze der Achsenpfeile

/** Räumlicher Pfeil (Zylinderschaft + Kegelspitze) vom Ursprung in Richtung dir. */
function raumPfeil(dir: THREE.Vector3, laenge: number, farbe: number): THREE.Group {
    const spitzeL = laenge * 0.25;
    const schaftL = laenge - spitzeL;
    const material = new THREE.MeshStandardMaterial({color: farbe});

    const schaft = new THREE.Mesh(
        new THREE.CylinderGeometry(laenge * 0.025, laenge * 0.025, schaftL, KREISTEILUNG), material);
    schaft.position.y = schaftL / 2;
    const spitze = new THREE.Mesh(
        new THREE.ConeGeometry(laenge * 0.08, spitzeL, KREISTEILUNG), material);
    spitze.position.y = schaftL + spitzeL / 2;

    const pfeil = new THREE.Group();
    pfeil.add(schaft, spitze);
    // Zylinder und Kegel zeigen in +Y → auf die gewünschte Richtung drehen
    pfeil.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    return pfeil;
}

function baueAchsen(): THREE.Group {
    const g = new THREE.Group();
    const l = groesse * 0.25;
    const achsen: [THREE.Vector3, number, string][] = [
        [new THREE.Vector3(0, 0, 1), 0xdd2222, 'x'],
        [new THREE.Vector3(-1, 0, 0), 0x22aa44, 'y'],
        [new THREE.Vector3(0, -1, 0), 0x2222dd, 'z'],
    ];
    for (const [dir, farbe, name] of achsen) {
        g.add(raumPfeil(dir, l, farbe));
        g.add(label(name, dir.clone().multiplyScalar(l * 1.12), 'label3d achse'));
    }
    return g;
}

/** Fußpunkte der Randpfeile: alle Eckpunkte (ohne doppelte) und Zwischenpunkte auf den Kanten. */
function bestimmeRandpunkte(poly: Punkt[], sigma: SigmaFunktion): Punkt[] {
    const punkte: Punkt[] = [];
    const gesehen = new Set<string>();
    const neu = (p: Punkt) => {
        const key = `${p.y.toFixed(9)}|${p.z.toFixed(9)}`;
        if (gesehen.has(key)) return;
        gesehen.add(key);
        punkte.push(p);
    };

    poly.forEach(neu);   // Eckpunkte zuerst (für die Beschriftung)

    const h = groesse / RASTER_TEILUNG;
    for (let i = 0; i < poly.length; i++) {
        const a = poly[i], b = poly[(i + 1) % poly.length];
        const n = Math.round(Math.hypot(b.y - a.y, b.z - a.z) / h);
        for (let k = 1; k < n; k++) {
            const y = a.y + (b.y - a.y) * k / n;
            const z = a.z + (b.z - a.z) * k / n;
            neu({y, z, s: sigma(y, z)});
        }
    }
    return punkte;
}

/** Fußpunkte der inneren Pfeile: Raster im Querschnitt. */
function bestimmeInnenpunkte(poly: Punkt[], sigma: SigmaFunktion): Punkt[] {
    const punkte: Punkt[] = [];
    const ymin = Math.min(...poly.map(p => p.y)), ymax = Math.max(...poly.map(p => p.y));
    const zmin = Math.min(...poly.map(p => p.z)), zmax = Math.max(...poly.map(p => p.z));
    const h = groesse / RASTER_TEILUNG;
    // Raster mittig ausrichten
    const y0 = ymin + ((ymax - ymin) % h) / 2 + h / 2;
    const z0 = zmin + ((zmax - zmin) % h) / 2 + h / 2;
    for (let y = y0; y < ymax; y += h) {
        for (let z = z0; z < zmax; z += h) {
            if (imPolygon(y, z, poly)) punkte.push({y, z, s: sigma(y, z)});
        }
    }
    return punkte;
}

/**
 * Spannungspfeile: Schaft als Linie (dünn wie bisher), Spitze als Kegel mit derselben Teilung wie die
 * Achsenpfeile – der Kegel von THREE.ArrowHelper hat nur 5 Segmente, was im hochaufgelösten Bild eckig wirkt.
 */
function bauePfeile(punkte: Punkt[], maxAbs: number): THREE.Group {
    const g = new THREE.Group();
    // gemeinsame Einheitskegel (Spitze in +Z, Fuß bei z = 0) und Materialien für alle Pfeile
    const kegel = new THREE.ConeGeometry(0.5, 1, KREISTEILUNG);
    kegel.translate(0, 0.5, 0);
    kegel.rotateX(Math.PI / 2);
    const material = {
        zug: [new THREE.LineBasicMaterial({color: FARBE_ZUG}), new THREE.MeshStandardMaterial({color: FARBE_ZUG})],
        druck: [new THREE.LineBasicMaterial({color: FARBE_DRUCK}), new THREE.MeshStandardMaterial({color: FARBE_DRUCK})],
    } as const;

    for (const p of punkte) {
        const laenge = Math.abs(p.s) * hoehenFaktor;
        if (laenge < 1e-9 * groesse) continue;
        // Spitzengröße wächst mit der Spannung, damit kleine Spannungen nicht von Pfeilspitzen dominiert werden
        const kopf = Math.min(laenge * 0.9, groesse * 0.05 * optionen.skalierungPfeile * Math.abs(p.s) / maxAbs);
        const richtung = Math.sign(p.s);
        const [linienMat, kegelMat] = p.s > 0 ? material.zug : material.druck;
        const fuss = toV(p.y, p.z);

        const schaft = new THREE.Line(new THREE.BufferGeometry().setFromPoints([
            fuss, toV(p.y, p.z, richtung * (laenge - kopf)),
        ]), linienMat);
        const spitze = new THREE.Mesh(kegel, kegelMat);
        spitze.position.copy(toV(p.y, p.z, richtung * (laenge - kopf)));
        spitze.scale.set(kopf * 0.5, kopf * 0.5, richtung * kopf);   // Breite wie bisher (ArrowHelper: kopf · 0,5)
        g.add(schaft, spitze);
    }
    return g;
}

function baueSpannungskoerper(): void {
    if (!modell || !aktQuer || !aktSigma) return;
    for (const g of [spannungsKoerper, beschriftungGruppe]) {
        if (g) {
            modell.remove(g);
            dispose(g);
        }
    }

    spannungsKoerper = new THREE.Group();
    innenPfeilGruppe = null;
    seitenGruppe = new THREE.Group();
    spannungsKoerper.add(seitenGruppe);
    beschriftungGruppe = new THREE.Group();

    const quer = aktQuer;
    const sigma = aktSigma;
    const poly: Punkt[] = Array.from({length: quer.neck}, (_, i) => ({
        y: quer.y[i], z: quer.z[i], s: sigma(quer.y[i], quer.z[i]),
    }));

    const maxAbs = Math.max(...poly.map(p => Math.abs(p.s)));
    hoehenFaktor = maxAbs > 1e-12 ? groesse * 0.4 / maxAbs * optionen.skalierung : 0;
    const top = (p: Punkt) => toV(p.y, p.z, p.s * hoehenFaktor);

    randPunkte = bestimmeRandpunkte(poly, sigma);
    innenPunkte = bestimmeInnenpunkte(poly, sigma);

    if (hoehenFaktor > 0) {
        for (const vorzeichen of [1, -1] as const) {
            const teil = zuschneiden(poly, vorzeichen);
            if (teil.length < 3) continue;
            // nur Teile mit tatsächlich von 0 verschiedenen Spannungen
            if (!teil.some(p => vorzeichen * p.s > 1e-12 * maxAbs)) continue;
            const farbe = vorzeichen > 0 ? FARBE_ZUG : FARBE_DRUCK;

            // Deckfläche (nicht konvexe Polygone werden trianguliert)
            const kontur = teil.map(p => {
                const v = toV(p.y, p.z);
                return new THREE.Vector2(v.x, v.y);
            });
            const dreiecke = THREE.ShapeUtils.triangulateShape(kontur, []);
            const deckGeo = new THREE.BufferGeometry().setFromPoints(teil.map(top));
            deckGeo.setIndex(dreiecke.flat());
            spannungsKoerper.add(new THREE.Mesh(deckGeo, flaechenMaterial(farbe, 0.45)));

            // Rand des Spannungskörpers
            spannungsKoerper.add(linie(teil.map(top), farbe, true));

            // Seitenflächen zwischen Querschnitt und Spannungskörper
            const seitenPunkte: THREE.Vector3[] = [];
            for (let i = 0; i < teil.length; i++) {
                const a = teil[i], b = teil[(i + 1) % teil.length];
                const a0 = toV(a.y, a.z), b0 = toV(b.y, b.z);
                seitenPunkte.push(a0, b0, top(b), a0, top(b), top(a));
            }
            seitenGruppe.add(new THREE.Mesh(
                new THREE.BufferGeometry().setFromPoints(seitenPunkte), flaechenMaterial(farbe, 0.25)));
        }

        spannungsKoerper.add(bauePfeile(randPunkte, maxAbs));
        innenPfeilGruppe = bauePfeile(innenPunkte, maxAbs);
        spannungsKoerper.add(innenPfeilGruppe);

        // Werte an den Eckpunkten (stehen am Anfang von randPunkte)
        const nEcken = new Set(poly.map(p => `${p.y.toFixed(9)}|${p.z.toFixed(9)}`)).size;
        for (const p of randPunkte.slice(0, nEcken)) {
            beschriftungGruppe.add(label(p.s.toFixed(3), top(p)));
        }
    }

    modell.add(spannungsKoerper);
    modell.add(beschriftungGruppe);

    const min = Math.min(...poly.map(p => p.s));
    const max = Math.max(...poly.map(p => p.s));
    byId('v3d-minmax').textContent = `min/max σ : ${min.toFixed(2)} / ${max.toFixed(2)}`;

    sichtbarkeit();
}

function sichtbarkeit(): void {
    if (spannungsKoerper) spannungsKoerper.visible = optionen.normalspannung;
    if (seitenGruppe) seitenGruppe.visible = optionen.seiten;
    if (innenPfeilGruppe) innenPfeilGruppe.visible = optionen.innenPfeile;
    if (achsenGruppe) achsenGruppe.visible = optionen.achsen;
    if (beschriftungGruppe) beschriftungGruppe.visible = optionen.beschriftung && optionen.normalspannung;
    if (letzterZeiger) fangen(letzterZeiger.x, letzterZeiger.y, letzterZeiger.springen);
    render();
}

//----------------------------------------------------------------------------------------------------------------------
// Werteabfrage mit Fangkreuz

function cursorAusblenden(): void {
    letzterZeiger = null;
    cursorSvg.style.display = 'none';
    wertAnzeige.style.display = 'none';
}

/** Button links unten: ein Finger verschiebt (Pan) oder fragt Werte ab (123). Nur auf Touch-Geräten. */
function initPanButton(): void {
    if (navigator.maxTouchPoints === 0) return;   // nur Maus: kein Umschalten nötig

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'view3d-pan';
    btn.className = 'btn_file';   // gleicher Stil wie die Datei-Buttons im Tab Eingabe
    const aktualisieren = () => {
        btn.innerHTML = panModus ? ICON_PAN : ICON_WERTE;
        btn.title = panModus
            ? 'Ein Finger verschiebt – tippen für Werteanzeige'
            : 'Ein Finger zeigt Werte – tippen zum Verschieben';
        controls.touches.ONE = panModus ? THREE.TOUCH.PAN : null;
        if (panModus) cursorAusblenden();
    };
    btn.addEventListener('click', () => {
        panModus = !panModus;
        aktualisieren();
    });
    aktualisieren();
    byId('view3d').appendChild(btn);
    enableTouchHints(btn);   // Hilfetext bei langem Drücken wie in d2beam-gui
}

function zeigerBewegt(ev: PointerEvent): void {
    if (!aktQuer) return;
    if (ev.pointerType === 'touch' && panModus) return;   // Finger verschiebt, keine Werteabfrage
    let x = ev.offsetX;
    let y = ev.offsetY;
    if (ev.pointerType === 'touch') {
        // Cursor über dem Finger, damit man sieht, wo man ist (wie d2beam-gui)
        y -= Math.hypot(host.clientWidth, host.clientHeight) / 10;
    }
    const springen = ev.pointerType !== 'mouse';
    letzterZeiger = {x, y, springen};
    fangen(x, y, springen);
}

/**
 * Kreuz an (x, y) zeichnen und die nächste Pfeilspitze innerhalb der Fangweite suchen.
 * Die Spitze wird mit einem Ring markiert; mit springen = true (Finger/Stift) rastet auch das Kreuz dort ein.
 */
function fangen(x: number, y: number, springen: boolean): void {
    const w = host.clientWidth, h = host.clientHeight;
    const fw = optionen.fangweite;

    let best: Punkt | null = null;
    let bestPos: THREE.Vector3 | null = null;
    let bestD = fw;
    const fangPunkte = optionen.innenPfeile ? randPunkte.concat(innenPunkte) : randPunkte;
    for (const p of fangPunkte) {
        const pos = spitze(p);
        const s = pos.clone().project(camera);
        if (s.z > 1) continue;   // hinter der Kamera
        const d = Math.hypot((s.x + 1) / 2 * w - x, (1 - s.y) / 2 * h - y);
        if (d <= bestD) {
            bestD = d;
            best = p;
            bestPos = pos;
        }
    }

    // Lage der gefangenen Spitze auf dem Schirm; Finger/Stift: Kreuz dorthin setzen
    let cx = x, cy = y, rx = 0, ry = 0;
    if (best && bestPos) {
        const s = bestPos.clone().project(camera);
        rx = (s.x + 1) / 2 * w;
        ry = (1 - s.y) / 2 * h;
        if (springen) {
            cx = rx;
            cy = ry;
        }
    }
    ring.setAttribute('cx', String(rx));
    ring.setAttribute('cy', String(ry));
    ring.style.display = best ? '' : 'none';

    cursorSvg.style.display = 'block';
    cursorH.setAttribute('x1', String(cx - fw));
    cursorH.setAttribute('x2', String(cx + fw));
    cursorH.setAttribute('y1', String(cy));
    cursorH.setAttribute('y2', String(cy));
    cursorV.setAttribute('x1', String(cx));
    cursorV.setAttribute('x2', String(cx));
    cursorV.setAttribute('y1', String(cy - fw));
    cursorV.setAttribute('y2', String(cy + fw));
    cursorSvg.classList.toggle('gefangen', !!best);

    if (best && bestPos) {
        wertAnzeige.innerHTML =
            `<b>σ = ${best.s.toFixed(3)}</b> kN/cm²<br>y&#772; = ${best.y.toFixed(2)}&nbsp; z&#772; = ${best.z.toFixed(2)} cm`;
        wertAnzeige.style.display = 'block';
        // rechts oben neben das Kreuz, am Rand nach innen klappen
        const bw = wertAnzeige.offsetWidth, bh = wertAnzeige.offsetHeight;
        let lx = cx + fw + 6, ly = cy - fw - bh - 2;
        if (lx + bw > w) lx = cx - fw - 6 - bw;
        if (ly < 0) ly = cy + fw + 2;
        wertAnzeige.style.left = lx + 'px';
        wertAnzeige.style.top = ly + 'px';
    } else {
        wertAnzeige.style.display = 'none';
    }
}

//----------------------------------------------------------------------------------------------------------------------
// Bildexport (PNG) der aktuellen Ansicht

/** Tatsächlicher Vergrößerungsfaktor: gewünschter Faktor, begrenzt durch WebGL und die Canvas-Fläche. */
function bildFaktor(): number {
    const w = host.clientWidth, h = host.clientHeight;
    if (w === 0 || h === 0) return optionen.bildFaktor;
    const gl = renderer.getContext();
    const maxSeite = Math.min(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) as number, renderer.capabilities.maxTextureSize);
    return Math.min(optionen.bildFaktor, maxSeite / Math.max(w, h), Math.sqrt(MAX_BILDPIXEL / (w * h)));
}

function bildNameAktualisieren(): void {
    if (!bildButtonName || !host) return;
    const f = bildFaktor();
    const w = Math.round(host.clientWidth * f), h = Math.round(host.clientHeight * f);
    bildButtonName(w > 0 ? `PNG speichern (${w} × ${h} px)` : 'PNG speichern');
}

/**
 * Szene in höherer Auflösung rendern und die (HTML-)Beschriftungen dazuzeichnen.
 * Alles geschieht in einer Aufgabe ohne Zwischenzeichnen des Browsers – auf dem Schirm flackert nichts,
 * und der WebGL-Puffer ist beim Kopieren noch gültig (preserveDrawingBuffer ist nicht nötig).
 */
function bildErzeugen(): Promise<Blob> {
    const w = host.clientWidth, h = host.clientHeight;
    const f = bildFaktor();
    const bw = Math.round(w * f), bh = Math.round(h * f);

    const leinwand = document.createElement('canvas');
    leinwand.width = bw;
    leinwand.height = bh;
    const ctx = leinwand.getContext('2d')!;

    const altRatio = renderer.getPixelRatio();
    const altFarbe = renderer.getClearColor(new THREE.Color());
    if (optionen.bildWeiss) renderer.setClearColor(0xffffff);
    renderer.setPixelRatio(f);
    renderer.setSize(w, h, false);
    renderer.render(scene, camera);
    ctx.drawImage(renderer.domElement, 0, 0, bw, bh);
    renderer.setClearColor(altFarbe);
    renderer.setPixelRatio(altRatio);
    renderer.setSize(w, h, false);
    render();

    // Beschriftungen: Lage und Aussehen aus dem DOM des CSS2DRenderer übernehmen
    const basis = labelRenderer.domElement.getBoundingClientRect();
    ctx.scale(f, f);
    for (const el of labelRenderer.domElement.querySelectorAll<HTMLElement>('.label3d')) {
        if (el.style.display === 'none' || !el.textContent) continue;
        const r = el.getBoundingClientRect();
        const st = getComputedStyle(el);
        const x = r.left - basis.left, y = r.top - basis.top;
        const rand = parseFloat(st.borderTopWidth) || 0;
        if (st.backgroundColor !== 'rgba(0, 0, 0, 0)' && st.backgroundColor !== 'transparent') {
            ctx.fillStyle = st.backgroundColor;
            ctx.beginPath();
            ctx.roundRect(x, y, r.width, r.height, parseFloat(st.borderTopLeftRadius) || 0);
            ctx.fill();
            if (rand > 0) {
                ctx.strokeStyle = st.borderTopColor;
                ctx.lineWidth = rand;
                ctx.stroke();
            }
        }
        ctx.fillStyle = st.color;
        ctx.font = `${st.fontStyle} ${st.fontWeight} ${st.fontSize} ${st.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(el.textContent, x + r.width / 2, y + r.height / 2);
    }

    return new Promise((resolve, reject) => leinwand.toBlob(
        b => b ? resolve(b) : reject(new Error('Bild konnte nicht erzeugt werden (zu groß?)')), 'image/png'));
}

async function bildExportieren(): Promise<void> {
    if (!aktQuer || host.clientWidth === 0) return;
    await bildSpeichern(bildErzeugen, 'querschnitt_3d.png');
}

//----------------------------------------------------------------------------------------------------------------------

/** Nach Rückkehr aus dem Hintergrund neu zeichnen (Größe und WebGL-Kontext können sich geändert haben). */
export function neuZeichnen(): void {
    if (!renderer) return;
    resize();
    render();
}

/** 3D-Ansicht für den berechneten Querschnitt neu aufbauen. */
export function zeichne3D(quer: CQuer_polygon, sigma: SigmaFunktion): void {
    if (!renderer) init();

    if (modell) {
        scene.remove(modell);
        dispose(modell);
    }

    aktQuer = quer;
    aktSigma = sigma;

    let ymin = Infinity, ymax = -Infinity, zmin = Infinity, zmax = -Infinity;
    for (let i = 0; i < quer.neck; i++) {
        ymin = Math.min(ymin, quer.y[i]);
        ymax = Math.max(ymax, quer.y[i]);
        zmin = Math.min(zmin, quer.z[i]);
        zmax = Math.max(zmax, quer.z[i]);
    }
    groesse = Math.max(ymax - ymin, zmax - zmin) || 1;

    modell = new THREE.Group();
    modell.add(baueQuerschnitt(quer));
    achsenGruppe = baueAchsen();
    modell.add(achsenGruppe);
    scene.add(modell);

    baueSpannungskoerper();

    byId('view3d-hinweis').hidden = true;
    // Kamera nur neu setzen, wenn sich die Abmessungen deutlich ändern – sonst bleibt die Blickrichtung erhalten
    if (kameraGroesse === 0 || groesse / kameraGroesse > 2 || kameraGroesse / groesse > 2) {
        kameraZuruecksetzen();
    }
    cursorAusblenden();
    resize();
}
