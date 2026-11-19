'use strict';

import 'font-awesome/css/font-awesome.min.css';
import './listener.js';
import './dateien.js';
import {init_contextmenu} from './contextMenu.js';
import * as d3 from "d3";
import DetectOS from 'detectos.js'
import {CQuer_polygon} from "./calc/quer1";

export const selectedCellPoly = {
    isSelected: false,
    selectedCellRow: -1,
    selectedCellCol: -1,
    col: -1,
    row: -1,
    wert: 0,
    activatedMember: null,
    selColY: [],
    selColZ: [],
    startRowIndex: null,
    startCellIndex: null,
    pointerIsDown: false,
    startx: 0,
    starty: 0,
    zelle: null
};

export const myScreen = {
    clientWidth: 0,
    clientHeight: 0,
    svgWidth: 0
}

myScreen.clientWidth = document.documentElement.clientWidth;
myScreen.clientHeight = document.documentElement.clientHeight;

if (myScreen.clientWidth > 1500) {
    myScreen.svgWidth = myScreen.clientWidth - 900;
    document.getElementById("my-svg").style.width = myScreen.svgWidth + 'px';
} else {
    myScreen.svgWidth = 700;
}

export const app = {
    appName: 'polyQuerschnitt',
    file: {
        handle: null,
        name: null,
        isModified: false,
    },
    options: {
        captureTabs: true,
        fontSize: 14,
        monoSpace: false,
        wordWrap: true,
    },
    hasFSAccess: 'chooseFileSystemEntries' in window ||
        'showOpenFilePicker' in window ||
        'showSaveFilePicker' in window,
    isMac: navigator.userAgent.includes('Mac OS X'),

    npkte: 0,
};

export const Detect = new DetectOS();

export const infoBox = document.getElementById("infoBox");
infoBox.innerHTML = "clientwidth=" + myScreen.clientWidth + "&nbsp;,&nbsp;&nbsp;    clientheight=" + myScreen.clientHeight;
infoBox.innerHTML += "<br>Browser: " + Detect.browser + " Version " + Detect.version;
infoBox.innerHTML += "<br>OS: " + Detect.OS + " , isMac: " + app.isMac;
if (app.hasFSAccess) {
    infoBox.innerHTML += "<br>showSaveFilePicker wird unterstützt";
} else {
    infoBox.innerHTML += "<br>showSaveFilePicker wird NICHT unterstützt";
}

console.log("height=", myScreen.clientHeight);
console.log("width =", myScreen.clientWidth);

init_contextmenu();

/**
 * Listens for click events.
 */

const elem = document.getElementById("input_pkte");
elem.value = 10;
app.npkte = 10;

/*
// Matrix mit 4 Zeilen und 2 Spalten  nicht löschen
const arr = Array.from(Array(4), () => new Array(2).fill(0.0));

arr[0][0] ='11';arr[0][1] ='12';
arr[1][0] ='21';arr[1][1] ='22';
arr[2][0] ='31';arr[2][1] ='32';
arr[3][0] ='41';arr[3][1] ='42';

console.info(arr);
*/

const polygon = {};
const punkte = []

polygon.punkte = punkte;

for (let i = 1; i <= 10; i++) {
    selectedCellPoly.selColY.push(false);
    selectedCellPoly.selColZ.push(false);

    let pkt = i;
    let y = 10 + i;
    let z = 20 + i;
    let sigma = "";
    let punkt = {
        "Punkt": pkt,
        "y [cm]": y,
        "z [cm]": z,
        "sigma [kN/cm²]": sigma
    }

    polygon.punkte.push(punkt);
}

console.log(JSON.stringify(polygon));

