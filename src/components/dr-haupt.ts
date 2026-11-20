import {LitElement, html} from 'lit';
import {customElement} from 'lit/decorators.js';

import '@shoelace-style/shoelace/dist/components/tab-group/tab-group.js';
import '@shoelace-style/shoelace/dist/components/tab/tab.js';
import '@shoelace-style/shoelace/dist/components/tab-panel/tab-panel.js';
import type SlTabGroup from '@shoelace-style/shoelace/dist/components/tab-group/tab-group.js';

import './dr-tabelle';
import './dr-button-pm';
import {TABELLE_ID, ZAEHLER_ID, START_Y} from '../punkte';

/*
 * Oberfläche von quer_2 im Stil von d2beam-gui: Tabs Eingabe | Ergebnisse | 3D | Info.
 *
 * Anders als dr-haupt in d2beam-gui rendert diese Komponente OHNE Shadow DOM (createRenderRoot),
 * damit der übrige Code die Elemente wie gewohnt mit document.getElementById findet und das
 * normale CSS greift. Nur dr-tabelle und dr-button-pm haben ihr eigenes Shadow DOM.
 */

const ICON_NEU = html`<svg width="1.4rem" height="1.4rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M12 11v6M9 14h6"/></svg>`;
const ICON_EINLESEN = html`<svg width="1.4rem" height="1.4rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M6 14l1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/></svg>`;
const ICON_SPEICHERN = html`<svg width="1.4rem" height="1.4rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M5 3h11l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M7 3v5h8V3"/><rect x="7" y="13" width="10" height="8" rx="1"/></svg>`;

const WERTE: [string, unknown, unknown][] = [
    ['ys', html`y<sub>s</sub>`, 'cm'],
    ['zs', html`z<sub>s</sub>`, 'cm'],
    ['area', 'A', 'cm²'],
    ['Iys', html`I<sub>y,s</sub>`, html`cm<sup>4</sup>`],
    ['Izs', html`I<sub>z,s</sub>`, html`cm<sup>4</sup>`],
    ['Iyzs', html`I<sub>yz,s</sub>`, html`cm<sup>4</sup>`],
    ['I11', html`I<sub>11</sub>`, html`cm<sup>4</sup>`],
    ['I22', html`I<sub>22</sub>`, html`cm<sup>4</sup>`],
    ['phi_h', html`&phi;<sub>h</sub>`, '°'],
];

@customElement('dr-haupt')
export class DrHaupt extends LitElement {

    // kein Shadow DOM (siehe oben)
    protected override createRenderRoot() {
        return this;
    }

    /** Tab programmgesteuert anzeigen (z.B. nach dem Rechnen). */
    zeigeTab(name: 'eingabe' | 'ergebnisse' | 'drei_d' | 'info'): void {
        this.querySelector<SlTabGroup>('#id_tabs')?.show(name);
    }

