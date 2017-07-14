import request = require('request');

export class Template {

    public run(): void {
        request('https://api.tfl.gov.uk/StopPoint/490008660N/Arrivals?app_id=1aeb84cc&app_key=8319a3e05b400574fdc7d0db5b0d3bfb', function (error, response, body) {
        console.log('error:', error); // Print the error if one occurred 
        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
        console.log('body:', body); // Print the HTML for the Google homepage. 
});
    }
}

