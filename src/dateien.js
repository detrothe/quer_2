import './listener.js';
import {resize_polyTabelle} from "./listener";
import {app, myScreen} from "./index";

function handleFileSelect_read() {

    let input = document.createElement('input');
    input.type = 'file';
    input.onchange = _ => {
        // you can use this method to get file and perform respective operations

        let files = Array.from(input.files);
        console.log("in select read");
        let filename;

        // Loop through the FileList and render image files as thumbnails.
        for (let i = 0, f; f = files[i]; i++) {
            filename = files[0].name;
            console.log("filename: ", files[0].name);

            const reader = new FileReader();

            // Closure to capture the file information.
            reader.onload = (function (theFile) {
                return function (e) {
                    // Render thumbnail.

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

        }
    }

    input.click();
}

async function handleFileSelect_save() {

    console.log("in select save");

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
                        yi = col.innerText;
                        y[i - 1] = yi;
                    }
                    if (j == 2) {
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

        if (app.hasFSAccess) {

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

                const fileStream = await fileHandle.createWritable();

                // (C) WRITE FILE
                await fileStream.write(myBlob);
                await fileStream.close();

            } catch (error) {
                alert(error.message);
            }

        } else {

            const filename = window.prompt("Name der Datei mit Extension, z.B. test.txt\nDie Datei wird im Default Download Ordner gespeichert");
            const myFile = new File([jsonse], filename, {type: "text/plain;charset=utf-8"});
            try {
                saveAs(myFile);
            } catch (error) {
                alert(error.message);
            }

        }

    }

}

document.getElementById('readFile').addEventListener('click',  handleFileSelect_read, false);
document.getElementById('saveFile').addEventListener('click', handleFileSelect_save, false);
//
