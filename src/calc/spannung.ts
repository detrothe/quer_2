import {CQuer_polygon} from './quer1';

/** Schnittgrößen: N in kN, My und Mz in kNcm. */
export interface Schnittgroessen {
    N: number;
    My: number;
    Mz: number;
}

/** σ(y, z) in kN/cm² an einer beliebigen Stelle (y, z in cm, Eingabekoordinaten). */
export type SigmaFunktion = (y: number, z: number) => number;

/**
 * Normalspannung bei schiefer Biegung mit Längskraft,
 * bezogen auf den Schwerpunkt (nicht auf die Hauptachsen).
 */
export function sigmaFunktion(quer: CQuer_polygon, s: Schnittgroessen): SigmaFunktion {
    const {area, ys, zs, Iy_s, Iz_s, Iyz_s} = quer;
    const nenner = Iy_s * Iz_s - Iyz_s * Iyz_s;
    return (y, z) => {
        const yi = y - ys;
        const zi = z - zs;
        return s.N / area + ((Iz_s * zi - Iyz_s * yi) * s.My - (Iy_s * yi - Iyz_s * zi) * s.Mz) / nenner;
    };
}
