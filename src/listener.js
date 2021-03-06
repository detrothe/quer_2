import {app, selectedCellPoly, MOUSEMOVE, MOUSEDOWN, KEYDOWN} from './index';
import {CQuer_polygon} from './calc/quer1.js';
import {CTrans} from './trans.js';
//import "d3";
import * as d3 from "d3";
import {myScreen} from "./index";

//------------------------------------------------------------------------------------------------

const btn1 = document.getElementById("rechnen");                  //querySelector('button');
btn1.addEventListener('click', rechnen);

const btn2 = document.getElementById("resize");
btn2.addEventListener('click', resize_polyTabelle);

const btn3 = document.getElementById("clearTable");
btn3.addEventListener('click', clear_polyTabelle);

//------------------------------------------------------------------------------------------------

//------------------------------------------------------------------------------------------------


function testNumber(wert, zeile, spalte) {
    wert = wert.replace(/,/g, '.');
    //console.log('Komma entfernt',wert);
    if (isNaN(wert)) {
        //window.alert("Das ist keine Zahl ");

        //const objCells = document.getElementById("polygonTable").rows.item(zeile).cells;
        //objCells.item(spalte).style.backgroundColor = "darkred";
        //objCells.item(spalte).style.color = "white";
        document.getElementById("polygonTable").rows.item(zeile).cells.item(spalte).classList.add("selected");

        return 0;
    }
    return wert;
}

//------------------------------------------------------------------------------------------------

function clear_polyTabelle() {
    const tabelle = document.getElementById("polygonTable");
    for (let i = 1; i < tabelle.rows.length; i++) {
        tabelle.rows[i].cells[1].innerText = "";
        tabelle.rows[i].cells[2].innerText = "";
    }
}

//------------------------------------------------------------------------------------------------


export function resize_polyTabelle() {
    console.info("in init");
    const elem = document.getElementById("input_pkte");
    if (elem) {
        const npkte = elem.value;
        app.npkte = npkte;
        const table = document.getElementById("polygonTable");
        let nzeilen = table.rows.length - 1;  // header abziehen

        if (nzeilen > npkte) {
            for (let i = 1; i <= nzeilen - npkte; i++) {
                table.deleteRow(-1);
                //console.log("selRow",selectedCellPoly.selRow);
                selectedCellPoly.selColY.length -= 1;
                selectedCellPoly.selColZ.length -= 1;
            }
        }
        if (npkte > nzeilen) {

            for (let i = nzeilen + 1; i <= npkte; i++) {
                selectedCellPoly.selColY.push(false);
                selectedCellPoly.selColZ.push(false);
                //console.log("selRow",selectedCellPoly.selRow);

                // Insert a row at the end of the table
                let newRow = table.insertRow(-1);

                for (let j = 0; j <= 3; j++) {
                    // Insert a cell in the row at index 0
                    let newCell = newRow.insertCell(j);

                    // Append a text node to the cell
                    let newText;
                    if (j === 0) {
                        newText = document.createTextNode(String(i));
                    } else {
                        newText = document.createTextNode("");
                    }
                    newCell.appendChild(newText);
                    newCell.style.border = 'solid 1px';
                    newCell.style.padding = '5px';
                    if (j === 0) {
                        newCell.style.textAlign = "center";
                    } else if (j < 3) {
                        //newCell.style.backgroundColor = "#FFFFFF";
                        newCell.contentEditable = 'true';
                        newCell.addEventListener("mousemove", MOUSEMOVE);
                        newCell.addEventListener("mousedown", MOUSEDOWN);
                        newCell.addEventListener("keydown", KEYDOWN);
                        newCell.id = "pt-" + i + "-" + j;
                        //newCell.innerText ="pt-" + i + "-" + j;
                        newCell.wrap = false;
                    }
                }
            }

            const inputContainer = document.getElementById("input-container");
            const polyCanvas = document.getElementById("polyCanvas");
            const zelle = document.getElementById("pt-1-1");
            console.log("scroll",inputContainer.scrollTop,inputContainer.scrollHeight,polyCanvas.style.top,polyCanvas.clientTop);

            inputContainer.scrollTop = inputContainer.scrollHeight; // - inputContainer.clientHeight;
            //const scrollingElement = (document.scrollingElement || document.body);
            //scrollingElement.scrollTop = scrollingElement.scrollHeight;
            //polyCanvas.style.top = (polyCanvas.clientTop - (inputContainer.scrollHeight + 950) ) + 'px';
            polyCanvas.style.top = zelle.getBoundingClientRect().top + window.scrollY + "px";   // scrollY

        }
    }
}

