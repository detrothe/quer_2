
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
        this.traegy = 0.0;
        this.traegz = 0.0;
        this.sy = 0.0;
        this.sz = 0.0;
        this.ys = 0.0;
        this.zs = 0.0;
        this.deviat = 0.0;

        let a1, a2, a3;
        let j = 1;
        for ( let i = 0; i < this.neck; i++ ) {
            a1 = this.y[i] * this.z[j] - this.z[i] * this.y[j];
            a2 = this.z[i] + this.z[j];
            a3 = this.y[i] + this.y[j];
    
            this.area = this.area + a1;
            this.sy = this.sy + a1 * a2;
            this.sz = this.sz + a1 * a3;
            this.traegy = this.traegy + a1 * (a2 * a2 - this.z[i] * this.z[j]);
            this.traegz = this.traegz + a1 * (a3 * a3 - this.y[i] * this.y[j]);
            this.deviat = this.deviat + a1 * (a3 * a2 - (this.y[i] * this.z[j] + this.y[j] * this.z[i]) * 0.5);
            j = j + 1;
            if ( j >= this.neck ) j = 0;
        }
    
        this.area = this.area * 0.5;
        this.sy = this.sy / 6;
        this.sz = this.sz / 6;
        this.zs = this.sy / this.area;
        this.ys = this.sz / this.area;
        this.traegy = this.traegy / 12;
        this.traegz = this.traegz / 12;
        this.traegys = this.traegy - this.zs * this.zs * this.area;
        this.traegzs = this.traegz - this.ys * this.ys * this.area;
        this.deviat = this.deviat / 12;
        this.Iyz_s = this.deviat - this.ys * this.zs * this.area;
    
    }
}

export { CQuer_polygon };
