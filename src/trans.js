class CTrans {
    constructor(ymin, ymax, zmin, zmax) {
        this.ymin = ymin;
        this.ymax = ymax;
        this.zmin = zmin;
        this.zmax = zmax;
        this.dy = this.ymax - this.ymin;
        this.dz = this.zmax - this.zmin;
    }
}