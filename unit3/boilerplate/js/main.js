(function () {


    //pseudo-global variables
    var attrArray = ["GDP", "GDP per Capita", "Percentage of GDP in Agriculture", "Important sites for terrestrial biodiversity protected", "fertility rate"]; //list of attributes
    var expressed = attrArray[1]; //initial attribute

    //execute script when window is loaded
    window.onload = setMap
    // set up choropleth map
    function setMap() {
         //map frame dimensions
    var width = window.innerWidth * 0.5,
        height = 600;


        //create new svg container for our map
        var map = d3.select("body")
            .append("svg")
            .attr("class", "map")
            .attr("width", width)
            .attr("height", height);
        //create albers projection
        var projection = d3.geoAlbers()
            .center([-66, -17.5])
            .rotate([-2, 0, 0])
            .parallels([-35, 25])
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


        function callback(data) {


            var csvData = data[0],
                centandsouth = data[1];

            setGraticule(map, path);
            // translate topojson to geojson that is workable in d3
            var southAmerica = topojson.feature(centandsouth, centandsouth.objects.southAmerica).features;
            // add south american countries to the map
            var countries = map.append("path")
                .datum(southAmerica)
                .attr("class", "countries")
                .attr("d", path);

            var colorScale = makeColorScale(csvData)

            southAmerica = joinData(southAmerica, csvData)

            setEnumerationUnits(southAmerica, map, path, colorScale);

            setChart(csvData, colorScale);

        };
    };
    // function to create color scale generator
    function makeColorScale(data) {
        var colorClasses = [
            "#D4B9DA",
            "#C994C7",
            "#DF65B0",
            "#DD1C77",
            "#980043"
        ];

        //create color scale generator
        var colorScale = d3.scaleThreshold()
            .range(colorClasses);

        //build array of all values of the expressed attribute
        var domainArray = [];
        for (var i = 0; i < data.length; i++) {
            var val = parseFloat(data[i][expressed]);
            domainArray.push(val);

        };
        //cluster data using ckmeans clustering algorithm to create natural breaks
        var clusters = ss.ckmeans(domainArray, 5);
        //reset domain array to cluster minimums
        domainArray = clusters.map(function (d) {
            return d3.min(d);
        });
        //remove first value from domain array to create class breakpoints
        domainArray.shift();

        //assign array of last 4 cluster minimums as domain
        colorScale.domain(domainArray);

        return colorScale;
    };

    function setGraticule(map, path) {
        var graticule = d3.geoGraticule()
            .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude

        //create graticule background
        var gratBackground = map.append("path")
            .datum(graticule.outline()) //bind graticule background
            .attr("class", "gratBackground") //assign class for styling
            .attr("d", path) //project graticule

        //create graticule lines
        var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
            .data(graticule.lines()) //bind graticule lines to each element to be created
            .enter() //create an element for each datum
            .append("path") //append each element to the svg as a path element
            .attr("class", "gratLines") //assign class for styling
            .attr("d", path); //project graticule lines
    };

    function joinData(southAmerica, csvData) {
        // loop through the csv to assign each set of csv attribute values to geojson
        for (var i = 0; i < csvData.length; i++) {
            var csvRegion = csvData[i]; //the current region
            var csvKey = csvRegion.SOVEREIGNT; //the CSV primary key

            //loop through geojson regions to find correct region
            for (var a = 0; a < southAmerica.length; a++) {

                var geojsonProps = southAmerica[a].properties; //the current region geojson properties
                var geojsonKey = geojsonProps.SOVEREIGNT; //the geojson primary key
                //console.log("geosjon key: " + geojsonKey + " csv key: " + csvKey)
                //where primary keys match, transfer csv data to geojson properties object
                if (geojsonKey == csvKey) {

                    //assign all attributes and values
                    attrArray.forEach(function (attr) {
                        var val = parseFloat(csvRegion[attr]); //get csv attribute value
                        geojsonProps[attr] = val; //assign attribute and value to geojson properties
                        // console.log(southAmerica)
                    });
                };
            };
        };
        return southAmerica
    };

    function setEnumerationUnits(southAmerica, map, path, colorScale) {


        var countries = map.selectAll(".countries")
            .data(southAmerica)
            .enter()
            .append("path")
            .attr("class", function (d) {
                return "countries " + d.properties.SOVEREIGNT;
            })
            .attr("d", path)
            .style("fill", function (d) {
                var value = d.properties[expressed];

                if (value) {
                    return colorScale(d.properties[expressed]);
                } else {
                    return "#ccc";
                }
            });
        // add south american countries to the map
    };

    //function to create coordinated bar chart
function setChart(csvData, colorScale){
    //chart frame dimensions
    var chartWidth = 550,
        chartHeight = 460;

    //create a second svg element to hold the bar chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");

    //create a scale to size bars proportionally to frame
    var yScale = d3.scaleLinear()
        .range([0, chartHeight])
        .domain([0, 19000]);

    //set bars for each province
    var bars = chart.selectAll(".bars")
    .data(csvData)
    .enter()
    .append("rect")
    .sort(function(a, b){
        return a[expressed]-b[expressed]
    })
    .attr("class", function(d){
        return "bars " + d.SOVEREIGNT;
    })
    .attr("width", chartWidth / csvData.length - 1)
    .attr("x", function(d, i){
        return i * (chartWidth / csvData.length);
    })
    .attr("height", function(d){
        return yScale(parseFloat(d[expressed]));
    })
    .attr("y", function(d){
        return chartHeight - yScale(parseFloat(d[expressed]));
    })
    .style("fill", function(d){
        return colorScale(d[expressed]);
    });
//annotate bars with attribute value text
    var numbers = chart.selectAll(".numbers")
    .data(csvData)
    .enter()
    .append("text")
    .sort(function(a, b){
        return a[expressed]-b[expressed]
    })
    .attr("class", function(d){
        return "numbers " + d.SOVEREIGNT;
    })
    .attr("text-anchor", "middle")
    .attr("x", function(d, i){
        var fraction = chartWidth / csvData.length;
        return i * fraction + (fraction - 1) / 2;
    })
    .attr("y", function(d){
        return chartHeight - yScale(parseFloat(d[expressed])) + 15;
    })
    .text(function(d){
        return d[expressed];
    });

      //below Example 2.8...create a text element for the chart title
      var chartTitle = chart.append("text")
      .attr("x", 20)
      .attr("y", 40)
      .attr("class", "chartTitle")
      .text("GDP per capita" + expressed[3] + " in each country (USD)");

         //chart frame dimensions
    var chartWidth = window.innerWidth * 0.425,
    chartHeight = 460;

    
};
})()