export class Bus {

    constructor (private id: number,private operationType: number,private vehicleId: string,private lineId: string,private lineName: string,private platformName: string,private direction: string,private bearing: number,private destinationNaptanId:string,private destinationName: string,private timeToStation: number,private expectedArrival: Date,private towards: string) {
    }

    public getTimeToStation(): number {
        return this.timeToStation;
    }

    public getBusInfo(): string {
        return "Bus on line "+this.lineName+" towards "+this.destinationName+" is less than "+Math.ceil(this.timeToStation/60).toString()+" minutes away.";
    }
}