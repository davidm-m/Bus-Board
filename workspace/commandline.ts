import * as request from 'request';
import * as readline from 'readline';
import * as lodash from 'lodash';
import { Bus } from "./bus";
import { Stop } from "./stop";
import { RetrieveData } from "./retrieveData";

export class CommandLine {
    public static init(): void {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        console.log("Use \"Print Buses [stopcode]\" to get a list of the next five buses to that stop");
        console.log("Use \"Find Near [postcode]\" to find the nearest 2 stops to your postcode and their next five buses");
        console.log("Use \"Route For [busId]\" to find the next stops along the bus' route");
        rl.on('line', (input: string) => {
            if (input.startsWith("Print Buses ")) {
                CommandLine.printNextBuses(lodash.replace(input,"Print Buses ",""));
            } else if (input.startsWith("Find Near ")) {
                CommandLine.findNearAndPrint(lodash.replace(input,"Find Near ",""));
            } else if (input.startsWith("Route For ")) {
                CommandLine.printBusRoute(lodash.replace(input,"Route For ",""));
            }
        });
    }

    private static printBusRoute(busId:string):void{
        const stopsPromise: Promise<Stop[]> = RetrieveData.getRouteForBus(busId);
        stopsPromise
            .then((stops)=> {
                CommandLine.printRoute(stops);
            })
            .catch((err) => console.log(err));
    } 

    private static printRoute(stops:Stop[]){
        for(let i = 0; i < stops.length; i ++){
            stops[i].printInfo();
        }
    }

    private static printNextBuses(stopCode: string): void {
        const busPromise = RetrieveData.getSoonestFive(stopCode);

        busPromise
            .then((body: Bus[])=>CommandLine.printBuses(body))
            .catch((err: Error) =>console.log(err));
        
    }

    private static findNearAndPrint(postCode: string): void {
        const stopPromise: Promise<Stop[]> = RetrieveData.getClosestStops(postCode);
        stopPromise
            .then((closest: Stop[])=> CommandLine.printStopsAndBuses(closest))
            .catch((err: Error)=> console.log(err));
    }

    private static printStopsAndBuses(closest: Stop[]):void
    {
        for (let i = 0; i < 2; i++) {
            if (i >= closest.length) {
                console.log("Not enough bus stops in area");
                break;
            } else {
                const stop: Stop = closest[i];
                stop.printInfo();
                CommandLine.printBuses(closest[i].getListOfBuses());
            }
        }
    }

    private static printBuses(soonest: Bus[]):void{

        for (let i = 0; i< soonest.length; i++) {
            console.log("  "+soonest[i].getBusInfo());
        }
        console.log();
    }
   
}