
//initialize function called when the script loads
function initialize(){
    cities();
};

//function to create a table with cities and their populations
function cities(){
    //define two arrays for cities and population
    var cityPop = [
        { 
            city: 'Madison',
            population: 233209
        },
        {
            city: 'Milwaukee',
            population: 594833
        },
        {
            city: 'Green Bay',
            population: 104057
        },
        {
            city: 'Superior',
            population: 27244
        }
    ];
    //create the table element
    var table = document.createElement("table");

    //create a header row
    var headerRow = document.createElement("tr");

    //add the "City" and "Population" columns to the header row
    headerRow.insertAdjacentHTML("beforeend","<th>City</th><th>Population</th>")

    //add the row to the table
    table.appendChild(headerRow);

    //loop to add a new row for each city
    for(var i = 0; i < cityPop.length; i++){
        //assign longer html strings to a variable
        var rowHtml = "<tr><td>" + cityPop[i].city + "</td><td>" + cityPop[i].population + "</td></tr>";
        //add the row's html string to the table
        table.insertAdjacentHTML('beforeend',rowHtml);
    }
 // add table element to the div
        document.querySelector("#mydiv").appendChild(table);
        addColumns(cityPop);
        addEvents();
    
// create a city population function
    function addColumns(cityPop){
        var rows = document.querySelectorAll("tr")
        document.querySelectorAll("tr").forEach(function(row,i){
      
            if (i == 0){
    
                newHeader = document.createElement('th');
			    newHeader.innerHTML = 'City Size';
                //Bug here, must use appendChild notation because it is appending the function
                row.appendChild(newHeader);
            } else {
    
                var citySize;
    
                if (cityPop[i-1].population < 100000){
                    citySize = 'Small';
    // Bug here, must capetalize S in citySize or else all will appear as medium
                } else if (cityPop[i-1].population < 500000){
                    citySize = 'Medium';
    
                } else {
                    citySize = 'Large';
                };
    //Bug here, city size is a new variable in the function cityPop so var notation must be used 
     // using the notation used to add thw city and population rows from the origional function          
        var newRow = document.createElement("tr");
        // must use .InnerHTML to connect to webpage, copying notation used to make the city size row header appear
        newRow.innerHTML = citySize
        // must appendChild to append it to webpage
        row.appendChild(newRow)
            };
        });
    };  

}

// creating a function that makes the rows hilight in a random color when hovered over
function addEvents(){

 //the event mouseover allows the hilight effect to take place when we hover over the item table
	document.querySelector("table").addEventListener("mouseover", function(){
	// creating the random color variable in our random color function
        var color = "rgb(";
		//generate random color
		for (var i=0; i<3; i++){
// random variable to select color upon each hover over
			var random = Math.round(Math.random() * 255);
			color += random;

			if (i<2){
				color += ",";
			} else {
				color += ")";
			};
		}
		// bug here, error saying table not defined. We call on table when we are adding the color so it must be defined 
        table = document.querySelector("table");
        //style table with the random style
		table.style.color = color;
	}); 

		// this line of code not needed because we defined table above 
        //(document.querySelector("table").color = color;)
	
// this creates a function that will notify the user upon clicking our city population table 
	function clickme(){
// sends alert to user to show that the element is indeed clickable
		alert('Hey, you clicked me!');
	};
//  the event listener allows the click event to happen when hovering over the table
	document.querySelector("table").addEventListener("click", clickme)
};
// this executes the script as soon as the DOM is prepared, making loading time faster
document.addEventListener('DOMContentLoaded',initialize)