function tabulate(data, columns) {
    console.log('columns', columns);
    console.log("data", data);

    const table = d3.select('#input-container').append('table').style('border', 'solid').style('border-spacing', '0px').style('padding', "10px").attr("id", "polygonTable").attr("class", "tasks")
    const thead = table.append('thead')
    const tbody = table.append('tbody');

    // append the header row
    thead.append('tr')
        .selectAll('th')
        .data(columns).enter()
        .append('th')
        .style('padding', '5px')
        .text(function (column) {
            return column;
        });

    // create a row for each object in the data
    const rows = tbody.selectAll('tr')
        .data(data)
        .enter()
        .append('tr')
        .style('margin', '10px');

    // create a cell in each row for each column
    const cells = rows.selectAll('td')
        .data(function (row) {
            return columns.map(function (column) {
                return {column: column, value: row[column]};
            });
        })
        .enter()
        .append('td')
        .attr('contenteditable', true)
        .style('border', 'solid 1px')
        .style('padding', '5px')
        .text(function (d) {
            return d.value;
        })
        .on('keydown', KEYDOWN)
        .on('mousedown', MOUSEDOWN)

        .on('mousemove', MOUSEMOVE)
        .on("touchstart", function (ev) {
            let touchobj = ev.changedTouches[0]; // erster Finger
            selectedCellPoly.startx = parseInt(touchobj.clientX); // X/Y-Koordinaten relativ zum Viewport
            selectedCellPoly.starty = parseInt(touchobj.clientY);
            console.log("touchstart bei ClientX: " + selectedCellPoly.startx + "px ClientY: " + selectedCellPoly.starty + "px");

            if (selectedCellPoly.isSelected) {
                console.log("is selected", this.parentElement);
                const el = document.getElementById("input_pkte");
                if (el) {
                    const npkte = el.value;
                    document.querySelectorAll("#polygonTable td").forEach(td => td.classList.remove("highlight"));
                    for (let i = 0; i < npkte; i++) {
                        selectedCellPoly.selColY[i] = false;
                        selectedCellPoly.selColZ[i] = false;
                    }
                }
            }
            console.log("cell", this, this.parentElement.sectionRowIndex);
            const row = this.parentElement.sectionRowIndex + 1;
            const col = this.cellIndex;
            if (col === 1 || col === 2) {
                const activatedMember = ev.target.closest("td");
                activatedMember.classList.add("highlight");
                let wert = activatedMember.textContent;

                selectedCellPoly.row = row;
                selectedCellPoly.col = col;
                selectedCellPoly.wert = wert;
                selectedCellPoly.activatedMember = activatedMember;
                selectedCellPoly.isSelected = true;
                if (col === 1) selectedCellPoly.selColY[row - 1] = true;
                else if (col === 2) selectedCellPoly.selColZ[row - 1] = true;
                selectedCellPoly.startRowIndex = row;
                selectedCellPoly.startCellIndex = col;

                const str = "pt-" + row + "-" + col;
                selectedCellPoly.zelle = document.getElementById(str);

                console.log("str", str, cellLeft, cellTop);
            }

        })

    return table;
}

export function MOUSEMOVE(ev) { // mousemove
    if (ev.buttons === 1) {
        ev.preventDefault();
        const row = this.parentElement.sectionRowIndex + 1;
        const col = this.cellIndex;
        if (col === 1 || col === 2) {
            const activatedMember = ev.target.closest("td");
            activatedMember.classList.add("highlight");
            selectedCellPoly.isSelected = true;
            if (col === 1) selectedCellPoly.selColY[row - 1] = true;
            else if (col === 2) selectedCellPoly.selColZ[row - 1] = true;

            const cellIndex = col;
            const rowIndex = row;

            let rowStart, rowEnd, cellStart, cellEnd;

            if (rowIndex < selectedCellPoly.startRowIndex) {
                rowStart = rowIndex;
                rowEnd = selectedCellPoly.startRowIndex;
            } else {
                rowStart = selectedCellPoly.startRowIndex;
                rowEnd = rowIndex;
            }

            if (cellIndex < selectedCellPoly.startCellIndex) {
                cellStart = cellIndex;
                cellEnd = selectedCellPoly.startCellIndex;
            } else {
                cellStart = selectedCellPoly.startCellIndex;
                cellEnd = cellIndex;
            }

            document.querySelectorAll("#polygonTable td").forEach(td => td.classList.remove("highlight"));
            for (let i = 0; i < app.npkte; i++) {
                selectedCellPoly.selColY[i] = false;
                selectedCellPoly.selColZ[i] = false;
            }

            const tabelle = document.getElementById("polygonTable");
            for (let i = rowStart; i <= rowEnd; i++) {
                for (let j = cellStart; j <= cellEnd; j++) {
                    tabelle.rows.item(i).cells.item(j).classList.add("highlight");
                    if (j === 1) selectedCellPoly.selColY[i - 1] = true;
                    if (j === 2) selectedCellPoly.selColZ[i - 1] = true;

                }
            }
        }
    }
}

export function MOUSEDOWN(ev) {
    console.log("mousedown", ev.pageX, ev.pageY, ev.which, ev.button);

    if (ev.which === 3) {               // rechte Maustaste
        console.log("rechte Maustaste");
    } else if (ev.button === 0) {      // linke Maustaste
        if (selectedCellPoly.isSelected) {
            console.log("is selected", this.parentElement);
            const el = document.getElementById("input_pkte");
            if (el) {
                const npkte = el.value;
                document.querySelectorAll("#polygonTable td").forEach(td => td.classList.remove("highlight"));
                for (let i = 0; i < npkte; i++) {
                    selectedCellPoly.selColY[i] = false;
                    selectedCellPoly.selColZ[i] = false;
                }
            }

        }
        console.log("cell", this, this.parentElement.sectionRowIndex);
        const row = this.parentElement.sectionRowIndex + 1;
        const col = this.cellIndex;
        if (col === 1 || col === 2) {
            const activatedMember = ev.target.closest("td");
            activatedMember.classList.add("highlight");
            let wert = activatedMember.textContent;

            selectedCellPoly.row = row;
            selectedCellPoly.col = col;
            selectedCellPoly.wert = wert;
            selectedCellPoly.activatedMember = activatedMember;
            selectedCellPoly.isSelected = true;
            if (col === 1) selectedCellPoly.selColY[row - 1] = true;
            else if (col === 2) selectedCellPoly.selColZ[row - 1] = true;
            selectedCellPoly.startRowIndex = row;
            selectedCellPoly.startCellIndex = col;
        }
    }
}

