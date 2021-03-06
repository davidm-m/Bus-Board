import { Bus } from './bus';

export class Stop {
    
    constructor (private id: string,private commonName: string,private nextBuses?: Bus[],private distance?:number) {
    }

    public getListOfBuses():Bus[]{
        return this.nextBuses;
    }

    public printInfo():void
    {
        if(this.distance) console.log(this.commonName+" at "+this.distance.toString()+" meters away:");  
        else console.log(this.commonName);        
    }
}