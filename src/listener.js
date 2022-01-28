import {xs} from './index';
import {CQuer_polygon} from './calc/quer1.js';
import * as d3 from "d3";

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

    let i, j, zahl;
    for (i = 1; i <= 2; i++) {
        for (j = 1; j <= 2; j++) {
            zahl = document.getElementById("coord_table").rows[i].cells[j].innerText;
            console.log('n ', zahl);
        }

    }

    /*
    let table = document.getElementById("coord_table");
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

    console.log('2,2 =', document.getElementById("coord_table").rows[2].cells[2].innerText);

    xs.cellText(6, 6, 'xxx').reRender();

    console.log("in test");
    console.log(document.documentElement.clientHeight);
    console.log(document.documentElement.clientWidth);
    console.log('client width: = ', document.getElementById("x-spreadsheet-demo").clientWidth);
    console.log('client height: = ', document.getElementById("x-spreadsheet-demo").clientHeight);

    const elem = document.getElementById("input_pkte");
    let xi, yi;
    let str="";

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

        console.log("area= " + quer.area);
        console.log("ys= " + quer.ys);
        console.log("zs= " + quer.zs);
        console.log("Iyys= " + quer.traegys);

        xs.cellText(3, 6, quer.ys.toFixed(2) + ' m');
        xs.cellText(4, 6, quer.zs.toFixed(2));
        xs.cellText(5, 6, quer.area.toFixed(2));
        xs.cellText(6, 6, quer.traegys.toFixed(2));
        xs.cellText(7, 6, quer.traegzs.toFixed(2));
        xs.cellText(8, 6, quer.Iyz_s.toFixed(2));

        xs.cellText(3, 5, 'ys = ');
        xs.cellText(4, 5, 'zs = ');
        xs.cellText(5, 5, 'Fläche = ');
        xs.cellText(6, 5, 'Iy_s = ');
        xs.cellText(7, 5, 'Iz_s = ');
        xs.cellText(8, 5, 'Iyz = ');

        xs.reRender();


        for (i = 0; i < npkte; i++) {
            str += x[i] + ',' + y[i] + ' ';
        }

    }


// jetzt die Graphik
    const canvas = document.getElementById("my-canvas");
    const ctx = canvas.getContext("2d");
    let ox = canvas.width / 2;
    let oy = canvas.height / 2;
//ctx.font = "20pt Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#FFF";
// ctx.scale(1,0.3);
    ctx.fillText("Hello World", ox, oy);

//ctx.draw  .drawRegularPolygon(5,25,150,50,6,'gray','gold',0);

    const svg = d3.select("#dataviz_area")
    svg.append("circle")
        .attr("cx", 2).attr("cy", 2).attr("r", 40).style("fill", "blue");
    svg.append("circle")
        .attr("cx", 140).attr("cy", 70).attr("r", 40).style("fill", "red");
    svg.append("circle")
        .attr("cx", 900).attr("cy", 900).attr("r", 40).style("fill", "green");

    svg.append("line")
        .attr("x1", 0)
        .attr("x2", 1000)
        .attr("y1", 0)
        .attr("y2", 1000)
        .attr("stroke", "black")
        .attr("stroke-width", 4);

    let yy = 700;
    svg.append("text").attr("x", 200).attr("y", yy).text("Hallo Welt").style("font-size", 20);

    console.log('str= ', str);

    svg.append('polygon')
        .attr('points', str)
        .attr('stroke', "green")
        .attr('fill', "red")


}