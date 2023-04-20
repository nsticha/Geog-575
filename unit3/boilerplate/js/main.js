(function () {


    //pseudo-global variables
    var attrArray = ["Infant Mortality Rate", "GDP per Capita", "Percentage of GDP in Healthcare", "Life Expectancy at Birth", "Fertility Rate"]; //list of attributes
    var expressed = attrArray[0]; //initial attribute

    //chart frame dimensions
var chartWidth = window.innerWidth * 0.425,
chartHeight = 600,
leftPadding = 50,
rightPadding = 2,
topBottomPadding = 5,
chartInnerWidth = chartWidth - leftPadding - rightPadding,
chartInnerHeight = chartHeight - topBottomPadding * 2,
translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

//create a scale to size bars proportionally to frame and for axis
var yScale = d3.scaleLinear()
.range([600, 0])
.domain([0, 30]);
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
            .center([-66, -15.5])
            .rotate([-2, 0, 0])
            .parallels([-35, 25])
            .scale(420)
            .translate([width / 2, height / 2]);
        //converts the projection into a usable object
        var path = d3.geoPath()
            .projection(projection);
        var promises = [
            d3.csv("data/CSA.csv"),
            d3.json("data/southAmerica.topojson")
        ]

        Promise.all(promises).then(callback);

// stores functions so that they can execute on page
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

            createDropdown(csvData);

            //setLabel(csvData)

            makeLegend(colorScale, csvData)
            
        };
        
        console.log(top)
        //add select element
        var dropdown = d3.select("body")
            .append("select")
            .attr("class", "dropdown")
            .style('left',left + "px")
            .style("top",top + "px")
            .on("change", function () {
                changeAttribute(this.value, csvData)
            });
    };
    // function to create color scale generator
    function makeColorScale(data) {
        var colorClasses = [
            "#ffffd9",
            "#bae4bc",
            "#7bccc4",
            "#43a2ca",
            "#0868ac"
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
            })

            .on("mouseover", function(event, d){
                highlight(d.properties);
            })

            .on("mouseout", function(event, d){
                dehighlight(d.properties);
            })
            .on("mousemove", moveLabel);
            var desc = countries.append("desc")
            
        .text('{"stroke": "#000", "stroke-width": "0.5px"}')
        // add south american countries to the map
    };

    //function to create coordinated bar chart
function setChart(csvData, colorScale){
    //chart frame dimensions
    var chartWidth = 600,
        chartHeight = 600;

    //create a second svg element to hold the bar chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");

    //set bars for each province
    var bars = chart.selectAll(".bars")
    .data(csvData)
    .enter()
    .append("rect")
    .sort(function(a, b){
        return b[expressed] - a[expressed];
    })
    .attr("class", function(d){
        return "bars " + d.SOVEREIGNT;
    })
    .attr("width", chartInnerWidth / csvData.length - 1)
    
    .on("mouseover", function(event, d){
        highlight(d);
    })
    .on("mouseout", function(event, d){
        dehighlight(d);
    })
    .on("mousemove", moveLabel)

        .attr("x", function(d, i){
            return i * (chartInnerWidth / csvData.length) + leftPadding;
        })
        .attr("height", function(d, i){
            
            return 595 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        .style("fill", function(d){
            return colorScale(d[expressed]);
        })
        var desc = bars.append("desc")
        .text('{"stroke": "none", "stroke-width": "0px"}');


     //create vertical axis generator
     var yAxis = d3.axisLeft()
     .scale(yScale);

 //place axis
    var axis = chart.append("g")
     .attr("class", "axis")
     .attr("transform", translate)
     .call(yAxis);

      //below Example 2.8...create a text element for the chart title
      var chartTitle = chart.append("text")
      .attr("x", 120)
      .attr("y", 30)
      .attr("class", "chartTitle")
      .text(expressed + " in Each Country");

      //updateChart(bars, csvData.length, colorScale);

         //chart frame dimensions
    var chartWidth = window.innerWidth * 0.425,
    chartHeight = 600;

    
};

function createDropdown(csvData){

    var top = document.querySelector(".map").getBoundingClientRect().top,
        left =  document.querySelector(".map").getBoundingClientRect().right - 280;

    //add select element
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
        .style("left", left + "px")
        .style("top", top + "px")
        .on("change", function(){
            changeAttribute(this.value, csvData)
        });

    //add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Attribute");

    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d });
};

