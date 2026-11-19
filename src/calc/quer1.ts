/**
 * Querschnittswerte eines polygonal begrenzten Querschnitts.
 * Die Eckpunkte (y, z) werden in Umlaufrichtung erwartet.
 */
export class CQuer_polygon {
    readonly neck: number;
    readonly y: Float64Array;
    readonly z: Float64Array;

    area = 0;
    sy = 0;
    sz = 0;
    ys = 0;
    zs = 0;
    Iy = 0;
    Iz = 0;
    Iyz = 0;
    Iy_s = 0;
    Iz_s = 0;
    Iyz_s = 0;
    Imax = 0;
    Imin = 0;
    phi = 0;

    constructor(y: ArrayLike<number>, z: ArrayLike<number>) {
        this.neck = y.length;
        this.y = Float64Array.from(y);
        this.z = Float64Array.from(z);
    }

    calc(): void {
        const {y, z, neck} = this;

        let area = 0, sy = 0, sz = 0, Iy = 0, Iz = 0, Iyz = 0;
        let j = 1;
        for (let i = 0; i < neck; i++) {
            const a1 = y[i] * z[j] - z[i] * y[j];
            const a2 = z[i] + z[j];
            const a3 = y[i] + y[j];

            area += a1;
            sy += a1 * a2;
            sz += a1 * a3;
            Iy += a1 * (a2 * a2 - z[i] * z[j]);
            Iz += a1 * (a3 * a3 - y[i] * y[j]);
            Iyz += a1 * (a3 * a2 - (y[i] * z[j] + y[j] * z[i]) * 0.5);
            j = j + 1;
            if (j >= neck) j = 0;
        }

        this.area = area * 0.5;
        this.sy = sy / 6;
        this.sz = sz / 6;
        this.zs = this.sy / this.area;
        this.ys = this.sz / this.area;
        this.Iy = Iy / 12;
        this.Iz = Iz / 12;
        this.Iy_s = this.Iy - this.zs * this.zs * this.area;
        this.Iz_s = this.Iz - this.ys * this.ys * this.area;
        this.Iyz = Iyz / 12;
        this.Iyz_s = this.Iyz - this.ys * this.zs * this.area;

        const temp = 0.5 * (this.Iy_s + this.Iz_s);
        const tempm = 0.5 * (this.Iy_s - this.Iz_s);
        const wurzel = Math.sqrt(tempm * tempm + this.Iyz_s * this.Iyz_s);

        this.Imax = temp + wurzel;
        this.Imin = temp - wurzel;

        if (Math.abs(this.Iy_s - this.Iz_s) < 1e-12 && Math.abs(this.Iyz_s) < 1e-12) {
            this.phi = 0.0;
        } else {
            this.phi = Math.atan2(-2 * this.Iyz_s, this.Iy_s - this.Iz_s) * 0.5;
        }
    }
}
