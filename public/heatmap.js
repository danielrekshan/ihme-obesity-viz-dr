// set up svg
var margin2 = {top: 50, right: 5, bottom: 25, left: 25},
  ww2 = document.getElementById("heatmap").clientWidth,
  width2 = ww2 - margin2.left - margin2.right,
  height2 =  400  - margin2.top - margin2.bottom;

var cellWidth = ((width2 - margin2.left - margin2.right) / 19)-5;
var cellHeight = ((height2 - margin2.top - margin2.bottom) / 6)-10;

var svg2 = d3.select("#heatmap").append("svg")
  .attr("width", width2 )
  .attr("height", height2 )

// set up xy scales
var tableX = d3.scale.ordinal()
  .domain(["2 to 4 yrs","2 to 19 yrs, age-standardized","5 to 9 yrs",
    "10 to 14 yrs","15 to 19 yrs","20 to 24 yrs","20+ yrs, age-standardized",
    "25 to 29 yrs","30 to 34 yrs","35 to 39 yrs","40 to 44 yrs","45 to 49 yrs",
    "50 to 54 yrs","55 to 59 yrs","60 to 64 yrs","65 to 69 yrs","70 to 74 yrs",
    "75 to 79 yrs","80+ yrs"])
  .rangeBands([margin2.left, width2 - margin2.left - margin2.right]);

var tableY = d3.scale.ordinal()
  .domain(["both obese", "both overweight", "male obese", 
    "male overweight", "female obese", "female overweight"])
  .rangeBands([margin2.top, height2 - margin2.top - margin2.bottom])
var yAxisTable = d3.svg.axis()
  .scale(tableY)
  .orient("bottom");

// set up color scale
var colorLow = 'blue', colorMed = 'yellow', colorHigh = 'red';
var colorScale = d3.scale.linear()
     .domain([0,0.2, 1])
     .range([colorLow, colorMed, colorHigh]);

// render table
function drawTable(d) {
  //set up axes
  var yAxisTable = d3.svg.axis()
    .scale(tableY)
    .orient("left");

  var xAxisTable = d3.svg.axis()
    .scale(tableX)
    .orient("top");
  
  // if no axes exists, create one
  if (svg.selectAll(".x.label")[0].length < 1 ){
      svg2.append("g")
        .append("text")
          .attr("class", "x label")
          .attr("text-anchor", "middle")  
          .attr("x", width2/2)
          .attr("y", margin2.top/2)
          .text("Age, Gender, and Obesity Breakdown for Selected Year & Location");
  }

  if (svg.selectAll(".y.axis")[0].length < 1 ){   
    svg2.append("g")
      .attr("class", "y axis")
      .call(yAxisTable)
        .selectAll("text")
        .attr('x', margin2.left)
  }

  // get the data
  var url = "data?location_name=" + d.location_name +
    "&year=" + d.year 
  d3.json(url, function (data) {
    var cells = svg2.selectAll(".cell").data(data)
    var cellsEnter = cells
      .enter().append('g')

    // build the cells
    cellsEnter.append("svg:rect")
      .attr("y", function(d) { 
        return tableY(d.sex + " " +d.metric) })
      .attr("x", function(d) { return tableX(d.age_group)})
      .attr("width", function(d) { return cellWidth; })
      .attr("height", function(d) { return cellHeight; })
      .style("fill", function(d) { return colorScale(d.mean) })

      .on("mouseover", function(d){
        tooltipDiv.transition()    
            .duration(500)    
            .style("opacity", .9);    
        tooltipDiv.html(
          "<strong>Location: </strong>" + d.location_name + "<br/>" +
          "<strong>Year: </strong>" + d.year + "<br/>" +
          "<strong>Age Group: </strong>" + d.age_group + "<br/>" +
          "<strong>Sex: </strong>" + d.sex + "<br/>" +
          "<strong>Metric: </strong>" + d.metric + "<br/>" +
          "<strong>Upper: </strong>" + d.upper + "<br/>" +
          "<strong>Mean: </strong>" + d.mean + "<br/>" +
          "<strong>Lower: </strong>" + d.lower + "<br/>" 
          )  
            .style("left", (d3.event.pageX) + 10 +"px")   
            .style("top", (d3.event.pageY - 28) + "px");  
      }).on("mouseout", function(d) {
        tooltipDiv.transition()    
          .duration(500)    
          .style("opacity", 0);         
      });

      cells.exit().remove();
  })
}
