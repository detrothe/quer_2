import {app, byId, selectedCellPoly} from './state';

const SPALTEN = ['Punkt', 'y&#772; [cm]', 'z&#772; [cm]', 'sigma [kN/cm²]'];

// Startbeispiel: Rahmenquerschnitt mit 10 Punkten
const START_Y = [0, 30, 30, 0, 10, 20, 20, 10, 10, 0];
const START_Z = [0, 0, 30, 30, 20, 20, 10, 10, 20, 30];

export function polyTable(): HTMLTableElement {
    return byId<HTMLTableElement>('polygonTable');
}

/** Alle Markierungen der Punkte-Tabelle entfernen. */
function clearHighlight(): void {
    polyTable().querySelectorAll('td').forEach(td => td.classList.remove('highlight'));
    selectedCellPoly.selColY.fill(false);
    selectedCellPoly.selColZ.fill(false);
}

/** Zelle als Startzelle einer Auswahl merken (Maus oder Touch). */
function selectCell(cell: HTMLTableCellElement): void {
    if (selectedCellPoly.isSelected) clearHighlight();

    const row = (cell.parentElement as HTMLTableRowElement).sectionRowIndex + 1;
    const col = cell.cellIndex;
    if (col !== 1 && col !== 2) return;

    cell.classList.add('highlight');
    selectedCellPoly.row = row;
    selectedCellPoly.col = col;
    selectedCellPoly.wert = cell.textContent ?? '';
    selectedCellPoly.activatedMember = cell;
    selectedCellPoly.isSelected = true;
    if (col === 1) selectedCellPoly.selColY[row - 1] = true;
    else selectedCellPoly.selColZ[row - 1] = true;
    selectedCellPoly.startRowIndex = row;
    selectedCellPoly.startCellIndex = col;
}

function onMouseMove(ev: MouseEvent): void {
    if (ev.buttons !== 1) return;
    ev.preventDefault();

    const cell = ev.currentTarget as HTMLTableCellElement;
    const rowIndex = (cell.parentElement as HTMLTableRowElement).sectionRowIndex + 1;
    const cellIndex = cell.cellIndex;
    if (cellIndex !== 1 && cellIndex !== 2) return;

    selectedCellPoly.isSelected = true;

    const rowStart = Math.min(rowIndex, selectedCellPoly.startRowIndex);
    const rowEnd = Math.max(rowIndex, selectedCellPoly.startRowIndex);
    const cellStart = Math.min(cellIndex, selectedCellPoly.startCellIndex);
    const cellEnd = Math.max(cellIndex, selectedCellPoly.startCellIndex);

    clearHighlight();

    const tabelle = polyTable();
    for (let i = rowStart; i <= rowEnd; i++) {
        for (let j = cellStart; j <= cellEnd; j++) {
            tabelle.rows[i].cells[j].classList.add('highlight');
            if (j === 1) selectedCellPoly.selColY[i - 1] = true;
            if (j === 2) selectedCellPoly.selColZ[i - 1] = true;
        }
    }
}

function onMouseDown(ev: MouseEvent): void {
    if (ev.button !== 0) return;   // nur linke Maustaste
    selectCell(ev.currentTarget as HTMLTableCellElement);
}

function onTouchStart(ev: TouchEvent): void {
    const touch = ev.changedTouches[0]; // erster Finger
    selectedCellPoly.startx = Math.trunc(touch.clientX);
    selectedCellPoly.starty = Math.trunc(touch.clientY);

    const cell = ev.currentTarget as HTMLTableCellElement;
    selectCell(cell);
    if (cell.cellIndex === 1 || cell.cellIndex === 2) {
        selectedCellPoly.zelle = document.getElementById(`pt-${selectedCellPoly.row}-${selectedCellPoly.col}`);
    }
}

