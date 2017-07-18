import * as express from 'express';
import * as request from 'request';
import * as cors from 'cors';
import * as path from 'path';
import { Bus } from "./bus";
import { Stop } from "./stop";
import { RetrieveData } from "./retrieveData";

export class ApiServer {
    public static startListening() {
        const app = express();
        app.use(cors());
        app.use('/', express.static(path.join(__dirname,"./frontend")));

        app.get('/', function (req, res) {
            res.send("Hello World!");
        })
        
        app.get('/closestStops', function (req, res) {
            const postCode: string = req.query.postcode;

            const stopsPromise: Promise<Stop[]> = RetrieveData.getClosestStops(postCode);
            stopsPromise
                .then((body: Stop[])=> res.send(body))
                .catch((err: Error)=> {
                    console.log(err);
                    res.send(err.toString());
                });
        });

        app.get('/nextStops', function (req, res) {
            const busId: string = req.query.busId;

            const stopsPromise: Promise<Stop[]> = RetrieveData.getRouteForBus(busId);
            stopsPromise
                .then((body: Stop[])=> res.send(body))
                .catch((err: Error)=> {
                    console.log(err);
                    res.send(err.toString());
                });
        });

        
        const port = process.env.PORT || 3000;
        app.listen(port, function () {
            console.log('Listening on port ' + port);
        })
    }
}