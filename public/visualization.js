var lineChart = {
  // functions used throughout line chart viz
  changeFunction: function (){
    var options = {
      location_name: d3.select("#location_name").node().value,
      sex: d3.select("#sex").node().value,
      age_group: d3.select("#age_group").node().value,
      metric: d3.select("#metric").node().value
    };
    if (typeof(svg2) != "undefined") svg2.selectAll("g").remove();
    render(options);
  },
  assignColor: function(key) {
    var colors = d3.scale.ordinal()
      .domain(["Other", "Developed", "Developing", "Global"])
      .range(["orange", "blue", "green", "red"]);
    if (!key.match(/Devel|Global/)) key = "Other"
    return colors(key);
  },
  toggleHighlight: function(location_name) {
    var legendId = "#" + location_name.replace(/ /g,'') + "-legend",
      lineId = "#" + location_name.replace(/ /g,'') + "-line"
      legend = d3.select(legendId),
      line = d3.select(lineId);
    legend.classed("legendHighlight", !legend.classed("legendHighlight"));
    line.classed("lineHighlight", !line.classed("lineHighlight"));
  }
}

// Set up & populate data filter dropdowns
var menu = d3.select("body").append("div").attr("id", "menu").classed("hidden", true).html("<strong>FILTER: </strong>"),
  fields = ["location_name", "sex", "age_group", "metric"],
  loadedFields = 0,
  dropdowns = {};

fields.forEach(function(d,i){
  dropdowns[d] = d3.select("#menu").append("select").attr("id", d)
  d3.json("./options/"+d, function(data) {
    dropdowns[d]
      .selectAll("option")
      .data(data)
      .enter()
        .append("option")
        .text(function(d){return d})
    loadedFields += 1;
  })
})
d3.selectAll("select").on("change", lineChart.changeFunction);

// Set up SVG
var margin = {top: 20, right: 200, bottom: 30, left: 50},
  ww = document.getElementById("chart").clientWidth,
  width = ww - margin.left - margin.right,
  height =  400  - margin.top - margin.bottom;

var svg = d3.select("#chart").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Set up Axes
var x = d3.scale.linear()
    .range([0, width]);

var y = d3.scale.linear()
    .range([height, 0]);

var xAxis = d3.svg.axis()
    .scale(x)
    .tickFormat(d3.format("d"))
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .tickFormat(d3.format(".1%"))
    .orient("left");

// Define line function
var line = d3.svg.line()
  .x(function(d) { return x(d.year)})
  .y(function(d) { return y(d.mean)});


// Wait for the menu filters to load
function renderOnceLoaded(){
  if (loadedFields == 4) {
    document.getElementById("location_name").value = "United States";
    document.getElementById("sex").value = "both";
    document.getElementById("age_group").value = "20+ yrs, age-standardized";
    document.getElementById("metric").value = "obese";
    d3.select("#menu").classed("hidden", false);
    lineChart.changeFunction()
  } else {
    waitForLoading()
  }
}

function waitForLoading(){
  setTimeout(function(){ 
  renderOnceLoaded()
  }, 500);
}
renderOnceLoaded()

// render line chart
var locations,
  tooltipDiv = d3.select("body")
    .append("div")
    .attr("class", "tooltip")       
    .style("opacity", 0);

function render (options) {
  
  // Build url to get data, hack to replace '+', needs better sanitation
  var url = "data?location_name=" + options.location_name +
    "&sex=" + options.sex +
    "&age_group=" + options.age_group.replace("+", "REPLACE") +
    "&metric=" + options.metric +
    "&compare=true"

  d3.json(url, function (data) {
    svg.selectAll("circle").remove()
    locations = d3.nest()
      .key(function(d) {
        return d.location_name
      })
      .entries(data);
    
    x.domain(d3.extent(data, function(d) {return d.year}))
    y.domain(d3.extent(data, function(d) {return d.mean}))

    // if no axis exists, create one, otherwise update it
    if (svg.selectAll(".y.axis")[0].length < 1 ){
      svg.append("g")
          .attr("class","y axis")
          .call(yAxis);
    } else {
      svg.selectAll(".y.axis").transition().duration(1500).call(yAxis);
    }
      // if no x axis exists, create one
    if (svg.selectAll(".x.axis")[0].length < 1 ){
      svg.append("g")
          .attr("class","x axis")
           .attr("transform", "translate(0," + (height) + ")")
          .call(xAxis);
    }

    // Define line function
    var line = d3.svg.line()
      .x(function(d) { return x(d.year)})
      .y(function(d) { return y(d.mean)});

    var lines = svg.selectAll(".line").data(locations).attr("class","line");

    // transition from previous paths to new paths
    lines.transition().duration(1500)
      .attr("d",function(d){return line(d.values) })
      .attr("id", function(d) { return d.key.replace(/ /g,'') + "-line" })
      .style("stroke", function(d) {
        return lineChart.assignColor(d.key) 
      })
      
    // enter any new data
    lines.enter()
      .append("path")
      .attr("class","line")
      .attr("id", function(d) { return d.key.replace(/ /g,'') + "-line" })
      .attr("d",function(d){return line(d.values) })
      .style("stroke", function(d){
        return lineChart.assignColor(d.key) 
      })
      .on("mouseover", function(d){            
        lineChart.toggleHighlight(d.key)
      })
      .on("mouseout", function(d){
        lineChart.toggleHighlight(d.key)
      });

    // exit
    lines.exit()
      .remove();

    // update legend
    svg.selectAll(".legend").remove();

    var legend = svg.selectAll('.legend')
    .data(locations)

    legend.transition().duration(1500)
      .attr("d", locations)

    var legendEnter = legend
      .enter()
        .append('g')
        .attr("class", "legend")  
        .attr('id',function(d){ return d.key.replace(/ /g,'') + "-legend"; })
        .on("mouseover", function(d){
          lineChart.toggleHighlight(d.key)
        })
        .on("mouseout", function(d){
          lineChart.toggleHighlight(d.key)
        })

    legend.exit().remove();

    var legendscale = d3.scale.ordinal()
      .domain(locations.length)
      .range([0,30,60,90]);

    legendEnter.append('circle')
      .attr('cx', width +20)
      .attr('cy', function(d, i){return legendscale(i);})
      .attr('r', 7)
      .style('fill', function(d) { 
          return lineChart.assignColor(d.key);
      });

    legendEnter.append('text')
      .attr('x', width+35)
      .attr('y', function(d,i){return legendscale(i);})
      .text(function(d){ return d.key; });
              
    // add the legend text
    legendEnter.append('text')
      .attr('x', width+35)
      .attr('y', function(d){return legendscale(d.values[d.values.length-1].value);})
      .text(function(d){ return d.name; });

    // add dots to the lines
    var dots = svg.selectAll(".dot").attr("class", "dot")
      .data(data)
        .enter().append("circle")
          .attr("r", 3)
          .attr("cx", function(d) { return x(d.year); })
          .attr("cy", function(d) { return y(d.mean); })
          .on("mouseover", function(d) {
            lineChart.toggleHighlight(d.location_name)
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
            lineChart.toggleHighlight(d.location_name)
          })
          .on("click", function(d){
            console.log("click!", d)
            d3.selectAll(".selectedDot").classed("selectedDot", false).attr("r", 3.5)
            d3.select(this).classed("selectedDot", true).attr("r", 7)
            drawTable(d)
          });
  })
}