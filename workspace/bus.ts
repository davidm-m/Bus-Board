export class Bus {
    private id: number;
    private operationType: number;
    private vehicleId: string;
    private lineId: string;
    private lineName: string;
    private platformName: string;
    private direction: string;
    private bearing: number;
    private destinationNaptanId: string;
    private destinationName: string;
    private timeToStation: number;
    private expectedArrival: Date;
    private towards: string;

    constructor (id: number,operationType: number,vehicleId: string,lineId: string,lineName: string,platformName: string,direction: string,bearing: number,destinationNaptanId:string,destinationName: string,timeToStation: number,expectedArrival: Date,towards: string) {
        this.id = id;
        this.operationType = operationType;
        this.vehicleId = vehicleId;
        this.lineId = lineId;
        this.lineName = lineName;
        this.platformName = platformName;
        this.direction = direction;
        this.bearing = bearing;
        this.destinationNaptanId = destinationNaptanId;
        this.destinationName = destinationName;
        this.timeToStation = timeToStation;
        this.expectedArrival = expectedArrival;
        this.towards = towards;
    }

    public getTimeToStation(): number {
        return this.timeToStation;
    }

    public getBusInfo(): string {
        return this.lineName+" "+this.destinationName+" "+(this.timeToStation/60).toString();
    }
}