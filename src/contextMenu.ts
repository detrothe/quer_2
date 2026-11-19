import {app, byId, infoBox, newLine, selectedCellPoly} from './state';
import {polyTable} from './tabelle';

const contextMenuLinkClassName = 'context-menu__link';
const contextMenuActive = 'context-menu--active';
const taskItemClassName = 'tasks';

const menu = byId('context-menu');
let menuState = 0;

/**
 * Prüft, ob das Event innerhalb eines Elements mit der Klasse className ausgelöst wurde.
 *
 * @return Das gefundene Element oder null
 */
function clickInsideElement(e: Event, className: string): Element | null {
    return e.target instanceof Element ? e.target.closest('.' + className) : null;
}

function toggleMenuOn(): void {
    if (menuState !== 1) {
        menuState = 1;
        menu.classList.add(contextMenuActive);
    }
}

function toggleMenuOff(): void {
    if (menuState !== 0) {
        menuState = 0;
        menu.classList.remove(contextMenuActive);
    }
}

/** Menü an der Mausposition anzeigen, ohne über den Fensterrand hinauszuragen. */
function positionMenu(e: MouseEvent): void {
    const menuWidth = menu.offsetWidth + 4;
    const menuHeight = menu.offsetHeight + 4;
    const windowWidth = document.documentElement.clientWidth;
    const windowHeight = document.documentElement.clientHeight;

    menu.style.left = (e.pageX + menuWidth > windowWidth ? e.pageX - menuWidth : e.pageX) + 'px';

    infoBox.innerHTML += `<br>positionmenu, ${e.pageY}, ${menuHeight}, ${windowHeight}`;

    menu.style.top = (e.pageY + menuHeight > windowHeight ? e.pageY - menuHeight : e.pageY) + 'px';
}

/** Aktion eines Menüeintrags auf die markierten Zellen anwenden. */
function menuItemListener(link: Element): void {
    toggleMenuOff();

    const action = link.getAttribute('data-action');
    const rows = polyTable().rows;   // rows[0] ist die Kopfzeile
    const {selColY, selColZ} = selectedCellPoly;

    if (action === 'copyFirst') {
        // Wert der zuerst geklickten Zelle in alle markierten Zellen kopieren
        const wert = selectedCellPoly.wert;
        for (let i = 0; i < app.npkte; i++) {
            if (selColY[i]) rows[i + 1].cells[1].innerText = wert;
            if (selColZ[i]) rows[i + 1].cells[2].innerText = wert;
        }
    } else if (action === 'increment_1') {
        // ab dem Wert der zuerst geklickten Zelle hochzählen
        let wert = Number(selectedCellPoly.wert);
        for (let i = 0; i < app.npkte; i++) {
            if (selColY[i]) rows[i + 1].cells[1].innerText = String(wert++);
            if (selColZ[i]) rows[i + 1].cells[2].innerText = String(wert++);
        }
    } else if (action === 'copy') {
        let newClip = '';
        for (let i = 0; i < app.npkte; i++) {
            let wertInSpalte1 = false;
            if (selColY[i]) {
                newClip += rows[i + 1].cells[1].innerText;
                wertInSpalte1 = true;
            }
            if (selColZ[i]) {
                if (wertInSpalte1) newClip += '\t';
                newClip += rows[i + 1].cells[2].innerText + newLine;
            } else if (wertInSpalte1) {
                newClip += newLine;
            }
        }

        navigator.clipboard.writeText(newClip).then(
            () => console.log('clipboard successfully set'),
            () => console.log('clipboard write failed'),
        );
    } else if (action === 'insert') {
        // Inhalt der Zwischenablage ab der zuletzt geklickten Zelle einfügen
        const {row, col} = selectedCellPoly;

        navigator.clipboard.readText().then(clipText => {
            const zeilen = clipText.split(/\r?\n/);
            for (let i = 0; i < zeilen.length - 1; i++) {
                const zeile = zeilen[i].split('\t');
                for (let j = 0; j < zeile.length; j++) {
                    const cell = row + i <= app.npkte ? rows[row + i]?.cells[col + j] : undefined;
                    if (cell) cell.innerText = zeile[j];
                }
            }
        });
    }
}

export function init_contextmenu(): void {
    document.addEventListener('contextmenu', e => {
        if (clickInsideElement(e, taskItemClassName)) {
            e.preventDefault();
            toggleMenuOn();
            positionMenu(e);
        } else {
            toggleMenuOff();
        }
    });

    document.addEventListener('click', e => {
        const link = clickInsideElement(e, contextMenuLinkClassName);
        if (link) {
            e.preventDefault();
            menuItemListener(link);
        } else if (e.button === 0) {   // linke Maustaste
            toggleMenuOff();
        }
    });

    window.addEventListener('keyup', e => {
        if (e.key === 'Escape') toggleMenuOff();
    });

    window.addEventListener('resize', () => toggleMenuOff());
}
