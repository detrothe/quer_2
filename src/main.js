
import { CQuer_polygon } from './calc/quer1.js';

function main() {
    // Get a reference to the container element

    const quer = new CQuer_polygon( 4.0, 2.0 );
    console.log(quer);
    quer.calc();
    console.log("area= "+quer.area);
    console.log("ys= "+quer.ys);
    console.log("zs= "+quer.zs);
    console.log("Iyys= "+quer.tragys);

    console.log('ende main');
  }

  main();