/** Return springt zur nächsten Eingabezelle (y → z → nächste Zeile y). */
function onKeyDown(ev: KeyboardEvent): void {
    if (ev.key === ' ') {
        ev.preventDefault();
        return;
    }
    if (ev.key !== 'Enter') return;
    ev.preventDefault();

    const npkte = polyTable().tBodies[0].rows.length;
    const {row, col} = selectedCellPoly;

    document.getElementById(`pt-${row}-${col}`)?.classList.remove('highlight');
    selectedCellPoly.selColY.fill(false);
    selectedCellPoly.selColZ.fill(false);

    let id = `pt-${row}-${col}`;
    if (col === 1) {
        id = `pt-${row}-2`;
    } else if (col === 2) {
        id = row < npkte ? `pt-${row + 1}-1` : 'pt-1-1';
    }

    const elemNeu = byId<HTMLTableCellElement>(id);
    elemNeu.classList.add('highlight');
    elemNeu.innerText = '';
    elemNeu.focus();
    elemNeu.dispatchEvent(new MouseEvent('mousedown', {bubbles: true, button: 0}));
}

/** Neue Tabellenzeile für Punkt i (1-basiert) anhängen. */
export function appendRow(tbody: HTMLTableSectionElement, i: number, y = '', z = ''): void {
    const tr = tbody.insertRow(-1);
    tr.style.margin = '10px';
    const werte = [String(i), y, z, ''];

    werte.forEach((wert, j) => {
        const td = tr.insertCell(j);
        td.textContent = wert;
        td.style.border = 'solid 1px';
        td.style.padding = '5px';
        if (j === 0) td.style.textAlign = 'center';
        if (j === 1 || j === 2) {
            td.contentEditable = 'true';
            td.id = `pt-${i}-${j}`;
            td.addEventListener('keydown', onKeyDown);
        }
        td.addEventListener('mousedown', onMouseDown);
        td.addEventListener('mousemove', onMouseMove);
        td.addEventListener('touchstart', onTouchStart);
    });

    selectedCellPoly.selColY.push(false);
    selectedCellPoly.selColZ.push(false);
}

/** Punkte-Tabelle mit dem Startbeispiel aufbauen. */
export function createPolyTable(): void {
    const table = document.createElement('table');
    table.id = 'polygonTable';
    table.className = 'tasks';
    table.style.border = 'solid';
    table.style.borderSpacing = '0px';
    table.style.padding = '10px';

    const headRow = table.createTHead().insertRow();
    for (const name of SPALTEN) {
        const th = document.createElement('th');
        th.innerHTML = name;
        th.style.padding = '5px';
        headRow.appendChild(th);
    }
    headRow.cells[0].style.textAlign = 'center';

    const tbody = table.createTBody();
    START_Y.forEach((y, k) => appendRow(tbody, k + 1, String(y), String(START_Z[k])));

    byId('input-container').appendChild(table);
    app.npkte = START_Y.length;
}

//----------------------------------------------------------------------------------------------------------------------
// Auswahlrechteck für Touch-Bedienung über der Tabelle

export function initTouchOverlay(): void {
    const polyCanvas = byId('polyCanvas') as unknown as SVGSVGElement;
    const zelle = byId('pt-1-1').getBoundingClientRect();

    const xPolyCanvas = zelle.left + window.scrollX;
    const yPolyCanvas = zelle.top + window.scrollY;

    polyCanvas.style.left = xPolyCanvas + 'px';
    polyCanvas.style.top = yPolyCanvas + 'px';
    polyCanvas.style.height = 10 * zelle.height + 'px';
    polyCanvas.style.width = 3 * zelle.width + 'px';

    const rechteck = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rechteck.id = 'rechteck';
    rechteck.setAttribute('x', '0');
    rechteck.setAttribute('y', '0');
    rechteck.setAttribute('width', String(Math.round(zelle.width - 2)));
    rechteck.setAttribute('height', String(Math.round(zelle.height - 2)));
    rechteck.setAttribute('stroke', 'blue');
    rechteck.setAttribute('stroke-width', '4');
    rechteck.style.fill = 'none';
    polyCanvas.appendChild(rechteck);

    polyCanvas.addEventListener('touchmove', ev => {
        const width = ev.changedTouches[0].pageX - xPolyCanvas - zelle.left;
        const height = ev.changedTouches[0].pageY - yPolyCanvas - zelle.top;
        rechteck.setAttribute('width', width + 'px');
        rechteck.setAttribute('height', height + 'px');
        ev.preventDefault();
    });
    polyCanvas.addEventListener('touchstart', () => {
        polyCanvas.style.display = 'block';
    });
    polyCanvas.addEventListener('touchend', () => {
        polyCanvas.style.display = 'none';
    });

    polyCanvas.style.display = 'none';
}
