Route.prototype = Object.create(Route.prototype);
Route.prototype.constructor = Route;

function Route(origin, destination, waypoints, points) {
	this.origin = origin || '';
	this.destination = destination || '';
    this.waypoints = waypoints || [];
    this.points = points || [];
	this.directions;

}

Route.prototype.calculateTotalRouteDistance = function() {
    let totalRouteDistance = 0;
    for (const leg of this.directions.legs) {
        totalRouteDistance += leg.distance.value;
    }
    return totalRouteDistance;
}

Route.prototype.calculateDistanceInterval = function() {
    return Math.min(this.calculateTotalRouteDistance()/20, 5000);
}

Route.prototype.getTotalDurationText = function() {
    let totalDuration = this.points.slice(-1)[0].duration;
    var days = moment.duration(totalDuration * 1000).days();
	var hours = moment.duration(totalDuration * 1000).hours();
	var minutes = moment.duration(totalDuration * 1000).minutes();
    var duration_string = 
        (days == 0 ? '' : days + ' day' ) + (days > 1 ? 's ' : ' ') +
	    (hours == 0 ? '' : hours + ' hr ' ) + 
	    (minutes == 0 ? '' : minutes + ' min');
	return duration_string;
}

Route.prototype.getTotalDistanceText = function() {
    let totalRouteDistance = 0;
    for (const leg of this.directions.legs) {
        totalRouteDistance += leg.distance.value;
    }
    var totalDistance = Math.round(totalRouteDistance / 1609.34 * 10) / 10 + ' mi';
    if (km) {
        totalDistance = Math.round(totalRouteDistance / 1000 * 10) / 10 + ' km';
    }
    return totalDistance;
}

Route.prototype.extractIntervalPoints = function() {

    var lat_lngA, 
        lat_lngB,
        points = [],
        elapsedDuration = 0,
        distanceSum = 0,
        distanceInterval = this.calculateDistanceInterval(),
        distanceIntervalSum = 0,
        totalRouteDistance = this.calculateTotalRouteDistance();
        

    lat_lngA = this.directions.legs[0].steps[0].lat_lngs[0];
    
    // get first data point
    points.push({
        lat: lat_lngA.lat(),
        lng: lat_lngA.lng(),
        duration: 0,
        distance: 0
    });

    for (const leg of this.directions.legs) {

        // console.log('leg start');
        // if (i > 1) {
        //     duration_sum += 2*60*60;
        // }

        for (const step of leg.steps) {
            var distance = step.distance.value;
            var duration = step.duration.value;

            var speed = 0;
            if (duration !== 0) {
                speed = (distance / duration) * flex;
            }

            for (var lat_lngB of step.lat_lngs) {
                
                var coordDistance = google.maps.geometry.spherical.computeDistanceBetween(lat_lngA, lat_lngB);
                distanceIntervalSum += coordDistance;
                distanceSum += coordDistance;
                
                var coordDuration = Math.round(coordDistance / speed);
                elapsedDuration += coordDuration;
                

                if (distanceIntervalSum > distanceInterval) {

                	// if the last interval point is within a half interval of the end of the route, don't add it
                	if ((totalRouteDistance - distanceSum) > distanceInterval / 2) {

	                    points.push({
	                        lat: lat_lngB.lat(),
	                        lng: lat_lngB.lng(),
	                        duration: elapsedDuration,
	                        distance: distanceSum
	                    });

	                    distanceIntervalSum = 0;
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
        duration: elapsedDuration,
        distance: distanceSum
    });

    this.points = points;

}