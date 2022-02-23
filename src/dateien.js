import './listener.js';
import {resize_polyTabelle} from "./listener";
import {app, myScreen} from "./index";


function handleFileSelect_read() {

    let input = document.createElement('input');
    input.type = 'file';
    input.onchange = _ => {
        // you can use this method to get file and perform respective operations
        //let files =   Array.from(input.files);
        //console.log(files);

        //function handleFileSelect_read() {     // evt

        let files = Array.from(input.files);
        //    const files = evt.target.files; // FileList object
        console.log("in select read");
        let filename;

        // Loop through the FileList and render image files as thumbnails.
        for (let i = 0, f; f = files[i]; i++) {
            /*
                    // Only process image files.
                    if (!f.type.match('txt.*')) {
            console.log("kein match");
                        continue;
                    }
            */
            filename = files[0].name;
            console.log("filename: ", files[0].name);

            const reader = new FileReader();

            // Closure to capture the file information.
            reader.onload = (function (theFile) {
                return function (e) {
                    // Render thumbnail.
                    /*
                    let span = document.createElement('span');
                    span.innerHTML = e.target.result.split('\n'); //.join(';');
                    document.getElementById('list').insertBefore(span, null);
                    */

                    console.log("in result", e.target.result);
                    let jobj = JSON.parse(e.target.result);
                    console.log("und zurück", jobj);

                    // in Tabelle schreiben
                    document.getElementById("input_pkte").value = jobj.npkte;
                    document.getElementById("N_kraft").value = jobj.N;
                    document.getElementById("My").value = jobj.My;
                    document.getElementById("Mz").value = jobj.Mz;

                    resize_polyTabelle();

                    const tabelle = document.getElementById("polygonTable");
                    for (let i = 1; i < tabelle.rows.length; i++) {
                        tabelle.rows[i].cells[1].innerText = jobj.Y[i - 1];
                        tabelle.rows[i].cells[2].innerText = jobj.Z[i - 1];
                        console.log("y,z", jobj.Y[i - 1], jobj.Z[i - 1]);
                    }

                };
            })(f);

            // Read in the image file as a data URL.
            reader.readAsText(f);
            //console.log("f", reader);

            /*
                    //var blob = new Blob([jsonse], {type: "application/json"});
                    console.log("polyData", jsonse);
                    let y_new = jobj.Y;
                    console.log("y_new", y_new);
            */

        }
    }

    input.click();
}

/*
function initFileSelect_read() {
    $("#readFile")[0].value = '';   // Damit man gleiche Datei mehrmals einlesen kann
}
*/

async function handleFileSelect_save() {

    //const filename = window.prompt("Name der Datei mit Extension, z.B. test.txt\nDie Datei wird im Default Download Ordner gespeichert");
    console.log("in select save");
    //console.log("filename", filename);

    const elem = document.getElementById("input_pkte");

    if (elem) {

        let jsonObj = [];
        let yi, zi;
        const npkte = elem.value;
        const y = new Float64Array(npkte);
        const z = new Float64Array(npkte);

        const tabelle = document.getElementById("polygonTable");

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

//        console.log("jsonObj", jsonObj);

        const Normalkraft = document.getElementById("N_kraft").value.replace(/,/g, '.');
        const My = document.getElementById("My").value.replace(/,/g, '.');
        const Mz = document.getElementById("Mz").value.replace(/,/g, '.');

        let polyData = {
            'npkte': npkte,
            'N': Normalkraft,
            'My': My,
            'Mz': Mz,
            'Y': y,
            'Z': z
        };


        let jsonse = JSON.stringify(polyData);   // jsonObj
        /*
                const myFile = new File([jsonse], filename, {type: "text/plain;charset=utf-8"});
                saveAs(myFile);
        */
        // download( jsonse );

        /*   Das geht auch
        var bb = new Blob([jsonse], { type: 'text/plain' });
        var a = document.createElement('a');
        a.download = 'download1.txt';
        a.href = window.URL.createObjectURL(bb);
        a.click();

         */

//        async function saveFile() {

        if (app.hasFSAccess) {

            //window.alert("showSaveFilePicker bekannt")

            try {
                // (A) CREATE BLOB OBJECT
                const myBlob = new Blob([jsonse], {type: "text/plain"});

                // (B) FILE HANDLER & FILE STREAM
                const fileHandle = await window.showSaveFilePicker({
                    types: [{
                        description: "Text file",
                        accept: {"text/plain": [".txt"]}
                    }]
                });
                const infoBox = document.getElementById("infoBox");
                //infoBox.innerHTML = "infoBox=" + infoBox + "<br>";

                const fileStream = await fileHandle.createWritable();
                //infoBox.innerHTML += "fileStream=" + fileStream + "<br>";

                // (C) WRITE FILE
                await fileStream.write(myBlob);
                await fileStream.close();

            } catch (error) {
                //alert(error.name);
                alert(error.message);
            }

        } else {

            //window.alert("showSaveFilePicker UNBEKANNT");
            const filename = window.prompt("Name der Datei mit Extension, z.B. test.txt\nDie Datei wird im Default Download Ordner gespeichert");
            const myFile = new File([jsonse], filename, {type: "text/plain;charset=utf-8"});
            try {
                saveAs(myFile);
            } catch (error) {
                //alert(error.name);
                alert(error.message);
            }

        }

    }

    //  }
}

//document.getElementById('readFile').addEventListener('click', initFileSelect_read, false);
document.getElementById('readFile').addEventListener('click', handleFileSelect_read, false);
document.getElementById('saveFile').addEventListener('click', handleFileSelect_save, false);
//
// document.getElementById("saveFile").onclick = handleFileSelect_save;


/*
let fileHandle;
document.getElementById('saveFile').addEventListener('click', async () => {
    // Destructure the one-element array.
    fileHandle = await window.showOpenFilePicker();
    // Do something with the file handle.
});
*/

/*
function download(content)
{

    var file = new Blob([content],
        {
            type: 'text/xml;charset=UTF-8'
        });
    var reader = new FileReader();
    reader.onload = function()
    {
        var popup = window.open();
        console.log("popup",popup);
        var link = document.createElement('a');
        link.setAttribute('href', reader.result);
        link.setAttribute('download', 'filename.xml');
        popup.document.body.appendChild(link);
        link.click();
        popup.close;
    }
    reader.readAsDataURL(file);
}
*/
// document.getElementById('saveFile').addEventListener('click', handleFileSelect_save);

/*
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
*/


/*
function createBlob(data) {
    return new Blob([data], { type: "text/plain" });
}

function saveAs(content, fileName) {
    const a = document.createElement("a");
    const isBlob = content.toString().indexOf("Blob") > -1;
    let url = content;
    if (isBlob) {
        url = window.URL.createObjectURL(content);
    }
    a.href = url;
    a.download = fileName;
    a.click();
    if (isBlob) {
        window.URL.revokeObjectURL(url);
    }
}

async function zipFiles() {
    const zip = new JSZip();
    const file1 = createBlob("Hello, file 1!");
    const file2 = createBlob("Hello, file 2!");
    zip.file("file1.txt", file1);
    zip.file("file2.txt", file2);
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "folder.zip");
}

function downloadFile() {
    const file = createBlob("Hello, file!");
    saveAs(file, "myFile.txt");
}
*/
