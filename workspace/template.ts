import request = require('request');
import readline = require('readline');
import express = require('express');
import cors = require('cors');
import { Bus } from "./bus";
import { Stop } from "./stop";

export class Template {

    public run(): void {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const app = express();
        app.use(cors());
        rl.on('line', (input: string) => {
            if (input.startsWith("Print Buses ")) {
                Template.printNextBuses(input.substring(12));
            } else if (input.startsWith("Find Near ")) {
                Template.findNearAndPrint(input.substring(10));
            }
        });


        app.get('/closestStops', function (req, res) {
            const postCode: string = req.query.postcode;

            const dataPromise = Template.findNearAndMakeJson(postCode);
            dataPromise
                .then((body)=> res.send(body))
                .catch((err)=> {
                    console.log(err);
                    res.send(err.toString());
                });
        });


        app.listen(3000, function () {
            console.log('Listening on port 3000');
        })
    }

    private static findNearAndPrint(postCode: string): void {
        const dataPromise: Promise<string> = Template.findNear(postCode);
        dataPromise
            .then((body)=>{
                const longLat: number[] = Template.returnLongLat(body);
                const stopsPromise = Template.getStopsPromise(longLat);
                stopsPromise
                    .catch((err)=>console.log(err))
                    .then((body)=>Template.printStopsAndBuses(body as string));
            })
            .catch((err)=>(console.log(err)));
    }

    private static findNearAndMakeJson(postCode: string): Promise<JSON> {
        const stopPromise = new Promise<JSON>((resolve, reject)=> {
            const findNearPromise = Template.findNear(postCode);
            findNearPromise
                .catch((err)=> reject(err))
                .then((body)=>{
                    const longLat: number[] = Template.returnLongLat(body);
                    const getStopsForLongLatPromise = Template.getStopsPromise(longLat);
                    getStopsForLongLatPromise
                        .then((body)=> resolve(Template.makeStopJson(body)))
                        .catch((err)=> reject(err));

                });
        });
        return stopPromise;

    }

    private static makeStopJson(body: string): Promise<JSON> {
        const originalJSON = JSON.parse(body);
        let returnJSON: Stop[] = [];
        const stopJSONPromise = new Promise<JSON>((resolve,reject)=> {
            if (originalJSON["stopPoints"].length === 0) {
                reject(new Error("Not enough stops in area"));
            }
            const firstStopPromise = Template.makeStopObjectPromise(originalJSON["stopPoints"][0]);
            firstStopPromise
                .catch((err)=> reject(err))
                .then((stop)=>{
                    returnJSON[0] = stop as Stop;
                    if (originalJSON["stopPoints"].length === 1) {
                        resolve(JSON.parse(JSON.stringify(returnJSON)));
                    }
                    const secondStopPromise = Template.makeStopObjectPromise(originalJSON["stopPoints"][1]);
                    secondStopPromise
                        .catch((err)=> reject(err))
                        .then((secStop)=>{
                            returnJSON[1] = secStop as Stop;
                            resolve(JSON.parse(JSON.stringify(returnJSON)));
                        })
                });
        })
        return stopJSONPromise;

    }

    private static makeStopObjectPromise(data: JSON): Promise<Stop> {
        const stopObjectPromise: Promise<Stop> = new Promise((resolve, reject)=> {
            const busPromise = Template.getBusRequest(data["id"]);
            busPromise
                .catch((err)=> reject(err))
                .then((body)=>{
                    const buses: Bus[] = Template.parseJsonBus(body as string);
                    const quickest: Bus[] = Template.quickestFive(buses);
                    const stop: Stop = new Stop(data["id"],data["commonName"],quickest,data["distance"]);
                    resolve(stop);
                });
        });
        return stopObjectPromise;
    }
    
    private static findNear(postcode: string): Promise<string> {
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

    private static returnLongLat(body):number[]
    {
        let longLat: number[] = [];
        const data = JSON.parse(body);
        longLat[0] = data["result"]['longitude'];
        longLat[1] = data["result"]['latitude'];
        return longLat;

    }

    private static getStopsPromise(longLat: number[]): Promise<string>
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

    private static printStopsAndBuses(body: string): void {
        const data = JSON.parse(body);
        for (let i = 0; i < 2; i++) {
            if (i >= data["stopPoints"].length) {
                console.log("Not enough bus stops in area");
                break;
            } else {
                const stop = data["stopPoints"][i];
                const busPromise = Template.getBusRequest(stop["id"]);
                busPromise
                    .then((body) => {
                        console.log(stop["commonName"]+" at "+stop["distance"].toString()+" meters away");
                        Template.printBuses(body);
                    })
                    .catch((err)=>console.log(err));
            }
        }
    }

    private static printBuses(body: string):void{
        const buses: Bus[] = Template.parseJsonBus(body);
        const quickest: Bus[] = Template.quickestFive(buses);
        for (let i = 0; i< quickest.length; i++) {
            console.log(quickest[i].getBusInfo());
        }
    }

    private static printNextBuses(stopCode: string): void {
        const busPromise = Template.getBusRequest(stopCode);

        busPromise
            .then((body)=>Template.printBuses(body))
            .catch((err) =>console.log(err));
        
    }

    private static getBusRequest(stopCode: string): Promise<string> {
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

    private static parseJsonBus(body: string): Bus[] {
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

    private static quickestFive(busList: Bus[]): Bus[] {
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