//dropdown change listener handler
function changeAttribute(attribute, csvData) {
    //change the expressed attribute
    expressed = attribute;

    //recreate the color scale
    var colorScale = makeColorScale(csvData);
    var legend = makeLegend(colorScale);
    //recolor enumeration units
    var regions = d3.selectAll(".countries")
    .transition()
    .duration(1000)
    .style("fill", function (d) {
        var value = d.properties[expressed];
        if (value) {
            return colorScale(value);
        } else {
            return "#ccc";
        }
    });

    //re-sort, resize, and recolor bars
    var bars = d3.selectAll(".bars")
        //Sort bars
        .sort(function (a, b) {
            return b[expressed] - a[expressed];
        })
        .transition() //add animation
        .delay(function(d, i){
            return i * 20
        })
        .duration(500);

    var domainArray = [];
        for (var i = 0; i < csvData.length; i++) {
            var val = parseFloat(csvData[i][expressed]);
            domainArray.push(val);
        };
    var max = d3.max(domainArray)

    updateChart(bars, csvData.length, colorScale, max);
}

function updateChart(bars, n, colorScale, max) {
    var yScale = d3.scaleLinear()
        .range([chartHeight, 0])
        .domain([0, max + max*.1]);

    var yAxis = d3.axisLeft()
        .scale(yScale);

    d3.select(".axis").call(yAxis)
   
    //position bars
    bars.attr("x", function (d, i) {
        return i * (chartInnerWidth / n) + leftPadding;
    })
        //size/resize bars
        .attr("height", function (d, i) {
            return 595 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function (d, i) {
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        //color/recolor bars
        .style("fill", function (d) {
            var value = d[expressed];
            if (value) {
                return colorScale(value);
            } else {
                return "#ccc";
            }
        });

    //at the bottom of updateChart()...add text to chart title
    var chartTitle = d3.select(".chartTitle")
        .text(expressed + " in Each Country");
}
//function to highlight enumeration units and bars
function highlight(props){
    //change stroke
    var selected = d3.selectAll("." + props.SOVEREIGNT)
        .style("stroke", "rgb(49, 235, 94)")
        .style("stroke-width", "2");
        setLabel(props)
};
function dehighlight(props){
    var selected = d3.selectAll("." + props.SOVEREIGNT)
        .style("stroke", function(){
            return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width")
        });

    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();

        var styleObject = JSON.parse(styleText);

        return styleObject[styleName];
    };
    // remove info label
    d3.select(".infolabel")
    .remove();
};
//function to create dynamic label
function setLabel(props){
    console.log(props)
    //label content
    var labelAttribute = "<h1>" + props[expressed] +
        "</h1><b>" + expressed + "</b>";

    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.SOVEREIGNT+ "_label")
        .html(labelAttribute);
// creates country name on label
    var countryName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.SOVEREIGNT);
};

function moveLabel(){
    //get width of label
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;
     //use coordinates of mousemove event to set label coordinates
     var x1 = event.clientX + 10,
     y1 = event.clientY - 75,
     x2 = event.clientX - labelWidth - 10,
     y2 = event.clientY + 25;

 //horizontal label coordinate, testing for overflow
 var x = event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
 //vertical label coordinate, testing for overflow
 var y = event.clientY < 75 ? y2 : y1; 

    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};

function makeLegend(color) {
    var width = 300,
        height = 300;
        topBottomPadding = 5;
        var left = document.querySelector('.map').getBoundingClientRect().left + 10,
            bottom = document.querySelector('.map').getBoundingClientRect().bottom + 10;
    var svg = d3.select("body")
        .append("svg")
        .attr("class", "legend")
        .attr("width", width)
        .attr("height", height)
        .style("float", 'left')
        .style("position","absolute")
        .style("left", left, "px")
        .style("top", bottom, "px")
    var svg = d3.select(".legend").remove();
   
        var legend = svg.selectAll('g.legendEntry')
        .data(color.range().reverse())
        .enter()
        .append('g').attr('class', 'legendEntry')
        .style("float", 'left');
    legend
        .append('rect')
        .style("float", 'left')
        .attr("x", width - 200)
        .attr("y", function (d, i) {
            return i * 20;
        })
        .attr("width", 15)
        .attr("height", 15)
        .style("stroke", "black")
        .style("stroke-width", 1)
        .style("fill", function (d) { return d; });
    //the data objects are the fill colors
    legend
        .append('text')
        .attr("x", width - 175) //leave 5 pixel space after the <rect>
        .attr("y", function (d, i) {
            return i * 20;
        })
        .attr("dy", "0.8em") //place text one line *below* the x,y point
        .text(function (d, i) {
            var extent = color.invertExtent(d);
            //extent will be a two-element array, format it however you want:
            var format = d3.format("0.2f");
            return format(+extent[0]) + " - " + format(+extent[1]);
        })
}

         
})()