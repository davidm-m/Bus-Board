import request = require('request');
import readline = require('readline');
import { Bus } from "./bus";

export class Template {

    public run(): void {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.on('line', (input: string) => {
            if (input.startsWith("Print Buses ")) {
                this.printNextBuses(input.substring(12));
            } else if (input.startsWith("Find Near ")) {
                this.findNear(input.substring(10));
            }
        });
    }

    private findNear(postcode: string): void {
        const requestPromise = new Promise((resolve, reject) => {
            request('http://api.postcodes.io/postcodes/'+postcode, function (error, response, body) {
                if (error) {
                    reject(error);
                } else {
                    resolve(body);
                }
            });
        })
        requestPromise.then((body)=>{

            this.getStops(this.returnLongLat(body));
        });
    }

    private returnLongLat(body):number[]
    {
        let longLat: number[] = [];
        const data = JSON.parse(body);
        longLat[0] = data["result"]['longitude'];
        longLat[1] = data["result"]['latitude'];
        return longLat;

    }

    private getStops(longLat: number[]):void
    {
        const requestPromise = new Promise((resolve, reject) => {
            request('https://api.tfl.gov.uk/StopPoint?stopTypes=NaptanPublicBusCoachTram&radius=200&useStopPointHierarchy=false&modes=bus&returnLines=false&lat='+longLat[1].toString()+'&lon='+longLat[0].toString()+'&app_id=1aeb84cc&app_key=8319a3e05b400574fdc7d0db5b0d3bfb', function(error, response, body) {
                if (error) {
                    reject(error);
                } else {
                    resolve(body);
                }
            })
        });
        requestPromise.then((body)=>this.getClosest(body));
    }

    private getClosest(body) {
        const data = JSON.parse(body);
        for (let i = 0; i < 2; i++) {
            if (i >= data["stopPoints"].length) {
                console.log("Not enough bus stops in area");
                break;
            } else {
                const stop = data["stopPoints"][i];
                const busPromise = this.getBusRequest(stop["id"]);
                busPromise.then((body) => {
                    console.log(stop["commonName"]+" at "+stop["distance"].toString()+" meters away");
                    this.printBuses(body);
                })
                
                //this.printNextBuses(stop["id"]);
            }
        }
    }

    private printBuses(body):void{
        //console.log(body);
        const buses: Bus[] = this.parseJsonBus(body);
        const quickest: Bus[] = this.quickestFive(buses);
        for (let i = 0; i< quickest.length; i++) {
            console.log(quickest[i].getBusInfo());
        }
    }

    private printNextBuses(stopCode: string) {
        const busPromise = this.getBusRequest(stopCode);

        busPromise
            .then((body)=>this.printBuses(body))
            .catch(console.log);
        
    }

    private getBusRequest(stopCode: string): Promise<Bus[]> {
         const requestPromise = new Promise<Bus[]> ((resolve, reject) => {
            request('https://api.tfl.gov.uk/StopPoint/'+stopCode+'/Arrivals?app_id=1aeb84cc&app_key=8319a3e05b400574fdc7d0db5b0d3bfb', function (error, response, body) {
                if (error) {
                    reject(error);
                } else {
                    resolve(body);
                }
            });
            
        });
        return requestPromise;
    }

    private parseJsonBus(body): Bus[] {
        const data = JSON.parse(body);
        let busList: Bus[] = [];
        //console.log(body);
        for(let i = 0; i < data.length; i ++)
        {
            let busData = data[i];
            let bus = new Bus(busData["id"], busData["operationType"], busData["vehicleId"], busData["lineId"], busData["lineName"], busData["platformName"], busData["direction"], busData["bearing"], busData["destinationNaptanId"],busData["destinationName"], busData["timeToStation"], busData["expectedArrival"], busData["towards"]);
            busList[i] = bus;
        }
        //console.log(busList);
        return busList;
    }

    private quickestFive(busList: Bus[]): Bus[] {
        let quickest: Bus[] = [];
        for (let i = 0; i < busList.length; i++) {
            if (quickest.length === 0) {
                quickest[0] = busList[i];
            } else {
                for (let j = 0; j < quickest.length; j++){
                    if (busList[i].getTimeToStation() < quickest[j].getTimeToStation()) {
                        quickest.splice(j,0,busList[i]);
                        if (quickest.length > 5) {
                            quickest.splice(quickest.length-1,1);
                        }
                        break;
                    }
                }
            }
        }
        return quickest;
    }
}

