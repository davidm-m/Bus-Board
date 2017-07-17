import { Bus } from './bus';

export class Stop {
    private id: string;
    private commonName: string;
    private nextBuses: Bus[];
    private distance: number;

    constructor (id: string,commonName: string,nextBuses: Bus[],distance:number) {
        this.id = id;
        this.commonName = commonName;
        this.nextBuses = nextBuses;
        this.distance = distance;
    }
}