    override render() {
        return html`
      <sl-tab-group id="id_tabs">
        <sl-tab slot="nav" panel="eingabe">Eingabe</sl-tab>
        <sl-tab slot="nav" panel="ergebnisse">Ergebnisse</sl-tab>
        <sl-tab slot="nav" panel="drei_d">3D</sl-tab>
        <sl-tab slot="nav" panel="info">Info</sl-tab>
        <sl-tab slot="nav" panel="einstellungen" title="Einstellungen">ꔷꔷꔷ</sl-tab>

        <!------------------------------------------------------------------------------------- Eingabe -->
        <sl-tab-panel name="eingabe">
          <p class="dateiname">aktueller Dateiname: <span id="id_dateiname"></span></p>
          <div class="file_toolbar" id="id_file_toolbar">
            <button type="button" id="neueEingabe" class="btn_file" title="neue Eingabe beginnen" aria-label="neue Eingabe beginnen">${ICON_NEU}</button>
            <button type="button" id="readFile" class="btn_file" title="Querschnitt einlesen" aria-label="Querschnitt einlesen">${ICON_EINLESEN}</button>
            <button type="button" id="saveFile" class="btn_file" title="Querschnitt speichern" aria-label="Querschnitt speichern">${ICON_SPEICHERN}</button>
            <button type="button" id="rechnen" class="btn_rechnen"
              title="Querschnittswerte und Spannungen berechnen (farbig hinterlegt, wenn die Eingabe geändert wurde)">Rechnen</button>
          </div>

          <hr />

          <h3>Schnittgrößen</h3>
          <table class="schnittgroessen">
            <tr><td>N</td><td><input type="number" step="any" id="N_kraft" class="input_tab" pattern="[0-9.,eE+-]*"></td><td>kN</td></tr>
            <tr><td>M<sub>y</sub></td><td><input type="number" step="any" id="My" class="input_tab" pattern="[0-9.,eE+-]*"></td><td>kNm</td></tr>
            <tr><td>M<sub>z</sub></td><td><input type="number" step="any" id="Mz" class="input_tab" pattern="[0-9.,eE+-]*"></td><td>kNm</td></tr>
          </table>

          <h3>Polygonpunkte</h3>
          <p class="hinweis">Punkte gegen den Uhrzeigersinn eingeben (so wie in der Grafik mit y&#772; nach links und
            z&#772; nach unten dargestellt). Löcher über einen Schlitz (hin und zurück auf derselben Kante);
            die Punkte des Lochrands sind dabei im Uhrzeigersinn einzugeben.
            Rechte Maustaste bzw. langes Drücken auf markierte Zellen öffnet das Kontextmenü.
            In der Spalte No fügt <b>+</b> oberhalb eine Zeile ein, der Papierkorb löscht die Zeile
            (beides mit Rückgängig/Wiederherstellen).</p>
          <div class="zeile">
            <dr-button-pm id="${ZAEHLER_ID}" txt="Anzahl Punkte: " inputid="npkte" .nel="${START_Y.length}" .minValue="${3}"></dr-button-pm>
          </div>
          <dr-tabelle
            id="${TABELLE_ID}"
            allow_delete_row
            allow_insert_row
            nzeilen="${START_Y.length}"
            nspalten="2"
            columns='["No", "y&#772; [cm]", "z&#772; [cm]"]'
            colwidth='["3","6","6"]'
          ></dr-tabelle>
        </sl-tab-panel>

        <!---------------------------------------------------------------------------------- Ergebnisse -->
        <sl-tab-panel name="ergebnisse">
          <div class="ergebnisse">
            <div class="ergebnis_tabellen">
              <h3>Querschnittswerte</h3>
              <table id="schnittgroessen_table" class="werte">
                ${WERTE.map(([id, name, einheit]) => html`
                  <tr><td>${name} =</td><td class="zahl" id="${id}"></td><td>${einheit}</td></tr>`)}
              </table>

              <h3>Spannungen in den Eckpunkten</h3>
              <table class="werte">
                <thead><tr><th>Punkt</th><th>y&#772; [cm]</th><th>z&#772; [cm]</th><th>&sigma; [kN/cm²]</th></tr></thead>
                <tbody id="sigma_tbody"></tbody>
              </table>
              <p class="hinweis" id="id_hinweis_rechnen">Noch nicht gerechnet – im Tab <i>Eingabe</i> auf <i>Rechnen</i> drücken.</p>
              <p class="hinweis warnung" id="id_hinweis_umlauf" hidden>Die Punkte wurden im Uhrzeigersinn eingegeben.
                Für die Berechnung wurde die Reihenfolge umgekehrt (gegen den Uhrzeigersinn).</p>
            </div>

            <div id="my-svg">
              <div id="cursor_coord"><span id="cursor_coordy">y&#772;:</span> <span id="cursor_coordz">z&#772;:</span></div>
              <svg id="dataviz_area"></svg>
            </div>
          </div>
        </sl-tab-panel>

        <!-------------------------------------------------------------------------------------- 3D -->
        <sl-tab-panel name="drei_d">
          <div id="view3d">
            <div id="view3d-canvas"></div>
            <div id="view3d-gui"></div>
            <div id="view3d-info">
              <div>Spannungen in kN/cm²</div>
              <div id="v3d-minmax"></div>
            </div>
            <div id="view3d-hinweis">3D-Ansicht: bitte zuerst <i>Rechnen</i> drücken</div>
          </div>
        </sl-tab-panel>

        <!------------------------------------------------------------------------------------ Info -->
        <sl-tab-panel name="info">
          <h3>Querschnittswerte und Spannungen eines polygonal begrenzten Querschnitts</h3>
          <p>
            Berechnet Schwerpunkt, Fläche, Flächenmomente 2. Grades, Hauptträgheitsmomente und die
            Normalspannungen aus Längskraft N und Biegemomenten M<sub>y</sub>, M<sub>z</sub>.
          </p>
          <h4>Bedienung</h4>
          <ul>
            <li><b>Eingabe:</b> Punkte gegen den Uhrzeigersinn (in der Darstellung mit y&#772; nach links, z&#772; nach unten),
              Löcher über einen Schlitz, die Punkte des Lochrands im Uhrzeigersinn. Ist der ganze Umriss im
              Uhrzeigersinn eingegeben, wird die Reihenfolge automatisch umgekehrt. Mehrere Zellen mit der Maus
              oder dem Finger markieren, dann Kontextmenü (rechte Maustaste / langes Drücken) zum Kopieren,
              Hochzählen und für die Zwischenablage.</li>
            <li><b>Ergebnisse:</b> Querschnittswerte, Spannungen in den Eckpunkten und Grafik des Querschnitts.</li>
            <li><b>3D:</b> Spannungskörper. Maus: ziehen dreht, rechte Taste verschiebt, Rad zoomt,
              überfahren zeigt Werte. Finger: Button links unten schaltet um zwischen Verschieben und
              Werteanzeige, zwei Finger drehen und zoomen.</li>
            <li><b>Dateien:</b> Speichern als <i>.polyquer</i> (auf Android <i>.polyquer.json</i>), Einlesen über den
              Button oder durch Ablegen der Datei im Tab Eingabe (Drag &amp; Drop). Gefragt wird nur, wenn Änderungen
              noch nicht gespeichert sind.</li>
            <li>Die Eingabe wird im Browser gespeichert und beim nächsten Start wiederhergestellt.</li>
          </ul>
          <h4>Gerät</h4>
          <p id="infoBox"></p>
          <p class="footer">
            Version ${__APP_VERSION__} &middot; ${__BUILD_DATE__} <a href="https://statikverstehen.de">&#169; statikverstehen.de</a>
          </p>
        </sl-tab-panel>

        <!---------------------------------------------------------------------------- Einstellungen -->
        <sl-tab-panel name="einstellungen" id="id_panel_einstellungen">
          <h3>Einstellungen</h3>
          <table class="einstellungen">
            <tr>
              <td>Hintergrundfarbe Tabellen:</td>
              <td><sl-color-picker id="id_color_table_out" value="#cfd915" format="hex" hoist
                swatches="#cfd915;#b3ae00;#ffffff;#f5f5f5;#d8d8d8;#828282;#404040;#000000;#0284c7;#2e7d32;#c62828;#ef6c00" label="Hintergrundfarbe Tabellen"></sl-color-picker></td>
            </tr>
            <tr>
              <td>Textfarbe Tabellen:</td>
              <td><sl-color-picker id="id_color_table_text" value="#000000" format="hex" hoist
                swatches="#cfd915;#b3ae00;#ffffff;#f5f5f5;#d8d8d8;#828282;#404040;#000000;#0284c7;#2e7d32;#c62828;#ef6c00" label="Textfarbe Tabellen"
                title="Wird beim Ändern der Hintergrundfarbe automatisch hell oder dunkel gesetzt"></sl-color-picker></td>
            </tr>
            <tr>
              <td>Akzentfarbe:</td>
              <td>
                <div class="accent_row">
                  <sl-color-picker id="id_accent_color" value="#0284c7" format="hex" hoist
                    swatches="#cfd915;#b3ae00;#ffffff;#f5f5f5;#d8d8d8;#828282;#404040;#000000;#0284c7;#2e7d32;#c62828;#ef6c00" label="Akzentfarbe"
                    title="Farbe für den aktiven Tab und den Rechnen-Button, wenn neu gerechnet werden muss"></sl-color-picker>
                  <button type="button" id="id_accent_color_reset" title="Akzentfarbe auf das Standard-Blau zurücksetzen">Standard</button>
                </div>
              </td>
            </tr>
          </table>
          <p class="hinweis">Die Tabellenfarbe gilt auch für die Titelleiste des Bedienfelds in der 3D-Ansicht.</p>
          <p>
            <button type="button" id="id_cb_saveLocalStorage"
              title="Die gewählten Farben bleiben auch nach einem Neustart der App erhalten">Auswahl als Standardwerte im Browser speichern</button>
            <br /><span class="speichern_hinweis_text" id="id_speichern_hinweis" hidden>Es gibt Änderungen, die noch nicht gespeichert sind.</span>
          </p>
          <p>
            <button type="button" id="id_cb_deleteLocalStorage"
              title="Gespeicherte Farben löschen und die Standardfarben wiederherstellen">Standardwerte im Speicher des Browsers löschen</button>
          </p>
        </sl-tab-panel>
      </sl-tab-group>
    `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'dr-haupt': DrHaupt;
    }
}