export function KEYDOWN(ev) {
    console.log("in FOCUS", ev.keyCode);
    // trap the return and space keys being pressed
    if (ev.keyCode === 32) {    // Leertaste
        ev.preventDefault();
    } else if (ev.keyCode === 13) {    // return
        ev.preventDefault();

        const el = document.getElementById("input_pkte");
        if (el) {
            const npkte = el.value;

            const tabelle = document.getElementById("polygonTable");
            const row = selectedCellPoly.row;
            const col = selectedCellPoly.col;
            let str = 'pt-' + row + '-' + col;
            const elem = document.getElementById(str);
            console.log("<RETURN> ID", elem.id, elem.classList);
            elem.classList.remove('highlight');  // alle selektierte Zellen löschen
            for (let i = 0; i < npkte; i++) {
                selectedCellPoly.selColY[i] = false;
                selectedCellPoly.selColZ[i] = false;
            }
            if (col == 1) {
                str = 'pt-' + row + '-2';
            } else if (col == 2) {
                if (row < npkte) {
                    str = 'pt-' + Number(row + 1) + '-1';
                } else {
                    str = 'pt-1-1';
                }
            }

            const elemNeu = document.getElementById(str);
            elemNeu.classList.add('highlight');
            elemNeu.innerText = "";
            elemNeu.focus();
            const evt = new Event("mousedown", {"bubbles": true, "cancelable": false});
            evt.button = 0;     // linke Maustaste
            elemNeu.dispatchEvent(evt);

        }

    }
}

// render the tables
tabulate(polygon.punkte, ['Punkt', 'y [cm]', 'z [cm]', 'sigma [kN/cm²]']); // 4 column table

const tabelle = document.getElementById("polygonTable");

tabelle.rows[1].cells[1].innerText = 0;
tabelle.rows[2].cells[1].innerText = 30;
tabelle.rows[3].cells[1].innerText = 30;
tabelle.rows[4].cells[1].innerText = 0;
tabelle.rows[5].cells[1].innerText = 10;
tabelle.rows[6].cells[1].innerText = 20;
tabelle.rows[7].cells[1].innerText = 20;
tabelle.rows[8].cells[1].innerText = 10;
tabelle.rows[9].cells[1].innerText = 10;
tabelle.rows[10].cells[1].innerText = 0;

tabelle.rows[1].cells[2].innerText = 0;
tabelle.rows[2].cells[2].innerText = 0;
tabelle.rows[3].cells[2].innerText = 30;
tabelle.rows[4].cells[2].innerText = 30;
tabelle.rows[5].cells[2].innerText = 20;
tabelle.rows[6].cells[2].innerText = 20;
tabelle.rows[7].cells[2].innerText = 10;
tabelle.rows[8].cells[2].innerText = 10;
tabelle.rows[9].cells[2].innerText = 20;
tabelle.rows[10].cells[2].innerText = 30;

tabelle.rows[0].cells[1].innerHTML = 'y&#772; [cm]';
tabelle.rows[0].cells[2].innerHTML = 'z&#772; [cm]';

const objCells = tabelle.rows.item(0).cells;  // Überschrift Punkt zentrieren
objCells.item(0).style.textAlign = "center";

for (let i = 1; i < tabelle.rows.length; i++) {
    const objCells = tabelle.rows.item(i).cells;
    objCells.item(0).contentEditable = false;
    objCells.item(0).style.textAlign = "center";
    objCells.item(1).id = "pt-" + i + "-" + 1;
    objCells.item(2).id = "pt-" + i + "-" + 2;
    objCells.item(3).contentEditable = false;
    objCells.item(1).wrap = false;

}

const table = document.getElementById("schnittgroessen_table");

let isMouseDown = false;
let startRowIndex = null;
let startCellIndex = null;

function clearSelection() {
    table.querySelectorAll(".selected").forEach(el => el.classList.remove("selected"));
}

