Route.prototype = Object.create(Route.prototype);
Route.prototype.constructor = Route;

function Route(origin, destination, waypoints) {
	this.origin = origin || '';
	this.destination = destination || '';
	this.waypoints = waypoints || [];

	this.directions;
	this.interval = 0;
	this.distance = 0;
	this.duration = 0;
	this.dataPoints = [];

	this.totalDistance = 0;
	this.totalDuration = 0;

}

Route.prototype.calculateTotals = function() {
	if (!this.directions) {
		throw 'directions must be set';
	}

	var totalDistance = 0,
	    totalDuration = 0;
	_.each(this.directions.legs,function(leg){
		totalDistance += leg.distance.value;
		totalDuration += leg.duration.value;
	});
	this.totalDistance = totalDistance;
	this.totalDuration = totalDuration;
	this.interval = Math.min(this.totalDistance/20, 5000);
}

Route.prototype.getTotalDuration = function() {
	var hours = moment.duration(this.totalDuration * 1000).hours();
	var minutes = moment.duration(this.totalDuration * 1000).minutes();
	var duration_string = 
	    (hours == 0 ? '' : hours + ' hr ' ) + 
	    (minutes == 0 ? '' : minutes + ' min');
	return duration_string;
}

Route.prototype.getTotalDistance = function() {
	return Math.round(this.totalDistance / 1609.34 * 10) / 10 + ' mi';
}

Route.prototype.extractIntervalPoints = function() {
	var route = this.directions;

    var lat_lngA, lat_lngB;

    var points = [],
        duration_sum = 0,
        duration_interval = 0,
        distance_sum = 0,
        distance_interval = this.interval,
        distance_interval_sum = 0;


    lat_lngA = route.legs[0].steps[0].lat_lngs[0];
    
    // get first data point
    points.push({
        lat: lat_lngA.lat(),
        lng: lat_lngA.lng(),
        duration: 0,
        distance: 0
    });

    for (var i = 0; i < route.legs.length; i++) {
        var leg = route.legs[i];

        for (var j = 0; j < leg.steps.length; j++) {
            var step = leg.steps[j];
            var distance = step.distance.value;
            var duration = step.duration.value;

            var speed = 0;
            if (duration !== 0) {
                speed = distance / duration;
            }



            for (var k = 0; k < step.lat_lngs.length; k++) {
                
                lat_lngB = step.lat_lngs[k];
                
                var coordDistance = google.maps.geometry.spherical.computeDistanceBetween(lat_lngA, lat_lngB);
                distance_interval_sum += coordDistance;
                distance_sum += coordDistance;
                
                var coordDuration = Math.round(coordDistance / speed);
                duration_sum += coordDuration;
                

                if (distance_interval_sum > distance_interval) {

                	// if the last interval point is within a half interval of the end of the route, don't add it
                	if ((this.totalDistance - distance_sum) > this.interval / 2) {

	                    points.push({
	                        lat: lat_lngB.lat(),
	                        lng: lat_lngB.lng(),
	                        duration: duration_sum,
	                        distance: distance_sum
	                    });

	                    distance_interval_sum = 0;
                	}
                }

                

                lat_lngA = lat_lngB;
            }

        }

    }

    // get last data point
    points.push({
        lat: lat_lngB.lat(),
        lng: lat_lngB.lng(),
        duration: duration_sum,
        distance: distance_sum
    });

    return points;
}