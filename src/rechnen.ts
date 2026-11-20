import {app, byId} from './state';
import {lesePunkte, MIN_PUNKTE} from './punkte';
import {CQuer_polygon} from './calc/quer1';
import {sigmaFunktion, SigmaFunktion} from './calc/spannung';
import {zeichneQuerschnitt, Eingabepunkte} from './grafik';

/** Ergebnis der letzten Berechnung (für das Neuzeichnen beim Tab-Wechsel). */
let letztes: { quer: CQuer_polygon; sigma: SigmaFunktion; eingabe: Eingabepunkte } | null = null;

function inputNumber(id: string): number {
    const wert = Number(byId<HTMLInputElement>(id).value.replace(/,/g, '.'));
    return Number.isFinite(wert) ? wert : 0;
}

/** Querschnittswerte und Spannungen in die Tabellen im Tab Ergebnisse schreiben. */
function schreibeErgebnisse(quer: CQuer_polygon, y: Float64Array, z: Float64Array, sigma: SigmaFunktion): void {
    const ausgabe: [string, number][] = [
        ['ys', quer.ys],
        ['zs', quer.zs],
        ['area', quer.area],
        ['Iys', quer.Iy_s],
        ['Izs', quer.Iz_s],
        ['Iyzs', quer.Iyz_s],
        ['I11', quer.Imax],
        ['I22', quer.Imin],
        ['phi_h', quer.phi * 180.0 / Math.PI],
    ];
    for (const [id, wert] of ausgabe) byId(id).textContent = wert.toFixed(2);

    // Spannungen in den Eckpunkten (Nummerierung wie in der Eingabe)
    const tbody = byId<HTMLTableSectionElement>('sigma_tbody');
    tbody.replaceChildren();
    for (let i = 0; i < y.length; i++) {
        const tr = tbody.insertRow();
        const werte = [String(i + 1), y[i].toFixed(2), z[i].toFixed(2), sigma(y[i], z[i]).toFixed(3)];
        for (const w of werte) tr.insertCell().textContent = w;
    }
}

/** 2D-Grafik (neu) zeichnen, falls sie sichtbar ist. Aufruf auch beim Wechsel auf den Tab Ergebnisse. */
export function zeichne2D(): void {
    if (letztes) zeichneQuerschnitt(letztes.quer, letztes.eingabe);
}

/**
 * Querschnittswerte und Spannungen berechnen und alle Ausgaben aktualisieren.
 * @param zeigeErgebnisse anschließend auf den Tab Ergebnisse wechseln
 */
export function rechnen(zeigeErgebnisse = true): void {
    const {y, z, fehler} = lesePunkte();
    if (y.length < MIN_PUNKTE) {
        alert(`Es werden mindestens ${MIN_PUNKTE} Punkte benötigt.`);
        return;
    }

    let quer = new CQuer_polygon(y, z);
    quer.calc();
    if (!(Math.abs(quer.area) > 0)) {
        alert('Die Querschnittsfläche ist null – bitte die Koordinaten prüfen.');
        return;
    }
    // Im Uhrzeigersinn eingegeben → Fläche negativ und alle Vorzeichen falsch: Reihenfolge umkehren
    const imUhrzeigersinn = quer.area < 0;
    if (imUhrzeigersinn) {
        quer = new CQuer_polygon(y.slice().reverse(), z.slice().reverse());
        quer.calc();
    }
    byId('id_hinweis_umlauf').hidden = !imUhrzeigersinn;

    const sigma = sigmaFunktion(quer, {
        N: inputNumber('N_kraft'),
        My: 100.0 * inputNumber('My'),   // in kNcm
        Mz: 100.0 * inputNumber('Mz'),   // in kNcm
    });

    letztes = {quer, sigma, eingabe: {y, z, sigma}};
    schreibeErgebnisse(quer, y, z, sigma);
    app.gerechnet = true;
    app.berechnungErforderlich = false;
    document.dispatchEvent(new CustomEvent('berechnet', {detail: {zeigeErgebnisse, fehler}}));

    zeichne2D();
    // three.js erst bei Bedarf laden (eigener Chunk, hält den Start schnell)
    import('./grafik3d').then(m => m.zeichne3D(quer, sigma));

    if (fehler > 0) {
        alert(`${fehler} ungültige Eingabe(n) in der Tabelle (rot markiert) wurden als 0 gerechnet.`);
    }
}
