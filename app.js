var express = require('express');
var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/ihme');

var app = express();

app.use(express.static(__dirname + '/public')); // index.html etc

// gets field names for dropdowns
app.get('/options/:field_name', function(req, res) {
	var obesity = db.get("obesity");
	obesity.distinct(req.params.field_name, function(e, docs){
		res.json(docs);
	})
})

// visualization data
app.get('/data',function(req,res){
	var location_name = req.query.location_name || "United States";
	var location_array =["Developed", "Developing", "Global"]  // for comparisions
	location_array.push(location_name)

	if (req.query.compare) {
		// for line chart
		var query = {
			location_name: {$in: location_array}
		}	
	} else {
		// for heatmap
		var query = {location_name: req.query.location_name}
	}
	
	var fields = ["sex", "metric"]
	fields.forEach(function(d,i){
		if (req.query[d]) {
			query[d] = req.query[d]
		}
	})
	if (req.query.year) {
			query.year = parseInt(req.query.year);
	}
	if (req.query.age_group) {
		// hack to ensure adult group
			query.age_group = req.query.age_group.replace("REPLACE", "+")
	}

  var obesity = db.get("obesity");
  obesity.find(query, function(e,docs){
    res.json(docs);
  })
});

app.listen(3000, function () {
  console.log('Listening on port 3000!');
});