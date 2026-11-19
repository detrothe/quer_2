import {app, selectedCellPoly, MOUSEMOVE, MOUSEDOWN, KEYDOWN} from './index';
import {CQuer_polygon} from './calc/quer1.js';
import {CTrans} from './trans.js';
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
    if (isNaN(wert)) {

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
                selectedCellPoly.selColY.length -= 1;
                selectedCellPoly.selColZ.length -= 1;
            }
        }
        if (npkte > nzeilen) {

            for (let i = nzeilen + 1; i <= npkte; i++) {
                selectedCellPoly.selColY.push(false);
                selectedCellPoly.selColZ.push(false);

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
                        newCell.contentEditable = 'true';
                        newCell.addEventListener("mousemove", MOUSEMOVE);
                        newCell.addEventListener("mousedown", MOUSEDOWN);
                        newCell.addEventListener("keydown", KEYDOWN);
                        newCell.id = "pt-" + i + "-" + j;
                        newCell.wrap = false;
                    }
                }
            }

            const inputContainer = document.getElementById("input-container");
            const polyCanvas = document.getElementById("polyCanvas");
            const zelle = document.getElementById("pt-1-1");
            console.log("scroll",inputContainer.scrollTop,inputContainer.scrollHeight,polyCanvas.style.top,polyCanvas.clientTop);

            inputContainer.scrollTop = inputContainer.scrollHeight; // - inputContainer.clientHeight;
            polyCanvas.style.top = zelle.getBoundingClientRect().top + window.scrollY + "px";   // scrollY

        }
    }
}

//------------------------------------------------------------------------------------------------

function rechnen() {

    if (document.documentElement.clientWidth > 1500) {
        myScreen.svgWidth = document.documentElement.clientWidth - 900;
        document.getElementById("my-svg").style.width = myScreen.svgWidth + 'px';
    } else {
        myScreen.svgWidth = 700;
    }

    document.querySelectorAll("#polygonTable td").forEach(td => td.classList.remove("selected"));

    const svgBox = document.getElementById("my-svg");

    console.log(document.documentElement.clientHeight);
    console.log(document.documentElement.clientWidth);

    const elem = document.getElementById("input_pkte");
    let str = "";

    if (elem) {
        const npkte = elem.value;
        console.log("npkte=", npkte);
        let ymin = 1.e30, zmin = 1.e30, ymax = -1.e30, zmax = -1.e30;
        let slmax;

        const y = new Float64Array(npkte);
        const z = new Float64Array(npkte);
        let table = document.getElementById("polygonTable");
        for (let tableRow in table.rows) {
            let row = table.rows[tableRow]
            let i = Number(tableRow);
            //iterate through rows
            //rows would be accessed using the "row" variable assigned in the for loop
            for (let tableCell in row.cells) {
                let col = row.cells[tableCell]
                let j = Number(tableCell);

                if (i > 0) {
                    if (j == 1) {
                        table.rows.item(i).cells.item(j).classList.remove("highlight"); //      .style.backgroundColor = "white";
                        y[i - 1] = testNumber(col.innerText, i, j);
                    }
                    if (j == 2) {
                        table.rows.item(i).cells.item(j).classList.remove("highlight");
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
            table.rows[i + 1].cells[3].innerText = sigma.toFixed(3);
        }
        const tr = new CTrans(ymin, zmin, ymax, zmax);

        for (let i = 0; i < npkte; i++) {
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

        document.getElementById("dataviz_area").setAttribute("width", myScreen.svgWidth + "px");

        const svg = d3.select("#dataviz_area")

            .on("mousemove", function (event) {
                const vec = d3.pointer(event);
                const coordy = document.getElementById("cursor_coordy");
                const coordz = document.getElementById("cursor_coordz");
                const yp = event.pageX + 10;
                const zp = event.pageY - 20;
                const y = (tr.yWorld(vec[0])).toFixed(1);
                const z = (tr.zWorld(vec[1])).toFixed(1);
                coordy.innerHTML = "y&#772;:" + y;
                coordz.innerHTML = "z&#772;:" + z;
            });

        svg.selectAll("circle").remove(); // Kreise entfernen aus früheren Berechnungen damit Tooltip funktioniert
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
                d3.select(this)
                    .style("fill", "orange");
                return tooltip.style("visibility", "visible");
            })
            .on("mousemove", function (event) {
                const vec = d3.pointer(event);
                const svgBox = document.getElementById("my-svg");
                const yp = event.pageX + 10;
                const zp = event.pageY - 20;
                return tooltip.style("top", zp + "px").style("left", yp + "px");
            })
            .on("mouseout", function () {
                d3.select(this)
                    .style("fill", "blue");
                return tooltip.style("visibility", "hidden");
            });

    }

}