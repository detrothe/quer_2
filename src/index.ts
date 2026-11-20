import 'font-awesome/css/font-awesome.min.css';

import {app, byId, Detect, infoBox, myScreen, updateSvgWidth} from './state';
import {createPolyTable, initTouchOverlay} from './tabelle';
import {initButtons} from './listener';
import {initDateien} from './dateien';
import {init_contextmenu} from './contextMenu';
import {initAutosave} from './autosave';

updateSvgWidth();

infoBox.innerHTML = `clientwidth=${myScreen.clientWidth}&nbsp;,&nbsp;&nbsp;    clientheight=${myScreen.clientHeight}`;
infoBox.innerHTML += `<br>Browser: ${Detect.browser} Version ${Detect.version}`;
infoBox.innerHTML += `<br>OS: ${Detect.OS} , isMac: ${app.isMac}`;
infoBox.innerHTML += app.hasFSAccess
    ? '<br>showSaveFilePicker wird unterstützt'
    : '<br>showSaveFilePicker wird NICHT unterstützt';

init_contextmenu();
initButtons();
initDateien();

// 3D-Ansicht auf schmalen Bildschirmen als Vollbild ein-/ausblenden.
// Solange sie offen ist, darf die Seite dahinter weder scrollen noch zoomen.
byId('open3d').addEventListener('click', () => {
    byId('view3d').classList.add('offen');
    document.documentElement.classList.add('view3d-offen');
});
byId('close3d').addEventListener('click', () => {
    byId('view3d').classList.remove('offen');
    document.documentElement.classList.remove('view3d-offen');
});

byId<HTMLInputElement>('input_pkte').value = '10';
createPolyTable();
initTouchOverlay();

// letzte Eingabe wiederherstellen und künftig automatisch sichern
initAutosave();

/*
// Matrix mit 4 Zeilen und 2 Spalten  nicht löschen
const arr = Array.from(Array(4), () => new Array(2).fill(0.0));

arr[0][0] ='11';arr[0][1] ='12';
arr[1][0] ='21';arr[1][1] ='22';
arr[2][0] ='31';arr[2][1] ='32';
arr[3][0] ='41';arr[3][1] ='42';

console.info(arr);
*/

//----------------------------------------------------------------------------------------------------------------------
// Rechteck-Auswahl in der Tabelle der Querschnittswerte (zum Kopieren)

const table = byId<HTMLTableElement>('schnittgroessen_table');

let isMouseDown = false;
let startRowIndex = 0;
let startCellIndex = 0;

function clearSelection(): void {
    table.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
}

function selectTo(cell: HTMLTableCellElement): void {
    const cellIndex = cell.cellIndex;
    const rowIndex = (cell.parentElement as HTMLTableRowElement).sectionRowIndex;

    const rowStart = Math.min(rowIndex, startRowIndex);
    const rowEnd = Math.max(rowIndex, startRowIndex);
    const cellStart = Math.min(cellIndex, startCellIndex);
    const cellEnd = Math.max(cellIndex, startCellIndex);

    for (let i = rowStart; i <= rowEnd; i++) {
        const rowCells = table.rows[i].cells;
        for (let j = cellStart; j <= cellEnd; j++) {
            rowCells[j]?.classList.add('selected');
        }
    }
}

table.querySelectorAll('td').forEach(td => {
    td.addEventListener('mousedown', e => {
        isMouseDown = true;
        clearSelection();

        if (e.shiftKey) {
            selectTo(td);
        } else {
            td.classList.add('selected');
            startCellIndex = td.cellIndex;
            startRowIndex = (td.parentElement as HTMLTableRowElement).sectionRowIndex;
        }

        e.preventDefault();   // keine Textauswahl
        e.stopPropagation();
    });
    td.addEventListener('mouseover', () => {
        if (!isMouseDown) return;
        clearSelection();
        selectTo(td);
    });
    td.addEventListener('selectstart', e => {
        e.preventDefault();
        e.stopPropagation();
    });
});

document.addEventListener('mouseup', () => {
    isMouseDown = false;
});

//----------------------------------------------------------------------------------------------------------------------

navigator.permissions?.query({name: 'clipboard-write' as PermissionName}).then(result => {
    infoBox.innerHTML += result.state === 'granted' || result.state === 'prompt'
        ? '<br>clipboard write erlaubt'
        : '<br>clipboard write NICHT erlaubt';
}).catch(() => {
    infoBox.innerHTML += '<br>clipboard-write NICHT implementiert';
});