//------------------------------------------------------------------------------------------------

function rechnen() {
    //alert('rechnen');

    //const s = new Spreadsheet("#x-spreadsheet-demo");
    // const spreadsheet = x_spreadsheet(document.getElementById('x-spreadsheet-demo'));
    //console.log( document.getElementById('x-spreadsheet-demo') );
    //console.log(spreadsheet);

    //console.log(xs);
    //console.log('xs: ', xs.cell(1, 0).text);
    /*
        let i, j, zahl;
        for (i = 1; i <= 2; i++) {
            for (j = 1; j <= 2; j++) {
                zahl = document.getElementById("coord_table").rows[i].cells[j].innerText;
                console.log('n ', zahl);
            }
    
        }
    */
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

    //console.log('2,2 =', document.getElementById("coord_table").rows[2].cells[2].innerText);

    //xs.cellText(6, 6, 'xxx').reRender();

    //console.log("in test");

    if (document.documentElement.clientWidth > 1500) {
        myScreen.svgWidth = document.documentElement.clientWidth - 900;
        document.getElementById("my-svg").style.width = myScreen.svgWidth + 'px';
    } else {
        myScreen.svgWidth = 700;
    }

    $("#polygonTable td").removeClass("selected");

    //const polyBox = document.getElementById("polygonTable");
    const svgBox = document.getElementById("my-svg");

    console.log(document.documentElement.clientHeight);
    console.log(document.documentElement.clientWidth);
    //console.log('client width: = ', document.getElementById("x-spreadsheet-demo").clientWidth);
    //console.log('client height: = ', document.getElementById("x-spreadsheet-demo").clientHeight);

    const elem = document.getElementById("input_pkte");
    //let yi, zi;
    let str = "";

    if (elem) {
        const npkte = elem.value;
        console.log("npkte=", npkte);
        let ymin = 1.e30, zmin = 1.e30, ymax = -1.e30, zmax = -1.e30;
        let slmax;

        const y = new Float64Array(npkte);
        const z = new Float64Array(npkte);
        /*
                for (let i = 0; i < npkte; i++) {
                    if (xs.cell(i + 1, 1) == null) {
                        yi = 0.0;
                    } else {
                        yi = xs.cell(i + 1, 1).text;
                    }
                    if (xs.cell(i + 1, 2) == null) {
                        zi = 0.0;
                    } else {
                        zi = xs.cell(i + 1, 2).text;
                    }
                    //console.log(yi, zi);
                    y[i] = yi;
                    z[i] = zi;
        
                    if (yi < ymin) ymin = yi;
                    if (zi < zmin) zmin = zi;
                    if (yi > ymax) ymax = yi;
                    if (zi > zmax) zmax = zi;
                }
        */
        let table = document.getElementById("polygonTable");
        for (let tableRow in table.rows) {
            let row = table.rows[tableRow]
            let i = Number(tableRow);
            //console.log('i=', i, '| ', row);
            //iterate through rows
            //rows would be accessed using the "row" variable assigned in the for loop
            for (let tableCell in row.cells) {
                let col = row.cells[tableCell]
                let j = Number(tableCell);
                //console.log('i=',i,' j=',j,' inner| ',col.innerHTML);

                if (i > 0) {
                    if (j == 1) {
                        table.rows.item(i).cells.item(j).classList.remove("highlight"); //      .style.backgroundColor = "white";
                        //table.rows.item(i).cells.item(j).style.color = "black";
                        y[i - 1] = testNumber(col.innerText, i, j);
                    }
                    if (j == 2) {
                        table.rows.item(i).cells.item(j).classList.remove("highlight");
                        //table.rows.item(i).cells.item(j).style.color = "black";
                        z[i - 1] = testNumber(col.innerText, i, j);
                    }
                }
                //iterate through columns
                //columns would be accessed using the "col" variable assigned in the for loop
            }
        }

        for (let i = 0; i < npkte; i++) {
            console.log(i, y[i], z[i]);
            if (y[i] < ymin) ymin = y[i];
            if (z[i] < zmin) zmin = z[i];
            if (y[i] > ymax) ymax = y[i];
            if (z[i] > zmax) zmax = z[i];
        }

        //slmax = Math.sqrt((ymax - ymin) ** 2 + (zmax - zmin) ** 2);


        const quer = new CQuer_polygon(npkte);
        quer.set_data(npkte, y, z);
        quer.calc();

        console.log("area= " + quer.area);
        console.log("ys= " + quer.ys);
        console.log("zs= " + quer.zs);
        console.log("Iyys= " + quer.Iy_s);

        const Normalkraft = document.getElementById("N_kraft").value.replace(/,/g, '.');
        const My = 100.0 * document.getElementById("My").value.replace(/,/g, '.');   // in kNcm
        const Mz = 100.0 * document.getElementById("Mz").value.replace(/,/g, '.');   // in kNcm

        const nenner = quer.Iy_s * quer.Iz_s - quer.Iyz_s * quer.Iyz_s;
        let yi, zi, sigma;
        for (let i = 0; i < npkte; i++) {
            yi = y[i] - quer.ys;
            zi = z[i] - quer.zs;
            sigma = Normalkraft / quer.area + ((quer.Iz_s * zi - quer.Iyz_s * yi) * My - (quer.Iy_s * yi - quer.Iyz_s * zi) * Mz) / nenner;
            //console.log("sigma", yi, zi, sigma);
            table.rows[i + 1].cells[3].innerText = sigma.toFixed(3);
        }
        /*
                const vector = [];
                vector.push(quer);
                console.log("vector", vector[0].area);

                        xs.cellText(3, 6, quer.ys.toFixed(2) + ' m');
                        xs.cellText(4, 6, quer.zs.toFixed(2));
                        xs.cellText(5, 6, quer.area.toFixed(2));
                        xs.cellText(6, 6, quer.Iy_s.toFixed(2));
                        xs.cellText(7, 6, quer.Iz_s.toFixed(2));
                        xs.cellText(8, 6, quer.Iyz_s.toFixed(2));
                        xs.cellText(9, 6, quer.Imax.toFixed(2));
                        xs.cellText(10, 6, quer.Imin.toFixed(2));
                        xs.cellText(11, 6, (quer.phi * 180.0 / Math.PI).toFixed(2) + "??");

                        xs.cellText(3, 5, 'ys = ');
                        xs.cellText(4, 5, 'zs = ');
                        xs.cellText(5, 5, 'Fl??che = ');
                        xs.cellText(6, 5, 'Iy_s = ');
                        xs.cellText(7, 5, 'Iz_s = ');
                        xs.cellText(8, 5, 'Iyz_s = ');
                        xs.cellText(9, 5, 'I11 = ');
                        xs.cellText(10, 5, 'I22 = ');
                        xs.cellText(11, 5, 'phi_h = ');

                        xs.reRender();
*/
        const tr = new CTrans(ymin, zmin, ymax, zmax);

        for (let i = 0; i < npkte; i++) {
            //str += y[i] + ',' + z[i] + ' ';
            str += Math.round(tr.yPix(y[i])) + ',' + Math.round(tr.zPix(z[i])) + ' ';
        }


        const sl = Math.min(ymax - ymin, zmax - zmin) / 3;

        let si = Math.sin(quer.phi) * sl;
        let co = Math.cos(quer.phi) * sl;
        const hauptachse1y = Math.round(tr.yPix(quer.ys - co));
        const hauptachse1z = Math.round(tr.zPix(quer.zs - si));
        const hauptachse2y = Math.round(tr.yPix(quer.ys + co));
        const hauptachse2z = Math.round(tr.zPix(quer.zs + si));

        si = Math.sin(quer.phi + Math.PI / 2) * sl;
        co = Math.cos(quer.phi + Math.PI / 2) * sl;
        const hauptachse3y = Math.round(tr.yPix(quer.ys - co));
        const hauptachse3z = Math.round(tr.zPix(quer.zs - si));
        const hauptachse4y = Math.round(tr.yPix(quer.ys + co));
        const hauptachse4z = Math.round(tr.zPix(quer.zs + si));

        document.getElementById("ys").innerText = quer.ys.toFixed(2);
        document.getElementById("zs").innerText = quer.zs.toFixed(2);
        document.getElementById("area").innerText = quer.area.toFixed(2);
        document.getElementById("Iys").innerText = quer.Iy_s.toFixed(2);
        document.getElementById("Izs").innerText = quer.Iz_s.toFixed(2);
        document.getElementById("Iyzs").innerText = quer.Iyz_s.toFixed(2);
        document.getElementById("I11").innerText = quer.Imax.toFixed(2);
        document.getElementById("I22").innerText = quer.Imin.toFixed(2);
        document.getElementById("phi_h").innerText = (quer.phi * 180.0 / Math.PI).toFixed(2);
        /*
        // jetzt die Grafik
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
        */

        document.getElementById("dataviz_area").setAttribute("width", myScreen.svgWidth + "px");

        const svg = d3.select("#dataviz_area")

            .on("mousemove", function (event) {
                const vec = d3.pointer(event);
                const coordy = document.getElementById("cursor_coordy");
                const coordz = document.getElementById("cursor_coordz");
                //let yp = Number(vec[0]) + 10 + svgBox.getBoundingClientRect().left;
                //let zp = Number(vec[1]) - 20 + svgBox.getBoundingClientRect().top;
                const yp = event.pageX + 10;
                const zp = event.pageY - 20;
                const y = (tr.yWorld(vec[0])).toFixed(1);
                const z = (tr.zWorld(vec[1])).toFixed(1);
                //console.log("mouse move1", y );
                coordy.innerHTML = "y&#772;:" + y;
                coordz.innerHTML = "z&#772;:" + z;
                //console.log("vec", vec, vec[0], vec[1], yp, zp, event.pageX, event.pageY,"|",svgBox.getBoundingClientRect().left);
                //return tooltip.style("top", zp + "px").style("left", yp + "px");
            });


        svg.selectAll("circle").remove(); // Kreise entfernen aus fr??heren Berechnungen damit Tooltip funktioniert
        svg.selectAll("line").remove();
        svg.selectAll("polygon").remove();
        svg.selectAll("text").remove();

        svg.append('polygon')
            .attr('points', str)
            .attr('stroke', "dimgrey")
            .attr('fill', "lightgrey");

        let ys = Math.round(tr.yPix(quer.ys));
        let zs = Math.round(tr.zPix(quer.zs));

        console.log("ys,zs", ys, zs);
        console.log("sl", sl, Math.round(tr.yPix(sl / 2)));

        svg.append("line")   // Koordinatenkreuz im Ursprung, y-Richtung
            .attr("x1", Math.round(tr.yPix(0.0)))
            .attr("x2", Math.round(tr.yPix(sl / 2)))
            .attr("y1", Math.round(tr.zPix(0.0)))
            .attr("y2", Math.round(tr.zPix(0.0)))
            .attr("stroke", "darkslategrey")
            .attr("stroke-width", 2)
            .attr("marker-end", "url(#arrow_darkslategrey)");

        svg.append("text").attr("x", Number(Math.round(tr.yPix(sl / 2))) + 5).attr("y", Number(Math.round(tr.zPix(0.0))) - 7).html("y&#772;").style("font-size", 15).style("fill", 'darkslategrey');

        svg.append("line")   // Koordinatenkreuz im Ursprung, z-Richtung
            .attr("x1", Math.round(tr.yPix(0.0)))
            .attr("x2", Math.round(tr.yPix(0.0)))
            .attr("y1", Math.round(tr.zPix(0.0)))
            .attr("y2", Math.round(tr.zPix(sl / 2)))
            .attr("stroke", "darkslategrey")
            .attr("stroke-width", 2)
            .attr("marker-end", "url(#arrow_darkslategrey)");

        svg.append("text").attr("x", Number(Math.round(tr.yPix(0.0))) + 5).attr("y", Number(Math.round(tr.zPix(sl / 2))) - 6).html("z&#772;").style("font-size", 15).style("fill", 'darkslategrey');

        // y-z Koordinatensystem

        svg.append("line")
            .attr("x1", ys)
            .attr("x2", Math.round(tr.yPix(quer.ys+sl/2)))
            .attr("y1", zs)
            .attr("y2", zs)
            .attr("stroke", "blue")
            .attr("stroke-width", 1.5)
            .attr("marker-end", "url(#arrow_blue)");

        svg.append("text").attr("x", Number(Math.round(tr.yPix(quer.ys+sl/2))) + 5).attr("y", zs - 5).text("y").style("font-size", 15).style("fill", 'blue');

        svg.append("line")
            .attr("x1", ys)
            .attr("x2", ys)
            .attr("y1", zs)
            .attr("y2", Math.round(tr.zPix(quer.zs+sl/2)))
            .attr("stroke", "blue")
            .attr("stroke-width", 1.5)
            .attr("marker-end", "url(#arrow_blue)");

        svg.append("text").attr("x", ys + 5).attr("y", Number(Math.round(tr.zPix(quer.zs+sl/2))) - 5).text("z").style("font-size", 15).style("fill", 'blue');

        // Hauptachsenkoordinatensystem

        svg.append("line")
            .attr("x1", hauptachse1y)
            .attr("x2", hauptachse2y)
            .attr("y1", hauptachse1z)
            .attr("y2", hauptachse2z)
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("marker-end", "url(#arrow)");

        svg.append("text").attr("x", Number(hauptachse2y) + 5).attr("y", Number(hauptachse2z) - 5).text(" 1").style("font-size", 15);

        svg.append("line")
            .attr("x1", hauptachse3y)
            .attr("x2", hauptachse4y)
            .attr("y1", hauptachse3z)
            .attr("y2", hauptachse4z)
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("marker-end", "url(#arrow)");

        svg.append("text").attr("x", Number(hauptachse4y) + 5).attr("y", Number(hauptachse4z) - 5).text(" 2").style("font-size", 15);

        svg.append("circle")       // Schwerpunkt
            .attr("cx", ys).attr("cy", zs).attr("r", 5).style("fill", "blue")
            .attr("id", "circleBasicTooltip")
        /*
        .on("mouseover", function (event) {
            d3.select(this)
                .style("fill", "orange");
 
            tooltip.style("top", "100px").style("left", "1400px");
 
            // Get current event info
            const vec = d3.pointer(event);
            console.log("event pointer",vec);                   // Koordinaten in der svg Box ( dataviz_area )
            console.log("event pure",event.pageX,event.pageY);  // globale Koordinaten im Browser
            //console.log("this ",this.eventMap);
            console.log("mouseover", quer.ys, quer.zs);
 
            // Get x & y co-ordinates
            //console.log(d3.mouse(this));
        })
        .on("mouseout", function () {
            d3.select(this)
                .style("fill", "steelblue")
        });
*/
        // Hauptachsen


        // create a tooltip
        const tooltip = d3.select("#my-svg")    // #my_dataviz   my-svg
            .append("div")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("z-index", "10")
            .style("width", 20)
            .text("Schwerpunkt");

        console.log("tooltip", tooltip);

        d3.select("#circleBasicTooltip")
            .on("mouseover", function () {
                //console.log("in mouseover");
                d3.select(this)
                    .style("fill", "orange");
                //tooltip.text("test");
                //console.log("tooltip",tooltip.value);
                return tooltip.style("visibility", "visible");
            })
            .on("mousemove", function (event) {
                const vec = d3.pointer(event);
                const svgBox = document.getElementById("my-svg");
                //let yp = Number(vec[0]) + 10 + svgBox.getBoundingClientRect().left;
                //let zp = Number(vec[1]) - 20 + svgBox.getBoundingClientRect().top;
                const yp = event.pageX + 10;
                const zp = event.pageY - 20;
                //console.log("vec", vec, vec[0], vec[1], yp, zp, event.pageX, event.pageY,"|",svgBox.getBoundingClientRect().left);
                return tooltip.style("top", zp + "px").style("left", yp + "px");
            })
            .on("mouseout", function () {
                d3.select(this)
                    .style("fill", "blue");
                return tooltip.style("visibility", "hidden");
            });

        //svg.selectAll("circle").remove(); // alles entfernen aus fr??heren Berechnungen

    }

    /*
        console.log("polyBox.clientHeight", polyBox.clientHeight);
        console.log("polyBox.style.top", polyBox.getBoundingClientRect().top + window.pageYOffset);

        console.log("top" + document.getElementById("my-svg").style.top);

        const newTop = polyBox.getBoundingClientRect().top + window.pageYOffset + polyBox.clientHeight;
        svgBox.style.top = newTop + "px";
    */
}