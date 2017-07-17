import request = require('request');
import readline = require('readline');
import express = require('express');
import { Bus } from "./bus";
import { Stop } from "./stop";

export class Template {

    public run(): void {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const app = express();
        rl.on('line', (input: string) => {
            if (input.startsWith("Print Buses ")) {
                this.printNextBuses(input.substring(12));
            } else if (input.startsWith("Find Near ")) {
                this.findNearAndPrint(input.substring(10));
            }
        });

        app.get('/closestStops', function (req, res) {
            const postCode: string = req.query.postcode;
            res.send(postCode);
        });
        app.listen(3000, function () {
            console.log('Listening on port 3000');
        })
    }

    private findNearAndPrint(postCode: string): void {
        const dataPromise: Promise<string> = this.findNear(postCode);
        dataPromise
            .then((body)=>{
                const longLat: number[] = this.returnLongLat(body);
                const stopsPromise = this.getStopsPromise(longLat);
                stopsPromise
                    .catch((err)=>console.log(err))
                    .then((body)=>this.printStopsAndBuses(body as string));
            })
            .catch((err)=>(console.log(err)));
    }

    private findNearAndMakeJson(postCode: string): JSON {
        const dataPromise: Promise<string> = this.findNear(postCode);
        dataPromise
            .then((body)=>{
                const longLat: number[] = this.returnLongLat(body);
                const stopsPromise = this.getStopsPromise(longLat);
                stopsPromise
                    .catch((err)=>console.log(err))
                    .then((body)=>{
                        return this.makeStopJson(body as string);
                    });
            })
        return null;
    }

    private makeStopJson(body: string): JSON {
        return null;
    }
    
    private findNear(postcode: string): Promise<string> {
        const requestPromise = new Promise<string>((resolve, reject) => {
            request('http://api.postcodes.io/postcodes/'+postcode, function (error, response, body) {
                if (error) {
                    reject(error);
                } else {
                    resolve(body);
                }
            });
        })        
        return requestPromise;
    }

    private returnLongLat(body):number[]
    {
        let longLat: number[] = [];
        const data = JSON.parse(body);
        longLat[0] = data["result"]['longitude'];
        longLat[1] = data["result"]['latitude'];
        return longLat;

    }

    private getStopsPromise(longLat: number[]): Promise<string>
    {
        const requestPromise = new Promise<string>((resolve, reject) => {
            request('https://api.tfl.gov.uk/StopPoint?stopTypes=NaptanPublicBusCoachTram&radius=200&useStopPointHierarchy=false&modes=bus&returnLines=false&lat='+longLat[1].toString()+'&lon='+longLat[0].toString()+'&app_id=1aeb84cc&app_key=8319a3e05b400574fdc7d0db5b0d3bfb', function(error, response, body) {
                if (error) {
                    reject(error);
                } else {
                    resolve(body);
                }
            })
        });
        return requestPromise;
        
    }

    private printStopsAndBuses(body: string): void {
        const data = JSON.parse(body);
        for (let i = 0; i < 2; i++) {
            if (i >= data["stopPoints"].length) {
                console.log("Not enough bus stops in area");
                break;
            } else {
                const stop = data["stopPoints"][i];
                const busPromise = this.getBusRequest(stop["id"]);
                busPromise
                    .then((body) => {
                        console.log(stop["commonName"]+" at "+stop["distance"].toString()+" meters away");
                        this.printBuses(body);
                    })
                    .catch((err)=>console.log(err));
            }
        }
    }

    private printBuses(body: string):void{
        const buses: Bus[] = this.parseJsonBus(body);
        const quickest: Bus[] = this.quickestFive(buses);
        for (let i = 0; i< quickest.length; i++) {
            console.log(quickest[i].getBusInfo());
        }
    }

    private printNextBuses(stopCode: string): void {
        const busPromise = this.getBusRequest(stopCode);

        busPromise
            .then((body)=>this.printBuses(body))
            .catch((err) =>console.log(err));
        
    }

    private getBusRequest(stopCode: string): Promise<string> {
         const requestPromise = new Promise<string> ((resolve, reject) => {
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

    private parseJsonBus(body: string): Bus[] {
        const data = JSON.parse(body);
        let busList: Bus[] = [];
        for(let i = 0; i < data.length; i ++)
        {
            let busData = data[i];
            let bus = new Bus(busData["id"], busData["operationType"], busData["vehicleId"], busData["lineId"], busData["lineName"], busData["platformName"], busData["direction"], busData["bearing"], busData["destinationNaptanId"],busData["destinationName"], busData["timeToStation"], busData["expectedArrival"], busData["towards"]);
            busList[i] = bus;
        }
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

