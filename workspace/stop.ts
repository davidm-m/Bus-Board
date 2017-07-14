import { Bus } from './bus';

export class Stop {
    private id: string;
    private commonName: string;
    private nextBuses: Bus[];

    constructor (id: string,commonName: string,nextBuses: Bus[]) {
        this.id = id;
        this.commonName = commonName;
        this.nextBuses = nextBuses;
    }
}