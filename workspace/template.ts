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
            }
        });
    }

    private printNextBuses(stopCode: string) {
         const requestPromise = new Promise((resolve, reject) => {
            request('https://api.tfl.gov.uk/StopPoint/'+stopCode+'/Arrivals?app_id=1aeb84cc&app_key=8319a3e05b400574fdc7d0db5b0d3bfb', function (error, response, body) {
                if (error) {
                    reject(error);
                } else {
                    resolve(body);
                }
            });
            
        });
        requestPromise.then((body)=>this.quickestFive(this.parseJson(body))).catch((err)=> console.log(err));
    }

    private parseJson(body): Bus[] {
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

    private quickestFive(busList: Bus[]): void {
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
        for (let i = 0; i< quickest.length; i++) {
            console.log(quickest[i].getBusInfo());
        }
    }
}

