import {app, byId, selectedCellPoly, updateSvgWidth} from './state';
import {appendRow, polyTable} from './tabelle';
import {CQuer_polygon} from './calc/quer1';
import {sigmaFunktion} from './calc/spannung';
import {zeichneQuerschnitt} from './grafik';

/** Zelleninhalt als Zahl lesen (Komma erlaubt); ungültige Werte rot markieren und als 0 werten. */
function testNumber(cell: HTMLTableCellElement): number {
    const wert = Number(cell.innerText.replace(/,/g, '.'));
    if (isNaN(wert)) {
        cell.classList.add('selected');
        return 0;
    }
    return wert;
}

function inputNumber(id: string): number {
    return Number(byId<HTMLInputElement>(id).value.replace(/,/g, '.'));
}

function clear_polyTabelle(): void {
    for (const row of polyTable().tBodies[0].rows) {
        row.cells[1].innerText = '';
        row.cells[2].innerText = '';
    }
}

/** Tabelle auf die eingegebene Anzahl Punkte verkleinern bzw. erweitern. */
export function resize_polyTabelle(): void {
    const npkte = Number(byId<HTMLInputElement>('input_pkte').value);
    app.npkte = npkte;
    const tbody = polyTable().tBodies[0];
    const nzeilen = tbody.rows.length;

    if (nzeilen > npkte) {
        for (let i = 0; i < nzeilen - npkte; i++) tbody.deleteRow(-1);
        selectedCellPoly.selColY.length = npkte;
        selectedCellPoly.selColZ.length = npkte;
    }
    if (npkte > nzeilen) {
        for (let i = nzeilen + 1; i <= npkte; i++) appendRow(tbody, i);

        const inputContainer = byId('input-container');
        inputContainer.scrollTop = inputContainer.scrollHeight;
        byId('polyCanvas').style.top = byId('pt-1-1').getBoundingClientRect().top + window.scrollY + 'px';
    }
}

export function rechnen(): void {
    updateSvgWidth();

    const tbody = polyTable().tBodies[0];
    tbody.querySelectorAll('td').forEach(td => td.classList.remove('selected', 'highlight'));

    const npkte = tbody.rows.length;
    const y = new Float64Array(npkte);
    const z = new Float64Array(npkte);
    for (let i = 0; i < npkte; i++) {
        y[i] = testNumber(tbody.rows[i].cells[1]);
        z[i] = testNumber(tbody.rows[i].cells[2]);
    }

    const quer = new CQuer_polygon(y, z);
    quer.calc();

    // Spannungen in den Eckpunkten
    const sigma = sigmaFunktion(quer, {
        N: inputNumber('N_kraft'),
        My: 100.0 * inputNumber('My'),   // in kNcm
        Mz: 100.0 * inputNumber('Mz'),   // in kNcm
    });
    for (let i = 0; i < npkte; i++) {
        tbody.rows[i].cells[3].innerText = sigma(y[i], z[i]).toFixed(3);
    }

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
    for (const [id, wert] of ausgabe) byId(id).innerText = wert.toFixed(2);

    zeichneQuerschnitt(quer);
    app.gerechnet = true;

    // three.js erst bei Bedarf laden (eigener Chunk, hält den Start schnell)
    import('./grafik3d').then(m => m.zeichne3D(quer, sigma));
}

export function initButtons(): void {
    byId('rechnen').addEventListener('click', rechnen);
    byId('resize').addEventListener('click', resize_polyTabelle);
    byId('clearTable').addEventListener('click', clear_polyTabelle);
}
