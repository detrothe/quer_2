//import {spreadsheet} from './spreadsheet/index.js';
//import './spreadsheet/index.js';
import './listener.js';
import * as d3 from "d3";

//export var xs; // the spreadsheet

const selectedCellPoly = {
    isSelected: false,
    selectedCellRow : -1,
    selectedCellCol : -1,
    col: -1,
    row: -1,
    wert: 0,
    activatedMember: null
};

const elem = document.getElementById("input_pkte");
//elem.setAttribute( 'value','8');
elem.value = 10;

// Matrix mit 4 Zeilen und 2 Spalten
const arr = Array.from(Array(4), () => new Array(2).fill(0.0));
/*
arr[0][0] ='11';arr[0][1] ='12';
arr[1][0] ='21';arr[1][1] ='22';
arr[2][0] ='31';arr[2][1] ='32';
arr[3][0] ='41';arr[3][1] ='42';
*/

console.info(arr);

console.log("height=", document.getElementById("my-svg").clientHeight);
console.log("width =", document.getElementById("dataviz_area").clientWidth);
/*
var data = [
    {"date": '2013-01-01', "close": 45},
    {"date": '2013-02-01', "close": 50},
    {"date": '2013-03-01', "close": 55},
    {"date": '2013-04-01', "close": 50},
    {"date": '2013-05-01', "close": 45},
    {"date": '2013-06-01', "close": 50},
    {"date": '2013-07-01', "close": 50},
    {"date": '2013-08-01', "close": 52}
]
*/

const polygon = {};
const punkte = []

polygon.punkte = punkte;

for (let i = 1; i <= 10; i++) {
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

    const table = d3.select('#input-container').append('table').style('border', 'solid').style('border-spacing', '0px').style('padding', "10px").attr("id", "polygonTable")
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
    objCells.item(1).style.backgroundColor = "#FFFFFF";
    objCells.item(2).style.backgroundColor = "#FFFFFF";

    //console.log(objCells.item(0));
}
//--------------------------------------------------------------------
const polytable = $("#polygonTable");
polytable.find("td").mousedown(function (ev) {
    if ( selectedCellPoly.isSelected ) {
        //selectedCellPoly.activatedMember.removeClass("highlight");
        console.log("is selected");
        $("#polygonTable td").removeClass("highlight");
       // $("#polygonTable").addClass("normal");
    }
    const row = Number($(this).parent().index()) + 1;
    const col = $(this).index();
    const activatedMember= $(ev.target).closest("td");
    activatedMember.addClass("highlight");
    let wert = activatedMember.text();

    console.log("event",row,col,wert,activatedMember);
    selectedCellPoly.row = row;
    selectedCellPoly.col = col;
    selectedCellPoly.wert = wert;
    selectedCellPoly.activatedMember = activatedMember;
    selectedCellPoly.isSelected = true;
});
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

console.log("navigator", navigator.clipboard);

// Check for the various File API support.
if (window.File && window.FileReader && window.FileList && window.Blob) {

    console.log("Great success! All the File APIs are supported.");
} else {
    alert('The File APIs are not fully supported in this browser.');
}

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
function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object
    console.log("in select");

    // Loop through the FileList and render image files as thumbnails.
    for (var i = 0, f; f = files[i]; i++) {
        /*
                // Only process image files.
                if (!f.type.match('txt.*')) {
        console.log("kein match");
                    continue;
                }
        */
        var reader = new FileReader();

        // Closure to capture the file information.
        reader.onload = (function (theFile) {
            return function (e) {
                // Render thumbnail.
                var span = document.createElement('span');
                span.innerHTML = e.target.result.split('\n'); //.join(';');
                document.getElementById('list').insertBefore(span, null);
                console.log("in result", e.target.result);
            };
        })(f);

        // Read in the image file as a data URL.
        reader.readAsText(f);
        console.log("f", reader);
    }
}

document.getElementById('files').addEventListener('change', handleFileSelect, false);


function handleFileSelect_drop(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    var files = evt.dataTransfer.files; // FileList object.

    // files is a FileList of File objects. List some properties.
    var output = [];
    for (var i = 0, f; f = files[i]; i++) {
        output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
            f.size, ' bytes, last modified: ',
            f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
            '</li>');
    }
    document.getElementById('list_drop').innerHTML = '<ul>' + output.join('') + '</ul>';
}

function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}

// Setup the dnd listeners.
var dropZone = document.getElementById('drop_zone');
dropZone.addEventListener('dragover', handleDragOver, false);
dropZone.addEventListener('drop', handleFileSelect_drop, false);

let jsonObj = [];
let yi, zi;
const npkte = elem.value;
const y = new Float64Array(npkte);
const z = new Float64Array(npkte);

//let table = document.getElementById("polygonTable");
for (let i in tabelle.rows) {
    let row = tabelle.rows[i]
    for (let j in row.cells) {
        let col = row.cells[j]

        if (i > 0) {
            if (j == 1) {
                //tabelle.rows.item(i).cells.item(j).style.backgroundColor = "white";
                yi = col.innerText;
                y[i - 1] = yi;
            }
            if (j == 2) {
                //tabelle.rows.item(i).cells.item(j).style.backgroundColor = "white";
                zi = col.innerText;
                z[i - 1] = zi;
            }
        }
    }
    if (i > 0) {
        let item = {}
        item["y"] = yi;
        item["z"] = zi;

        jsonObj.push(item);
    }
}

console.log("jsonObj", jsonObj);

//const elem = document.getElementById("input_pkte");

if (elem) {
    const npkte = elem.value;

    let polyData = {
        'npkte': npkte,
        'N': 3,
        'My': 34,
        'Mz': 44,
        'Y': y,
        'Z': z
    };


    let jsonse = JSON.stringify(polyData);   // jsonObj

    let jobj = JSON.parse(jsonse);
    console.log("und zurück", jobj);

    //var blob = new Blob([jsonse], {type: "application/json"});

    console.log("polyData", jsonse);

    let y_new = jobj.Y;
    console.log("y_new",y_new);
}

//document.getElementById('files').addEventListener('change', handleFileSelect, false);

// (B) "SAVE AS"
//var myFile = new File([jsonse], "demo.txt", { type: "text/plain;charset=utf-8" });
//saveAs(myFile);

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
/*
const selectedCellPoly = {
    isSelected: false,
    selectedCellRow : -1,
    selectedCellCol : -1,
    col: -1,
    row: -1,
    wert: 0,
    activatedMember: null
};

 */

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

/* listen to the touchMove event,
every time it fires, grab the location
of touch and assign it to box */

box.addEventListener('touchmove', function(e) {
    // grab the location of touch
    var touchLocation = e.targetTouches[0];

    // assign box new coordinates based on the touch.
    box.style.left = touchLocation.pageX + 'px';
    box.style.top = touchLocation.pageY + 'px';
})

/* record the position of the touch
when released using touchend event.
This will be the drop position. */

box.addEventListener('touchend', function(e) {
    // current box position.
    var x = parseInt(box.style.left);
    var y = parseInt(box.style.top);
})
