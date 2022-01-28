import { spreadsheet } from './spreadsheet/index.js';
import  './listener.js';

export var xs; // the spreadsheet




function load() {
    const rows10 = {len: 20};
    for (let i = 0; i < 20; i += 1) {
        rows10[i] = {
            cells: {
                0: {text: 'A-' + i},
                1: {text: 'B-' + i},
                2: {text: 'C-' + i},
                3: {text: 'D-' + i},
                4: {text: 'E-' + i},
                5: {text: 'F-' + i},
            }
        };
    }

    const rows = {
        len: 20,
        1: {     // Zeile 1
            cells: {
                1: {text: '0'},
                2: {text: '0'},
            },
        },
        2: {     // Zeile 2
            cells: {
                1: {text: '400'},
                2: {text: '0'},
            },
        },
        3: {     // Zeile 3
            cells: {
                1: {text: '400'},
                2: {text: '500'},
            },
        },
        4: {     // Zeile 4
            cells: {
                1: {text: '0'},
                2: {text: '500'},
            },
        },
        0: {     // Zeile 0
            cells: {
                0: {text: 'Punkt', style: 0},
                1: {text: 'y [m]', style: 0},
                2: {text: 'z [m]', style: 0},
                3: {text: 'Spannung', style: 0},
            }
        }
    };
    //const s = new Spreadsheet("#x-spreadsheet-demo");
    // x_spreadsheet.locale('zh-cn');
    //      xs = x_spreadsheet('#x-spreadsheet-demo', { showBottomBar: false, showToolbar: false, showGrid: true })
    xs = x_spreadsheet(document.getElementById("x-spreadsheet-demo"), {
            //showBottomBar: false,
            showToolbar: true,
            showGrid: true,
            view: {
                height: () => document.getElementById("x-spreadsheet-demo").clientHeight,
                width: () => document.getElementById("x-spreadsheet-demo").clientWidth,
            },
            row: {
                len: 20,
                height: 25,
            },
            col: {
                len: 8,
                width: 100,
                indexWidth: 60,
                minWidth: 60,
            },
        }
    )
        .loadData([{

            /*
            freeze: 'B3', */
            styles: [
                {
                    bgcolor: '#f4f5f8',
                    textwrap: true,
                    color: '#900b09',

                    border: {
                        top: ['thin', '#0366d6'],
                        bottom: ['thin', '#0366d6'],
                        right: ['thin', '#0366d6'],
                        left: ['thin', '#0366d6'],
                    },

                },
            ],
            //   merges: [
            //     'C3:D4',
            //   ],
            /*
                      cols: {
                        len: 5,
                        // 0: {  },
                      },
            */
            rows,

        } /*, { name: 'sheet-test', rows: rows10 } , { name: 'Tab2'}*/])    // end loadData
        .change((cdata) => {
            // console.log(cdata);
            console.log('>>>', xs.getData());
        });

    xs.on('cell-selected', (cell, ri, ci) => {
        console.log('cell:', cell, ', ri:', ri, ', ci:', ci);
    }).on('cell-edited', (text, ri, ci) => {
        console.log('text:', text, ', ri: ', ri, ', ci:', ci);
    });

    for (let i = 1; i < 20; i++) {
        xs.cellText(i, 0, i);
    }
    xs.reRender();

    /*
          setTimeout(() => {
            // xs.loadData([{ rows }]);
            xs.cellText(14, 3, 'cell-text').reRender();
            console.log('cell(8, 8):', xs.cell(8, 8));
            console.log('cellStyle(8, 8):', xs.cellStyle(8, 8));
          }, 5000);  */
}

//--------------------------------------------------------------------------------------------------------------

load();

// Matrix mit 4 Zeilen und 2 Spalten
const arr = Array.from(Array(4), () => new Array(2));
arr[0][0] ='11';arr[0][1] ='12';
arr[1][0] ='21';arr[1][1] ='22';
arr[2][0] ='31';arr[2][1] ='32';
arr[3][0] ='41';arr[3][1] ='42';
console.info(arr);