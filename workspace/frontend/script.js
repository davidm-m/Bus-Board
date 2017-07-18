
var intervalCaller;
function getData(postCode)
{
    console.log(postCode);
    var xhttp = new XMLHttpRequest();

    xhttp.open("GET", "http://localhost:3000/closestStops?postcode="+postCode, false);

    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.setRequestHeader('Access-Control-Allow-Headers', '*');
    xhttp.setRequestHeader("Access-Control-Allow-Origin", 'http://localhost:3000');

    xhttp.send();

    return xhttp.responseText;
}

function reload()
{
    var postcode = document.getElementById("postCodeTextfield").value;
    if(intervalCaller != undefined) {
        clearInterval(intervalCaller);
    }   
    displayData(getData(postcode));
    intervalCaller = setInterval(function(){
    displayData(getData(postcode))}, 30000)
}

function displayData(data) {
    if(data.startsWith("Error")){
        document.getElementById("buses").innerHTML = data;
        return;
    }
    
    var response = JSON.parse(data);
    var tables = "";
    for (var i = 0; i<response.length; i++) {
        tables += "<b>"+response[i]["commonName"]+"</b>";
        if (response[i]["nextBuses"].length === 0) {
            tables += "<br>No incoming buses<br>";
            continue;
        } else {
            tables += "<table><tr><th>Line</th><th>Towards</th><th>Destination</th><th>Time to arrival (mins)</th></tr>";
            for (var j = 0; j< response[i]["nextBuses"].length; j++) {
                tables += "<tr><td>"+response[i]["nextBuses"][j]["lineName"]+"</td><td>"+response[i]["nextBuses"][j]["towards"]+"</td><td>"+response[i]["nextBuses"][j]["destinationName"]+"</td><td>"+Math.ceil(response[i]["nextBuses"][j]["timeToStation"]/60).toString()+"</td></tr>";
            }
            tables += "</table><br><br>";
        }
    }
    document.getElementById("buses").innerHTML = tables;
}