import {myScreen} from './state';

/** Transformation zwischen Weltkoordinaten (y, z in cm) und Pixeln der Grafik. */
export class CTrans {
    ymin: number;
    ymax: number;
    zmin: number;
    zmax: number;
    dy: number;
    dz: number;
    readonly width: number;
    readonly height: number;

    constructor(ymin: number, zmin: number, ymax: number, zmax: number) {
        this.ymin = ymin;
        this.ymax = ymax;
        this.zmin = zmin;
        this.zmax = zmax;

        let dy = this.ymax - this.ymin;
        let dz = this.zmax - this.zmin;

        // 10 % Rand
        this.ymin -= 0.1 * dy;
        this.ymax += 0.1 * dy;
        this.zmin -= 0.1 * dz;
        this.zmax += 0.1 * dz;

        this.dy = this.ymax - this.ymin;
        this.dz = this.zmax - this.zmin;

        this.height = myScreen.svgHeight - 1;
        this.width = myScreen.svgWidth - 1;

        // gleicher Maßstab in y- und z-Richtung
        dz = this.dy * this.height / this.width;
        dy = this.dz * this.width / this.height;

        if (dz >= this.dz) {
            const delta_dz = (dz - this.dz) / 2;
            this.zmin -= delta_dz;
            this.zmax += delta_dz;
            this.dz = this.zmax - this.zmin;
        } else if (dy >= this.dy) {
            const delta_dy = (dy - this.dy) / 2;
            this.ymin -= delta_dy;
            this.ymax += delta_dy;
            this.dy = this.ymax - this.ymin;
        }
    }

    yPix(y: number): number {
        return (this.ymax - y) * this.width / this.dy;
    }

    zPix(z: number): number {
        return (z - this.zmin) * this.height / this.dz;
    }

    yWorld(yPix: number): number {
        return this.ymax - yPix * this.dy / this.width;
    }

    zWorld(zPix: number): number {
        return zPix * this.dz / this.height + this.zmin;
    }
}
