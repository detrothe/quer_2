import {app, byId} from './state';
import {polyTable} from './tabelle';
import {resize_polyTabelle} from './listener';

/**
 * Dateiformat (JSON). Y und Z werden wie bisher als serialisiertes
 * Float64Array gespeichert, also als Objekt {"0": .., "1": ..}.
 * Beim Einlesen werden Objekt und Array gleichermaßen akzeptiert.
 */
interface PolyData {
    npkte: string | number;
    N: string;
    My: string;
    Mz: string;
    Y: Record<number, number | null>;
    Z: Record<number, number | null>;
}

function input(id: string): HTMLInputElement {
    return byId<HTMLInputElement>(id);
}

function handleFileSelect_read(): void {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.onchange = () => {
        const file = fileInput.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            let jobj: PolyData;
            try {
                jobj = JSON.parse(String(reader.result));
            } catch {
                alert('Die Datei enthält keine gültigen Querschnittsdaten.');
                return;
            }

            input('input_pkte').value = String(jobj.npkte);
            input('N_kraft').value = jobj.N;
            input('My').value = jobj.My;
            input('Mz').value = jobj.Mz;

            resize_polyTabelle();

            const rows = polyTable().tBodies[0].rows;
            for (let i = 0; i < rows.length; i++) {
                rows[i].cells[1].innerText = String(jobj.Y[i] ?? '');
                rows[i].cells[2].innerText = String(jobj.Z[i] ?? '');
            }
        };
        reader.readAsText(file);
    };
    fileInput.click();
}

/** Download über einen temporären Link (für Browser ohne showSaveFilePicker). */
function download(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
}

async function handleFileSelect_save(): Promise<void> {
    const npkte = input('input_pkte').value;
    const rows = polyTable().tBodies[0].rows;

    const y = new Float64Array(rows.length);
    const z = new Float64Array(rows.length);
    for (let i = 0; i < rows.length; i++) {
        y[i] = Number(rows[i].cells[1].innerText);
        z[i] = Number(rows[i].cells[2].innerText);
    }

    const polyData = {
        npkte,
        N: input('N_kraft').value.replace(/,/g, '.'),
        My: input('My').value.replace(/,/g, '.'),
        Mz: input('Mz').value.replace(/,/g, '.'),
        Y: y,
        Z: z,
    };
    const blob = new Blob([JSON.stringify(polyData)], {type: 'text/plain'});

    if (app.hasFSAccess && window.showSaveFilePicker) {
        try {
            const fileHandle = await window.showSaveFilePicker({
                types: [{description: 'Text file', accept: {'text/plain': ['.txt']}}],
            });
            const fileStream = await fileHandle.createWritable();
            await fileStream.write(blob);
            await fileStream.close();
        } catch (error) {
            // Abbruch im Dateidialog ist kein Fehler
            if (error instanceof DOMException && error.name === 'AbortError') return;
            alert(error instanceof Error ? error.message : String(error));
        }
    } else {
        const filename = window.prompt('Name der Datei mit Extension, z.B. test.txt\nDie Datei wird im Default Download Ordner gespeichert');
        if (!filename) return;
        download(blob, filename);
    }
}

export function initDateien(): void {
    byId('readFile').addEventListener('click', handleFileSelect_read);
    byId('saveFile').addEventListener('click', () => void handleFileSelect_save());
}