function selectTo(cell) {

    const cellIndex = cell.cellIndex;
    const rowIndex = cell.parentElement.sectionRowIndex;

    let rowStart, rowEnd, cellStart, cellEnd;

    if (rowIndex < startRowIndex) {
        rowStart = rowIndex;
        rowEnd = startRowIndex;
    } else {
        rowStart = startRowIndex;
        rowEnd = rowIndex;
    }

    if (cellIndex < startCellIndex) {
        cellStart = cellIndex;
        cellEnd = startCellIndex;
    } else {
        cellStart = startCellIndex;
        cellEnd = cellIndex;
    }

    for (let i = rowStart; i <= rowEnd; i++) {
        const rowCells = table.rows[i].cells;
        for (let j = cellStart; j <= cellEnd; j++) {
            if (rowCells[j]) rowCells[j].classList.add("selected");
        }
    }
}

table.querySelectorAll("td").forEach(td => {
    td.addEventListener("mousedown", function (e) {
        isMouseDown = true;
        const cell = this;

        clearSelection(); // deselect everything

        if (e.shiftKey) {
            selectTo(cell);
        } else {
            cell.classList.add("selected");
            startCellIndex = cell.cellIndex;
            startRowIndex = cell.parentElement.sectionRowIndex;
        }

        e.preventDefault();   // prevent text selection
        e.stopPropagation();
    });
    td.addEventListener("mouseover", function () {
        console.log("mouseover");
        if (!isMouseDown) return;
        clearSelection(); // deselect everything
        selectTo(this);
    });
    td.addEventListener("selectstart", function (e) {
        e.preventDefault();
        e.stopPropagation();
    });
});

document.addEventListener("mouseup", function () {
    isMouseDown = false;
});
try {
    navigator.permissions.query({name: "clipboard-write"}).then(result => {
        if ('state' in result) {
            if (result.state == "granted" || result.state == "prompt") {
                console.log("clipboard write erlaubt");
                infoBox.innerHTML += "<br>clipboard write erlaubt";
            } else {
                infoBox.innerHTML += "<br>clipboard write NICHT erlaubt";
            }
        }
    });
} catch (error) {
    infoBox.innerHTML += "<br>clipboard-write NICHT implementiert";
}

//**********************************************************************************************************************

const tpoly = document.getElementById("polygonTable");
console.log("polygonTable bounding rect", tpoly.getBoundingClientRect().left, tpoly.getBoundingClientRect().top);

let zelle = document.getElementById("pt-1-1");
console.log("pt-1-1", zelle.getBoundingClientRect().left, zelle.getBoundingClientRect().top, zelle.getBoundingClientRect().width, zelle.getBoundingClientRect().height);

let cellHeight = zelle.getBoundingClientRect().height;
let cellWidth = zelle.getBoundingClientRect().width;
let cellLeft = zelle.getBoundingClientRect().left;
let cellTop = zelle.getBoundingClientRect().top;

//**********************************************************************************************************************

const polyCanvas = d3.select("#polyCanvas")
    .on("touchmove", function (event) {
        let width, height;
        width = event.changedTouches[0].pageX - xPolyCanvas - cellLeft; // + window.scrollX;    clientX
        height = event.changedTouches[0].pageY - yPolyCanvas - cellTop; // + window.scrollY;
        rechteck.attr("width", width + 'px');
        rechteck.attr("height", height + 'px');
        event.preventDefault();
        console.log("TM", cellLeft, cellTop, width, height, event.changedTouches[0].clientX, event.changedTouches[0].clientY);
    })
    .on("touchstart", function (ev) {
        console.log("touchstart polyCanvas");
        document.getElementById("polyCanvas").style.display = "block";
    })
    .on("touchend", function (ev) {
        console.log("touchend polyCanvas");
        document.getElementById("polyCanvas").style.display = "none";

    });

console.log("polyCanvas", polyCanvas.node().getBoundingClientRect());

const inputContainer = document.getElementById("input-container");
console.log("scroll", inputContainer.scrollTop, inputContainer.scrollHeight);

polyCanvas.node().style.left = zelle.getBoundingClientRect().left + window.scrollX + "px";
polyCanvas.node().style.top = zelle.getBoundingClientRect().top + window.scrollY + "px";   // scrollY
polyCanvas.node().style.height = 10 * cellHeight + "px";
polyCanvas.node().style.width = 3 * cellWidth + "px";

let xPolyCanvas = zelle.getBoundingClientRect().left + window.scrollX;
let yPolyCanvas = zelle.getBoundingClientRect().top + window.scrollY;

let rechteck = polyCanvas.append("rect")   // rechteck
    .attr("x", 0)  // window.scrollX + 'px'
    .attr("y", 0)  // window.scrollY + 'px'
    .attr("width", Math.round(cellWidth - 2))
    .attr("height", Math.round(cellHeight - 2))
    .attr("stroke", "blue")
    .attr("stroke-width", 4)
    .attr("id", "rechteck")
    .style("z-index", "10")
    .style("fill", "none");

document.getElementById("polyCanvas").style.display = "none";

console.log("POLYCANVAS", xPolyCanvas, yPolyCanvas);
