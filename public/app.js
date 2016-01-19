 // if you use location name as selector then you need to strip whitespace!
      function changeFunction() {
        var location_name = d3.select("#location_name").node().value;
        render(location_name)
      }

        function assignColor(key) {
         var colors = d3.scale.ordinal().domain(["Other", "Developed", "Developing", "Global"]).range(["orange", "blue", "green", "red"]);
        if (!key.match(/Devel|Global/)) key = "Other"
        return colors(key)
      }

      function toggleHighlight(location_name) {
        var legendId = "#" + location_name.replace(/ /g,'') + "-legend"
        var lineId = "#" + location_name.replace(/ /g,'') + "-line"
        var legend = d3.select(legendId)
        var line = d3.select(lineId)
        legend.classed("legendHighlight", !legend.classed("legendHighlight"));
        line.classed("lineHighlight", !line.classed("lineHighlight"));
      }


      var margin = {top: 20, right: 200, bottom: 30, left: 50},
      ww = document.getElementById("chart").clientWidth,
        width = ww - margin.left - margin.right,
        height =  400  - margin.top - margin.bottom;

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
          .tickFormat(d3.format("%"))
          .orient("left");

      var svg = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      var line = d3.svg.line()
        .x(function(d) { return x(d.year)})
        .y(function(d) { return y(d.mean)});

      var menu = d3.select("body").append("div").attr("id", "menu");
      var filters = d3.select("body"). append('g')
      var dropdown = d3.select("#menu").append("select").attr("id", "location_name")
      var location_name = d3.select("#location_name").on("change", changeFunction);

      d3.json("./options/location_name", function(data) {
        dropdown
          .selectAll("option")
          .data(data)
          .enter()
            .append("option")
            .text(function(d){return d}).on("change", changeFunction())
      })

      var locations;
      var tooltipDiv = d3.select("body").append("div") .attr("class", "tooltip")       
          .style("opacity", 0);
      function render (location_name) {
        
        

        d3.json("./data?location_name=" + location_name, function (data) {
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
            // if no axis exists, create one, otherwise update it
          if (svg.selectAll(".x.axis")[0].length < 1 ){
            svg.append("g")
                .attr("class","x axis")
                 .attr("transform", "translate(0," + (height) + ")")
                .call(xAxis);
          } else {
            svg.selectAll(".x.axis") .attr("transform", "translate(0," + (height) + ")").transition().duration(1500).call(xAxis);
          }



          
          var lines = svg.selectAll(".line").data(locations).attr("class","line");

          // transition from previous paths to new paths
          lines.transition().duration(1500)
            .attr("d",function(d){return line(d.values) })
            .attr("id", function(d) { return d.key.replace(/ /g,'') + "-line" })
            .style("stroke", function(d) {
              return assignColor(d.key) 
            })
            

          // enter any new data
          lines.enter()
            .append("path")
            .attr("class","line")
            .attr("id", function(d) { return d.key.replace(/ /g,'') + "-line" })
            .attr("d",function(d){return line(d.values) })
            .style("stroke", function(d){
              return assignColor(d.key) 
            })
            .on("mouseover", function(d){            
              toggleHighlight(d.key)
            })
            .on("mouseout", function(d){
              toggleHighlight(d.key)
            });

          

          // lines.append("text")
          //   .attr("class", "label")
          //   .datum(function(d){ return d })
          //   .attr("transform", function(d) {
          //     var year = d.values[d.values.length-1].year
          //     var mean = d.values[d.values.length-1].mean
          //     return "translate(" + x(year) + "," + y(mean) + ")"; })
          //   .attr("x", -100)
          //   .attr("dy", ".35em")
          //   .text(function(d) { return d.key })
            
          // exit
          lines.exit()
            .remove();


          svg.selectAll(".legend").remove();

          var legend = svg.selectAll('.legend')
          .data(locations)

          legend.transition().duration(1500)
            .attr("d", locations)
          
          function lineSelector(d) {
            return "#" + d.key + "-line"
          }

    
          var legendEnter=legend
              .enter()
              .append('g')
              .attr("class", "legend")  
              .attr('id',function(d){ return d.key.replace(/ /g,'') + "-legend"; })
              .on("mouseover", function(d){
                console.log(d)
                toggleHighlight(d)
              })
              .on("mouseout", function(d){
                toggleHighlight(d)
              })

          legend.exit().remove();

          var legendscale= d3.scale.ordinal()
            .domain(locations.length)
            .range([0,30,60,90]);

          legendEnter.append('circle')
            .attr('cx', width +20)
            .attr('cy', function(d, i){return legendscale(i);})
            .attr('r', 7)
            .style('fill', function(d) { 
                console.log("LEGEND", d)
                return assignColor(d.key);
            });

        legendEnter.append('text')
          .attr('x', width+35)
          .attr('y', function(d,i){return legendscale(i);})
          .text(function(d){ return d.key; });
                    
  //add the legend text
    legendEnter.append('text')
        .attr('x', width+35)
        .attr('y', function(d){return legendscale(d.values[d.values.length-1].value);})
        .text(function(d){ return d.name; });
          var dots = svg.selectAll(".dot").attr("class", "dot")
            .data(data)
              .enter().append("circle")
                .attr("r", 3.5)
                .attr("cx", function(d) { return x(d.year); })
                .attr("cy", function(d) { return y(d.mean); })
                .on("mouseover", function(d) {
                  console.log(d)
                  toggleHighlight(d.location_name)
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
                      .style("left", (d3.event.pageX) + "px")   
                      .style("top", (d3.event.pageY - 28) + "px");  
                }).on("mouseout", function(d) {
                  tooltipDiv.transition()    
                    .duration(500)    
                    .style("opacity", 0); 
                  toggleHighlight(d.location_name)
                });;
          

        })
      }
      

      
