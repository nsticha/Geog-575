//execute script when window is loaded
window.onload = setMap

// set up choropleth map
function setMap(){
    // creates map frame
    var width = 600,
    height = 600;

//create new svg container for our map
    var map = d3.select("body")
        .append("svg")
        .attr("class","map")
        .attr("width", width)
        .attr("height", height);
//create albers projection
    var projection = d3.geoAlbers()
        .center ([-66, -17.5])
        .rotate([-2,0,0])
        .parallels([-35,25])
        .scale(440)
        .translate([width / 2, height / 2]);
//converts the projection into a usable object
        var path = d3.geoPath()
            .projection(projection);
    var promises = [
        d3.csv("data/CSA.csv"),
        d3.json("data/southAmerica.topojson")
    ]

    Promise.all(promises).then(callback);

    function callback(data){


        var csvData = data[0],
            centandsouth = data[1];
        
        var southAmerica = topojson.feature(centandsouth, centandsouth.objects.southAmerica);
// add south american countries to the map
        var countries = map.append("path")
            .datum(southAmerica)
            .attr("class","countries")
            .attr("d",path);
    }
}