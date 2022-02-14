
class CQuer_polygon {


    constructor( width=0, height=0) {

        console.log('im Konstruktor Rechteck von CQuer_polygon');
        if ( width == 0 && height == 0 ) {
            this.neck = 4;

            this.y = new Float64Array(this.neck);
            this.y[0] = 0.0;
            this.y[1] = width;
            this.y[2] = width;
            this.y[3] = 0.0;
            this.z = new Float64Array(this.neck);
            this.z[0] = 0.0;
            this.z[1] = 0.0;
            this.z[2] = height;
            this.z[3] = height;
        }
        else if ( height == 0 && width != 0 ) {
            this.neck = width;
            console.log("neck",width);
        }
    }

    set_data(npkte,y,z) {

        this.neck = npkte;
        this.y = new Float64Array(this.neck);
        this.z = new Float64Array(this.neck);
        for (let i=0; i<npkte;i++) {
            this.y[i]=y[i];
            this.z[i]=z[i];
            console.log('this',this.y[i],this.z[i]);
        }
    }
    calc() {
        console.log('im calc von CQuer_polygon');
        this.x = 5;
     
        this.area = 0.0;
        this.Iy = 0.0;
        this.Iz = 0.0;
        this.sy = 0.0;
        this.sz = 0.0;
        this.ys = 0.0;
        this.zs = 0.0;
        this.Iyz = 0.0;

        let a1, a2, a3;
        let j = 1;
        for ( let i = 0; i < this.neck; i++ ) {
            a1 = this.y[i] * this.z[j] - this.z[i] * this.y[j];
            a2 = this.z[i] + this.z[j];
            a3 = this.y[i] + this.y[j];
    
            this.area = this.area + a1;
            this.sy = this.sy + a1 * a2;
            this.sz = this.sz + a1 * a3;
            this.Iy = this.Iy + a1 * (a2 * a2 - this.z[i] * this.z[j]);
            this.Iz = this.Iz + a1 * (a3 * a3 - this.y[i] * this.y[j]);
            this.Iyz = this.Iyz + a1 * (a3 * a2 - (this.y[i] * this.z[j] + this.y[j] * this.z[i]) * 0.5);
            j = j + 1;
            if ( j >= this.neck ) j = 0;
        }
    
        this.area = this.area * 0.5;
        this.sy = this.sy / 6;
        this.sz = this.sz / 6;
        this.zs = this.sy / this.area;
        this.ys = this.sz / this.area;
        this.Iy = this.Iy / 12;
        this.Iz = this.Iz / 12;
        this.Iy_s = this.Iy - this.zs * this.zs * this.area;
        this.Iz_s = this.Iz - this.ys * this.ys * this.area;
        this.Iyz = this.Iyz / 12;
        this.Iyz_s = this.Iyz - this.ys * this.zs * this.area;

        const temp = 0.5 * (this.Iy_s + this.Iz_s);
        const tempm = 0.5 * (this.Iy_s - this.Iz_s);

        this.Imax = temp + Math.sqrt(tempm * tempm + this.Iyz_s * this.Iyz_s);
        this.Imin = temp - Math.sqrt(tempm * tempm + this.Iyz_s * this.Iyz_s);


        if ( Math.abs(this.Iy_s - this.Iz_s) < 0.000000000001 && Math.abs(this.Iyz_s) < 0.000000000001 )
        {
            this.phi = 0.0;
        } else {
            this.phi = Math.atan2( -2 * this.Iyz_s, this.Iy_s - this.Iz_s) * 0.5;
        }

    }
}

export { CQuer_polygon };
