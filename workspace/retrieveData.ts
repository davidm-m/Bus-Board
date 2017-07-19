import * as request from 'request';
import { Bus } from "./bus";
import { Stop } from "./stop";

export class RetrieveData {
    public static getRouteForBus(busId: string): Promise<Stop[]>
    {
        const StopPromise: Promise<Stop[]> = new Promise<Stop[]>((resolve, reject)=> {
             request('https://api.tfl.gov.uk/Vehicle/' + busId + '/Arrivals&app_id=1aeb84cc&app_key=8319a3e05b400574fdc7d0db5b0d3bfb', (error, response, body) => {
                if(error){
                    reject(error);
                }
                else {
                    const parsed: Object[] = JSON.parse(body);
                    resolve(RetrieveData.getStopsFromData(parsed));
                }
             });
        });
        return StopPromise;
    }

    public static getSoonestFive(stopcode: string): Promise<Bus[]> {
        const busPromise: Promise<Bus[]> = new Promise<Bus[]>((resolve, reject)=> {
            const dataPromise:Promise<string> = RetrieveData.getBusRequest(stopcode);
            dataPromise
                    .catch((err: Error)=> reject(err))
                    .then((body: string)=>{
                        const buses: Bus[] = RetrieveData.parseJsonBus(body as string);
                        const soonest: Bus[] = RetrieveData.soonestFive(buses);
                        resolve(soonest);
            });
        });

        return busPromise;
    }

    public static getClosestStops(postcode: string): Promise<Stop[]> {
        const stopsPromise: Promise<Stop[]> = new Promise<Stop[]>((resolve, reject) => {
            const longLatPromise: Promise<number[]> = RetrieveData.getLongLatPromise(postcode);
            longLatPromise
                .then((longLat: number[])=> {
                    const getStopsForLongLatPromise: Promise<string> = RetrieveData.getStopsPromise(longLat);
                    getStopsForLongLatPromise
                        .then((body: string)=> resolve(RetrieveData.makeStopsPromise(body)))
                        .catch((err: Error)=> reject(err));
                })
                .catch((err: Error)=> reject(err));
        });
        return stopsPromise;
    }

    private static getStopsFromData(body:Object[]):Stop[]
    {
        let stopList: Stop[] = [];
        for(let i =0; i < body.length; i++){
            const stop = new Stop(body[i]["naptanId"], body[i]["stationName"]);
            stopList[i] = stop;
        }
        return stopList;
    }

    private static getLongLatPromise(postcode: string): Promise<number[]> {
        const requestPromise: Promise<number[]> = new Promise<number[]>((resolve, reject) => {
            request('http://api.postcodes.io/postcodes/'+postcode, (error, response, body) => {
                if (error) {
                    reject(error);
                } else {
                    const parsed: JSON = JSON.parse(body);
                    if(parsed["status"] != 200){
                        reject(new Error(parsed["error"]));
                    }
                    else{
                        resolve(RetrieveData.returnLongLat(parsed));
                    }
                }
            });
        })        
        return requestPromise;
    }

    private static returnLongLat(data: JSON):number[]
    {
        let longLat: number[] = [];
        longLat[0] = data["result"]['longitude'];
        longLat[1] = data["result"]['latitude'];
        return longLat;

    }

    private static getStopsPromise(longLat: number[]): Promise<string>
    {
        const requestPromise: Promise<string> = new Promise<string>((resolve, reject) => {
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

    private static getBusRequest(stopCode: string): Promise<string> {
         const requestPromise: Promise<string> = new Promise<string> ((resolve, reject) => {
            request('https://api.tfl.gov.uk/StopPoint/' + stopCode + '/Arrivals?app_id=1aeb84cc&app_key=8319a3e05b400574fdc7d0db5b0d3bfb', (error, response, body) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(body);
                }
            });
            
        });
        return requestPromise;
    }

     private static makeStopsPromise(body: string): Promise<Stop[]> {
        const originalJSON: JSON = JSON.parse(body);
        let returnStops: Stop[] = [];
        const stopJSONPromise: Promise<Stop[]> = new Promise<Stop[]>((resolve,reject)=> {
            if (originalJSON["stopPoints"].length === 0) {
                reject(new Error("Not enough stops in area"));
            }
            const firstStopPromise: Promise<Stop> = RetrieveData.makeStopObjectPromise(originalJSON["stopPoints"][0]);
            firstStopPromise
                .catch((err: Error)=> reject(err))
                .then((stop: Stop)=>{
                    returnStops[0] = stop;
                    if (originalJSON["stopPoints"].length === 1) {
                        resolve(returnStops);
                    }
                    const secondStopPromise: Promise<Stop> = RetrieveData.makeStopObjectPromise(originalJSON["stopPoints"][1]);
                    secondStopPromise
                        .catch((err: Error)=> reject(err))
                        .then((secStop: Stop)=>{
                            returnStops[1] = secStop;
                            resolve(returnStops);
                        })
                });
        })
        return stopJSONPromise;

    }

    private static makeStopObjectPromise(data: JSON): Promise<Stop> {
        const stopObjectPromise: Promise<Stop> = new Promise((resolve, reject)=> {
            const busPromise: Promise<string> = RetrieveData.getBusRequest(data["id"]);
            busPromise
                .catch((err: Error)=> reject(err))
                .then((body: string)=>{
                    const buses: Bus[] = RetrieveData.parseJsonBus(body);
                    const quickest: Bus[] = RetrieveData.soonestFive(buses);
                    const stop: Stop = new Stop(data["id"],data["commonName"],quickest,data["distance"]);
                    resolve(stop);
                });
        });
        return stopObjectPromise;
    }

    private static parseJsonBus(body: string): Bus[] {
        const data: Bus[] = JSON.parse(body);
        let busList: Bus[] = [];
        for(let i = 0; i < data.length; i ++)
        {
            let busData: Bus = data[i];
            let bus = new Bus(busData["id"], busData["operationType"], busData["vehicleId"], busData["lineId"], busData["lineName"], busData["platformName"], busData["direction"], busData["bearing"], busData["destinationNaptanId"],busData["destinationName"], busData["timeToStation"], busData["expectedArrival"], busData["towards"]);
            busList[i] = bus;
        }
        return busList;
    }

    private static soonestFive(busList: Bus[]): Bus[] {
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