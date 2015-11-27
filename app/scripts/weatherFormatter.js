ForecastIO.prototype = Object.create(ForecastIO.prototype);
ForecastIO.prototype.constructor = ForecastIO;

function ForecastIO(result) {
	this.data = result.currently;
}



ForecastIO.prototype.getWind = function() {
	if (this.data.windSpeed) {
		var speed = Math.round(this.data.windSpeed),
			direction = '';

		if (this.data.windBearing) {
			var index = (Math.round(this.data.windBearing/45)*45)/45;
			var cardinals = ['N','NE','E','SE','S','SW','W','NW','N'];
			var direction = cardinals[index];
		}

		return speed + 'mph ' + direction;

	} else {
		return '';
	}
}


ForecastIO.prototype.getClouds = function() {
	if (this.data.temperature) {
		return Math.round(this.data.cloudCover * 100) + '%';
	} else {
		return '';
	}
}

ForecastIO.prototype.getTemperature = function() {
	if (this.data.temperature) {
		return Math.round(this.data.temperature) + '°';
	} else {
		return '';
	}
}

ForecastIO.prototype.getConditions = function() {
	if (this.data.summary) {
		return this.data.summary;
	} else {
		return '';
	}
}

ForecastIO.prototype.getPrecipitation = function() {
	
	var probability = '',
		type = '',
		intensity = '',
		accumulation = '';

	if (this.data.precipProbability) {
		probability = Math.round(this.data.precipProbability*100) + '%';
	}
	if (this.data.precipType) {
		type = this.data.precipType;
	}
	if (this.data.intensity) {
		intensity = this.data.precipIntensity + ' in/hr';
	}
	if (this.data.accumulation) {
		accumulation = this.data.accumulation + ' in';
	}

	if (this.data.precipProbability == 0) {
		return 'None';
	} else {
		return [probability,type,intensity,accumulation].join(' ');	
	}

	
}
