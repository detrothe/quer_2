import {app, byId} from './state';
import {leseRohwerte, setzePunkte, MIN_PUNKTE} from './punkte';
import {alertdialog} from './components/confirm_dialog';

/**
 * Dateiformat (JSON). Y und Z werden wie bisher als Objekt {"0": .., "1": ..} gespeichert
 * (früher ein serialisiertes Float64Array). Beim Einlesen werden Objekt und Array akzeptiert.
 */
interface PolyData {
    npkte: string | number;
    N: string;
    My: string;
    Mz: string;
    Y: Record<number, number | string | null>;
    Z: Record<number, number | string | null>;
}

function input(id: string): HTMLInputElement {
    return byId<HTMLInputElement>(id);
}

/** Text einer Zelle als Zahl wie früher (leer → 0, ungültig → null). */
function alsZahl(text: string): number | null {
    const wert = Number(text.replace(/,/g, '.'));
    return Number.isFinite(wert) ? wert : null;
}

/** Aktuelle Eingabe (Punkte und Schnittgrößen) als JSON-Text. */
export function eingabeAlsJSON(): string {
    const {y, z} = leseRohwerte();
    const alsObjekt = (werte: string[]) => Object.fromEntries(werte.map((w, i) => [i, alsZahl(w)]));

    return JSON.stringify({
        npkte: String(y.length),
        N: input('N_kraft').value.replace(/,/g, '.'),
        My: input('My').value.replace(/,/g, '.'),
        Mz: input('Mz').value.replace(/,/g, '.'),
        Y: alsObjekt(y),
        Z: alsObjekt(z),
    });
}

/**
 * Eingabe aus JSON-Text in Tabelle und Eingabefelder übernehmen.
 * @return false, wenn der Text keine gültigen Querschnittsdaten enthält (es wird dann nichts geändert)
 */
export function eingabeEinlesen(json: string): boolean {
    let jobj: PolyData;
    try {
        jobj = JSON.parse(json);
    } catch {
        return false;
    }
    const npkte = Number(jobj?.npkte);
    if (!Number.isInteger(npkte) || npkte < MIN_PUNKTE || typeof jobj.Y !== 'object' || typeof jobj.Z !== 'object') {
        return false;
    }

    input('N_kraft').value = jobj.N ?? '';
    input('My').value = jobj.My ?? '';
    input('Mz').value = jobj.Mz ?? '';

    const y = Array.from({length: npkte}, (_, i) => jobj.Y[i] ?? '');
    const z = Array.from({length: npkte}, (_, i) => jobj.Z[i] ?? '');
    setzePunkte(y, z);
    return true;
}

function handleFileSelect_read(): void {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.onchange = () => {
        const file = fileInput.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            if (eingabeEinlesen(String(reader.result))) {
                byId('id_dateiname').textContent = file.name;
            } else {
                void alertdialog('ok', 'Die Datei enthält keine gültigen Querschnittsdaten.');
            }
        };
        reader.readAsText(file);
    };
    fileInput.click();
}

/** Download über einen temporären Link (für Browser ohne showSaveFilePicker). */
export function download(blob: Blob, filename: string): void {
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
    const blob = new Blob([eingabeAlsJSON()], {type: 'text/plain'});

    if (app.hasFSAccess && window.showSaveFilePicker) {
        try {
            const fileHandle = await window.showSaveFilePicker({
                types: [{description: 'Text file', accept: {'text/plain': ['.txt']}}],
            });
            const fileStream = await fileHandle.createWritable();
            await fileStream.write(blob);
            await fileStream.close();
            byId('id_dateiname').textContent = fileHandle.name;
        } catch (error) {
            // Abbruch im Dateidialog ist kein Fehler
            if (error instanceof DOMException && error.name === 'AbortError') return;
            void alertdialog('ok', error instanceof Error ? error.message : String(error));
        }
    } else {
        const filename = window.prompt('Name der Datei mit Extension, z.B. test.txt\nDie Datei wird im Default Download Ordner gespeichert');
        if (!filename) return;
        download(blob, filename);
        byId('id_dateiname').textContent = filename;
    }
}

/**
 * PNG-Bild speichern: mit Dateidialog, wenn vorhanden, sonst als Download.
 * Der Dateidialog muss direkt aus dem Klick heraus geöffnet werden – das Bild wird deshalb erst danach erzeugt.
 */
export async function bildSpeichern(erzeugeBild: () => Promise<Blob>, vorschlag: string): Promise<void> {
    try {
        if (app.hasFSAccess && window.showSaveFilePicker) {
            const fileHandle = await window.showSaveFilePicker({
                suggestedName: vorschlag,
                types: [{description: 'PNG-Bild', accept: {'image/png': ['.png']}}],
            });
            const blob = await erzeugeBild();
            const fileStream = await fileHandle.createWritable();
            await fileStream.write(blob);
            await fileStream.close();
        } else {
            download(await erzeugeBild(), vorschlag);
        }
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        void alertdialog('ok', error instanceof Error ? error.message : String(error));
    }
}

export function initDateien(): void {
    byId('readFile').addEventListener('click', handleFileSelect_read);
    byId('saveFile').addEventListener('click', () => void handleFileSelect_save());
}
