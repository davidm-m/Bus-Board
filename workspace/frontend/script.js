
var intervalCaller;
var curHighlight;
function getDataForPostCode(postCode)
{
    var xhttp = new XMLHttpRequest();

    xhttp.open("GET", "http://localhost:3000/closestStops?postcode="+postCode, false);

    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.setRequestHeader('Access-Control-Allow-Headers', '*');
    xhttp.setRequestHeader("Access-Control-Allow-Origin", 'http://localhost:3000');

    xhttp.send();

    return xhttp.responseText;
}

function getDataForBus(busId)
{
    var xhttp = new XMLHttpRequest();

    xhttp.open("GET", "http://localhost:3000/nextStops?busId="+busId, false);

    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.setRequestHeader('Access-Control-Allow-Headers', '*');
    xhttp.setRequestHeader("Access-Control-Allow-Origin", 'http://localhost:3000');

    xhttp.send();

    return xhttp.responseText;
}



function updateBoard()
{
    var postcode = document.getElementById("postCodeTextfield").value;
    if(intervalCaller != undefined) {
        clearInterval(intervalCaller);
    }
    displayData(getDataForPostCode(postcode));
    intervalCaller = setInterval(function(){
        document.getElementById("route").innerHTML = "";
        displayData(getDataForPostCode(postcode));
    }, 30000)
    
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
            tables += "<table id='mytable'><tr><th class='line'>Line</th><th class='towards'>Towards</th><th class='destination'>Destination</th><th class='time'>Expected (mins)</th><th class='route'>Route</th></tr>";
            for (var j = 0; j< response[i]["nextBuses"].length; j++) {
                var quote = "'"
                tables += '<tr id=' + quote + response[i]["nextBuses"][j]["vehicleId"] + quote + '><td class="line">'+response[i]["nextBuses"][j]["lineName"]
                    +"</td><td class='towards'>"+response[i]["nextBuses"][j]["towards"]
                    +"</td><td class='destination'>"+response[i]["nextBuses"][j]["destinationName"]
                    +"</td><td class='time'>"+Math.ceil(response[i]["nextBuses"][j]["timeToStation"]/60).toString()
                    +'</td><td class="route"><button onclick="displayRoute(' + quote + response[i]["nextBuses"][j]["vehicleId"] + quote + ')">show</button></td></tr>';

            }
            tables += "</table><br><br>";
        }
    }
    document.getElementById("buses").innerHTML = tables;
    
    if (curHighlight && document.getElementById(curHighlight)) {
        displayRoute(curHighlight);
    } else {
        document.getElementById("route").style.border = "";
        if (curHighlight) {
            document.getElementById(curHighlight).style.border = "";
        }
    }
}

function checkSubmit(event)
{
    if(event.keyCode== 13){
        updateBoard();
    }
}

function displayRoute(busId)
{
    if(curHighlight){
        document.getElementById(curHighlight).style.border = "";
    }
    
    var data = getDataForBus(busId);
    var response = JSON.parse(data);
    var responseString = "<b>Next Stops:</b><br>";
    for(var i =0; i < response.length; i++){
        responseString += " " +response[i]["commonName"] + "  <br>";
    }
    document.getElementById("route").innerHTML = responseString;
    document.getElementById(busId).style.border = "2px solid blue";
    document.getElementById("route").style.border = "2px solid blue"
    curHighlight = busId;
}