import * as express from 'express';
import * as request from 'request';
import * as cors from 'cors';
import { Bus } from "./bus";
import { Stop } from "./stop";
import { RetrieveData } from "./retrieveData";

export class ApiServer {
    public static startListening() {
        const app = express();
        app.use(cors());


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


        app.listen(3000, function () {
            console.log('Listening on port 3000');
        })
    }
}