Route.prototype = Object.create(Route.prototype);
Route.prototype.constructor = Route;

function Route(origin, destination, waypoints) {
	this.origin = origin || '';
	this.destination = destination || '';
	this.waypoints = waypoints || [];

	this.directions;
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

