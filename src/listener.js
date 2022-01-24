import {xs} from './index';
import {CQuer_polygon} from './calc/quer1.js';

const btn = document.querySelector('button');
btn.addEventListener('click', rechnen);

function rechnen() {
    //alert('rechnen');

    //const s = new Spreadsheet("#x-spreadsheet-demo");
    // const spreadsheet = x_spreadsheet(document.getElementById('x-spreadsheet-demo'));
    //console.log( document.getElementById('x-spreadsheet-demo') );
    //console.log(spreadsheet);

    //console.log(xs);
    //console.log('xs: ', xs.cell(1, 0).text);

    xs.cellText(6, 6, 'xxx').reRender();

    console.log("in test");
    console.log(document.documentElement.clientHeight);
    console.log(document.documentElement.clientWidth);
    console.log('client width: = ', document.getElementById("x-spreadsheet-demo").clientWidth);
    console.log('client height: = ', document.getElementById("x-spreadsheet-demo").clientHeight);

    const elem = document.getElementById("input_pkte");
    let xi, yi;
    if (elem) {
        const npkte = elem.value;
        console.log("npkte=", npkte);
        const x = new Float64Array(npkte);
        const y = new Float64Array(npkte);
        for (let i = 0; i < npkte; i++) {
            if (xs.cell(i + 1, 1) == null) {
                xi = 0.0;
            } else {
                xi = xs.cell(i + 1, 1).text;
            }
            if (xs.cell(i + 1, 2) == null) {
                yi = 0.0;
            } else {
                yi = xs.cell(i + 1, 2).text;
            }
            //console.log(xi, yi);
            x[i] = xi;
            y[i] = yi;
        }

        for (let i = 0; i < npkte; i++) {
            console.log(i, x[i], y[i]);
        }


        const quer = new CQuer_polygon(npkte);
        quer.set_data(npkte, x, y);
        quer.calc();

        console.log("area= "+quer.area);
        console.log("ys= "+quer.ys);
        console.log("zs= "+quer.zs);
        console.log("Iyys= "+quer.tragys);

        xs.cellText(3, 6, quer.ys.toFixed(2)+' m');
        xs.cellText(4, 6, quer.zs.toFixed(2));
        xs.cellText(5, 6, quer.area.toFixed(2));
        xs.cellText(6, 6, quer.traegys.toFixed(2));
        xs.cellText(7, 6, quer.traegzs.toFixed(2));
        xs.cellText(8, 6, quer.Iyz_s.toFixed(2));

        xs.cellText(3, 5,'ys = ');
        xs.cellText(4, 5, 'zs = ');
        xs.cellText(5, 5, 'Fläche = ');
        xs.cellText(6, 5, 'Iy_s = ');
        xs.cellText(7, 5, 'Iz_s = ');
        xs.cellText(8, 5, 'Iyz = ');

        xs.reRender();
    }

}

