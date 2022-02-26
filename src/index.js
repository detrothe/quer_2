//import {spreadsheet} from './spreadsheet/index.js';
//import './spreadsheet/index.js';
'use strict';

import './listener.js';
import './dateien.js';
import {init_contextmenu} from './contextMenu.js';
import * as d3 from "d3";
import DetectOS from 'detectos.js'
import {CQuer_polygon} from "./calc/quer1";


//export var xs; // the spreadsheet

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
    startCellIndex: null

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
        'showOpenFilePicker' in window,
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
/*
document.addEventListener("contextmenu", function (e) {
    console.log("right click", e);

    e.preventDefault();
});
*/

const elem = document.getElementById("input_pkte");
//elem.setAttribute( 'value','8');
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
                //console.log("function (column)",row,column,row[column]);
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
        .on('keydown', function (ev) {
                // console.log("in FOCUS",ev.keyCode);
                // trap the return and space keys being pressed
                if (ev.keyCode === 32) {    // Leertaste
                    ev.preventDefault();
                } else if (ev.keyCode === 13) {    // return
                    ev.preventDefault();

                    const el = document.getElementById("input_pkte");
                    if (el) {
                        const npkte = el.value;

                        const tabelle = document.getElementById("polygonTable");
                        //console.log("Taste Tab gedrückt",tabelle.rows[selectedCellPoly.row].cells[selectedCellPoly.col]);
                        //console.log("Taste Tab gedrückt",tabelle.rows[selectedCellPoly.row].cells.item(selectedCellPoly.col));
                        //console.log("tabelle", tabelle.classList);
                        //tabelle.rows[selectedCellPoly.row].cells[selectedCellPoly.col].removeClass("highlight");
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
                        //$("#polygonTable td").removeClass("highlight");
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
                        const evt = new Event("pointerdown", {"bubbles": true, "cancelable": false});
                        evt.button = 0;     // linke Maustaste
                        elemNeu.dispatchEvent(evt);

                    }

                }
            }
        )
        .on('pointerdown', function (ev) {
                console.log("mousedown", ev.which, ev.button);
                if (ev.which === 3) {               // rechte Maustaste
                    console.log("rechte Maustaste");
                    //ev.preventDefault();
                } else if (ev.button === 0) {      // linke Maustaste
                    if (selectedCellPoly.isSelected) {
                        //selectedCellPoly.activatedMember.removeClass("highlight");
                        console.log("is selected", $(this).parent());
                        const el = document.getElementById("input_pkte");
                        if (el) {
                            const npkte = el.value;
                            $("#polygonTable td").removeClass("highlight");
                            for (let i = 0; i < npkte; i++) {
                                selectedCellPoly.selColY[i] = false;
                                selectedCellPoly.selColZ[i] = false;
                            }
                        }

                    }
                    console.log("cell", $(this), $(this).parent().index());
                    const row = Number($(this).parent().index()) + 1;
                    const col = $(this).index();
                    if (col === 1 || col === 2) {
                        const activatedMember = $(ev.target).closest("td");
                        activatedMember.addClass("highlight");
                        let wert = activatedMember.text();

                        //console.log("event", row, col, wert);
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
        )
        .on('pointermove', function (ev) {
                //console.log("polytable mouseover",ev.buttons,ev);
                if (ev.buttons === 1) {
                    const row = Number($(this).parent().index()) + 1;
                    const col = $(this).index();
                    if (col === 1 || col === 2) {
                        const activatedMember = $(ev.target).closest("td");
                        activatedMember.addClass("highlight");
                        selectedCellPoly.isSelected = true;
                        //console.log("column", col, row);
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
                        // console.log("startend", rowStart, rowEnd, col, row, rowStart, rowEnd, cellStart, cellEnd);

                        $("#polygonTable td").removeClass("highlight");
                        for (let i = 0; i < app.npkte; i++) {
                            selectedCellPoly.selColY[i] = false;
                            selectedCellPoly.selColZ[i] = false;
                        }

                        const tabelle = document.getElementById("polygonTable");
                        for (let i = rowStart; i <= rowEnd; i++) {
                            //const rowCells = table.find("tr").eq(i).find("td");
                            for (let j = cellStart; j <= cellEnd; j++) {
                                //rowCells.eq(j).addClass("selected");
                                tabelle.rows.item(i).cells.item(j).classList.add("highlight");
                                if (j === 1) selectedCellPoly.selColY[i - 1] = true;
                                if (j === 2) selectedCellPoly.selColZ[i - 1] = true;

                            }
                        }
                    }
                }
            }
        )
    //.text("");

    return table;
}

// render the tables
tabulate(polygon.punkte, ['Punkt', 'y [cm]', 'z [cm]', 'sigma [kN/cm²]']); // 4 column table

//tabulate(data, ['date']); // table with only date column
//tabulate(data, ['close']); // table with only close column
/*
let table = document.getElementById("polygonTable");
for (let i in table.rows) {
    let row = table.rows[i]
    console.log('i=',i,'| ',row);
    //iterate through rows
    //rows would be accessed using the "row" variable assigned in the for loop
    for (let j in row.cells) {
        let col = row.cells[j]
        console.log('i=',i,' j=',j,' inner| ',col.innerHTML);
        //iterate through columns
        //columns would be accessed using the "col" variable assigned in the for loop
    }
}
*/

const tabelle = document.getElementById("polygonTable");
//console.log("TABLE",tabelle.rows.length);
/*
tabelle.rows[1].cells[1].innerText = 0;
tabelle.rows[2].cells[1].innerText = 10;
tabelle.rows[3].cells[1].innerText = 10;
tabelle.rows[4].cells[1].innerText = 6;
tabelle.rows[5].cells[1].innerText = 6;
tabelle.rows[6].cells[1].innerText = 4;
tabelle.rows[7].cells[1].innerText = 4;
tabelle.rows[8].cells[1].innerText = 0;

tabelle.rows[1].cells[2].innerText = 0;
tabelle.rows[2].cells[2].innerText = 0;
tabelle.rows[3].cells[2].innerText = 2;
tabelle.rows[4].cells[2].innerText = 2;
tabelle.rows[5].cells[2].innerText = 7;
tabelle.rows[6].cells[2].innerText = 7;
tabelle.rows[7].cells[2].innerText = 2;
tabelle.rows[8].cells[2].innerText = 2;
*/
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


const objCells = tabelle.rows.item(0).cells;  // Überschrift Punkt zentrieren
objCells.item(0).style.textAlign = "center";

for (let i = 1; i < tabelle.rows.length; i++) {
    const objCells = tabelle.rows.item(i).cells;
    objCells.item(0).contentEditable = false;
    objCells.item(0).style.textAlign = "center";
    //objCells.item(1).style.backgroundColor = "#FFFFFF";
    //objCells.item(2).style.backgroundColor = "#FFFFFF";
    objCells.item(1).id = "pt-" + i + "-" + 1;
    objCells.item(2).id = "pt-" + i + "-" + 2;
    objCells.item(3).contentEditable = false;
    objCells.item(1).wrap = false;

    //console.log(objCells.item(0));
}
//--------------------------------------------------------------------
/*
const polytable = $("#polygonTable");

polytable.find("td").mousedown(function (ev) {

    if (ev.which === 1) {
        if (selectedCellPoly.isSelected) {
            //selectedCellPoly.activatedMember.removeClass("highlight");
            console.log("is selected", $(this).parent());

            $("#polygonTable td").removeClass("highlight");
            // $("#polygonTable").addClass("normal");
        }
        const row = Number($(this).parent().index()) + 1;
        const col = $(this).index();
        const activatedMember = $(ev.target).closest("td");
        activatedMember.addClass("highlight");
        let wert = activatedMember.text();

        console.log("event", row, col, wert);
        selectedCellPoly.row = row;
        selectedCellPoly.col = col;
        selectedCellPoly.wert = wert;
        selectedCellPoly.activatedMember = activatedMember;
        selectedCellPoly.isSelected = true;
    }
    ev.preventDefault();
});
*/
//--------------------------------------------------------------------

const table = $("#schnittgroessen_table");

let isMouseDown = false;
let startRowIndex = null;
let startCellIndex = null;

function selectTo(cell) {

    const row = cell.parent();
    const cellIndex = cell.index();
    const rowIndex = row.index();

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
        const rowCells = table.find("tr").eq(i).find("td");
        for (let j = cellStart; j <= cellEnd; j++) {
            rowCells.eq(j).addClass("selected");
        }
    }
}

table.find("td").mousedown(function (e) {
    isMouseDown = true;
    const cell = $(this);

    table.find(".selected").removeClass("selected"); // deselect everything

    if (e.shiftKey) {
        selectTo(cell);
    } else {
        cell.addClass("selected");
        startCellIndex = cell.index();
        startRowIndex = cell.parent().index();
    }

    return false; // prevent text selection
})
    .mouseover(function () {
        console.log("mouseover");
        if (!isMouseDown) return;
        table.find(".selected").removeClass("selected"); // deselect everything
        selectTo($(this));
    })
    .bind("selectstart", function () {
        return false;
    });

$(document).mouseup(function () {
    isMouseDown = false;
});
/*
console.log("navigator", navigator.clipboard);

// Check for the various File API support.
if (window.File && window.FileReader && window.FileList && window.Blob) {

    console.log("Great success! All the File APIs are supported.");
} else {
    alert('The File APIs are not fully supported in this browser.');
}


const coordy = document.getElementById("cursor_coordy");
const coordz = document.getElementById("cursor_coordz");

console.log("coordyz",coordy.getBoundingClientRect().top,coordz.getBoundingClientRect().top,coordy.offsetHeight,coordz.offsetHeight,coordy.clientHeight,coordz.clientHeight,coordy.clientTop,coordz.clientTop);
*/
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

/*
navigator.clipboard
    .writeText("hallo Welt")
    .then(() => {
        console.log("clipboard successfully set ");
    })
    .catch(() => {
        console.log("clipboard write failed");
    });
*/
//coordz.setAttribute("top", coordy.getBoundingClientRect().top);
//coordz.style.top =  "15px";

/*
function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object

    // files is a FileList of File objects. List some properties.
    var output = [];
    for (var i = 0, f; f = files[i]; i++) {
        output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
            f.size, ' bytes, last modified: ',
            f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
            '</li>');
    }
    document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
}
*/


//document.getElementById('files').addEventListener('change', handleFileSelect, false);


/*
const btn_T1 = document.getElementById("taste1");
btn_T1.addEventListener('click', taste_1);
const btn_T2 = document.getElementById("taste2");
btn_T2.addEventListener('click', taste_2);
const btn_T3 = document.getElementById("taste3");
btn_T3.addEventListener('click', taste_3);
const btn_T4 = document.getElementById("taste4");
btn_T4.addEventListener('click', taste_4);
const btn_T5 = document.getElementById("taste5");
btn_T5.addEventListener('click', taste_5);
const btn_T6 = document.getElementById("taste6");
btn_T6.addEventListener('click', taste_6);
const btn_T7 = document.getElementById("taste7");
btn_T7.addEventListener('click', taste_7);
const btn_T8 = document.getElementById("taste8");
btn_T8.addEventListener('click', taste_8);
const btn_T9 = document.getElementById("taste9");
btn_T9.addEventListener('click', taste_9);
const btn_T0 = document.getElementById("taste0");
btn_T0.addEventListener('click', taste_0);
const btn_TKomma = document.getElementById("taste_komma");
btn_TKomma.addEventListener('click', taste_Komma);
const btn_TDel = document.getElementById("taste_del");
btn_TDel.addEventListener('click', taste_Del);
const btn_TExp = document.getElementById("taste_Exp");
btn_TExp.addEventListener('click', taste_Exp);
const btn_TMinus = document.getElementById("taste_Minus");
btn_TMinus.addEventListener('click', taste_Minus);
const btn_TTab = document.getElementById("taste_Tab");
btn_TTab.addEventListener('click', taste_Tab);

function taste_1 () {

    if ( selectedCellPoly.isSelected ) {
        console.log("Taste 1 gedrückt",selectedCellPoly.wert + 1);
        const tabelle = document.getElementById("polygonTable");
        selectedCellPoly.wert = selectedCellPoly.wert + 1;
        tabelle.rows[selectedCellPoly.row].cells[selectedCellPoly.col].innerText = selectedCellPoly.wert;
    }
}
function taste_2 () {

    if ( selectedCellPoly.isSelected ) {
        console.log("Taste 2 gedrückt",selectedCellPoly.wert + 2);
        const tabelle = document.getElementById("polygonTable");
        selectedCellPoly.wert = selectedCellPoly.wert + 2;
        tabelle.rows[selectedCellPoly.row].cells[selectedCellPoly.col].innerText = selectedCellPoly.wert;
    }
}
function taste_3 () {

    if ( selectedCellPoly.isSelected ) {
        console.log("Taste 3 gedrückt",selectedCellPoly.wert + 3);
        const tabelle = document.getElementById("polygonTable");
        selectedCellPoly.wert = selectedCellPoly.wert + 3;
        tabelle.rows[selectedCellPoly.row].cells[selectedCellPoly.col].innerText = selectedCellPoly.wert;
    }
}

function taste_4 () {

if ( selectedCellPoly.isSelected ) {
    console.log("Taste 4 gedrückt",selectedCellPoly.wert + 4);
    const tabelle = document.getElementById("polygonTable");
    selectedCellPoly.wert = selectedCellPoly.wert + 4;
    tabelle.rows[selectedCellPoly.row].cells[selectedCellPoly.col].innerText = selectedCellPoly.wert;
}
}
function taste_5 () {

    if ( selectedCellPoly.isSelected ) {
        console.log("Taste 5 gedrückt",selectedCellPoly.wert + 5);
        const tabelle = document.getElementById("polygonTable");
        selectedCellPoly.wert = selectedCellPoly.wert + 5;
        tabelle.rows[selectedCellPoly.row].cells[selectedCellPoly.col].innerText = selectedCellPoly.wert;
    }
}
function taste_6 () {

    if ( selectedCellPoly.isSelected ) {
        console.log("Taste 6 gedrückt",selectedCellPoly.wert + 6);
        const tabelle = document.getElementById("polygonTable");
        selectedCellPoly.wert = selectedCellPoly.wert + 6;
        tabelle.rows[selectedCellPoly.row].cells[selectedCellPoly.col].innerText = selectedCellPoly.wert;
    }
}
function taste_7 () {

if ( selectedCellPoly.isSelected ) {
    console.log("Taste 7 gedrückt",selectedCellPoly.wert + 7);
    const tabelle = document.getElementById("polygonTable");
    selectedCellPoly.wert = selectedCellPoly.wert + 7;
    tabelle.rows[selectedCellPoly.row].cells[selectedCellPoly.col].innerText = selectedCellPoly.wert;
}
}
function taste_8 () {

    if ( selectedCellPoly.isSelected ) {
        console.log("Taste 8 gedrückt",selectedCellPoly.wert + 8);
        const tabelle = document.getElementById("polygonTable");
        selectedCellPoly.wert = selectedCellPoly.wert + 8;
        tabelle.rows[selectedCellPoly.row].cells[selectedCellPoly.col].innerText = selectedCellPoly.wert;
    }
}
function taste_9 () {

    if ( selectedCellPoly.isSelected ) {
        console.log("Taste 9 gedrückt",selectedCellPoly.wert + 9);
        const tabelle = document.getElementById("polygonTable");
        selectedCellPoly.wert = selectedCellPoly.wert + 9;
        tabelle.rows[selectedCellPoly.row].cells[selectedCellPoly.col].innerText = selectedCellPoly.wert;
    }
}

function taste_0 () {

if ( selectedCellPoly.isSelected ) {
    console.log("Taste 0 gedrückt",selectedCellPoly.wert + 0);
    const tabelle = document.getElementById("polygonTable");
    selectedCellPoly.wert = selectedCellPoly.wert + 0;
    tabelle.rows[selectedCellPoly.row].cells[selectedCellPoly.col].innerText = selectedCellPoly.wert;
}
}
function taste_Komma () {

    if ( selectedCellPoly.isSelected ) {
        console.log("Taste Komma gedrückt",selectedCellPoly.wert + ",");
        const tabelle = document.getElementById("polygonTable");
        selectedCellPoly.wert = selectedCellPoly.wert + ",";
        tabelle.rows[selectedCellPoly.row].cells[selectedCellPoly.col].innerText = selectedCellPoly.wert;
    }
}
function taste_Del () {

    if ( selectedCellPoly.isSelected ) {
        console.log("Taste Del gedrückt",selectedCellPoly.wert);
        const tabelle = document.getElementById("polygonTable");
        let str = selectedCellPoly.wert;
        selectedCellPoly.wert = str.substring(0,str.length-1);
        tabelle.rows[selectedCellPoly.row].cells[selectedCellPoly.col].innerText = selectedCellPoly.wert;
    }
}
function taste_Exp () {

    if ( selectedCellPoly.isSelected ) {
        console.log("Taste Exp gedrückt",selectedCellPoly.wert + 'E');
        const tabelle = document.getElementById("polygonTable");
        selectedCellPoly.wert = selectedCellPoly.wert + "e";
        tabelle.rows[selectedCellPoly.row].cells[selectedCellPoly.col].innerText = selectedCellPoly.wert;
    }
}
function taste_Tab () {

    if ( selectedCellPoly.isSelected ) {
        const tabelle = document.getElementById("polygonTable");
        //console.log("Taste Tab gedrückt",tabelle.rows[selectedCellPoly.row].cells[selectedCellPoly.col]);
        //console.log("Taste Tab gedrückt",tabelle.rows[selectedCellPoly.row].cells.item(selectedCellPoly.col));
        console.log("tabelle",tabelle.classList);
        //tabelle.rows[selectedCellPoly.row].cells[selectedCellPoly.col].removeClass("highlight");
        const row = selectedCellPoly.row;
        const col = selectedCellPoly.col;
        let str = 'pt-' + row + '-' + col;
        const elem = document.getElementById(str);
        console.log("ID",elem.id, elem.classList);
        elem.classList.remove('highlight');
        //$("#polygonTable td").removeClass("highlight");
        if ( col == 1) {
            str = 'pt-' + row + '-2';
        }
        else if ( col == 2 ) {
            if ( row < npkte ) {
                str = 'pt-' + Number(row+1) + '-1';
            } else {
                str = 'pt-1-1';
            }
        }

        const elemNeu = document.getElementById(str);
        elemNeu.classList.add('highlight');
        elemNeu.innerText ="";
        elemNeu.focus();
        const evt = new Event("mousedown", {"bubbles":true, "cancelable":false});
        elemNeu.dispatchEvent(evt);
    }
}
function taste_Minus () {

    if ( selectedCellPoly.isSelected ) {
        console.log("Taste Del gedrückt",selectedCellPoly.wert + "-");
        const tabelle = document.getElementById("polygonTable");
        selectedCellPoly.wert = selectedCellPoly.wert + '-';
        tabelle.rows[selectedCellPoly.row].cells[selectedCellPoly.col].innerText = selectedCellPoly.wert;
    }
}

 */
/*
const polyBox = document.getElementById("polygonTable");

//console.log("polyBox.clientHeight", polyBox.clientHeight);
//console.log("polyBox.style.top", polyBox.getBoundingClientRect().top + window.pageYOffset);
//console.log("top" + document.getElementById("my-svg").style.top);

const tastaturBox = document.getElementById("tastatur");
const newTop = polyBox.getBoundingClientRect().top + window.scrollY;
const newLeft = polyBox.getBoundingClientRect().left + polyBox.getBoundingClientRect().width + window.scrollX + 5;
tastaturBox.style.top = newTop + "px";
tastaturBox.style.left = newLeft + "px";


// Make the DIV element draggable:
dragElement(document.getElementById("tastatur"));

function dragElement(elmnt) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if (document.getElementById(elmnt.id + "_header")) {
        // if present, the header is where you move the DIV from:
        document.getElementById(elmnt.id + "_header").onmousedown = dragMouseDown;
    } else {
        // otherwise, move the DIV from anywhere inside the DIV:
        elmnt.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

const box = document.getElementById('polygonTable');
*/
/* listen to the touchMove event,
every time it fires, grab the location
of touch and assign it to box */
/*
box.addEventListener('touchmove', function(e) {
    // grab the location of touch
    var touchLocation = e.targetTouches[0];

    // assign box new coordinates based on the touch.
    box.style.left = touchLocation.pageX + 'px';
    box.style.top = touchLocation.pageY + 'px';
})
*/
/* record the position of the touch
when released using touchend event.
This will be the drop position. */
/*
box.addEventListener('touchend', function(e) {
    // current box position.
    var x = parseInt(box.style.left);
    var y = parseInt(box.style.top);
})
*/