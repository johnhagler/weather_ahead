ForecastIO.prototype = Object.create(ForecastIO.prototype);
ForecastIO.prototype.constructor = ForecastIO;

function ForecastIO(result) {
	this.data = result.currently;
}

ForecastIO.get = function(obj) {
	var call;
	try {

		if (!obj.latitude) {
			throw 'Latitude must be defined';
		}
		if (!obj.longitude) {
			throw 'Longitude must be defined'
		}

	    
		var uri = "https://api.forecast.io/forecast/e127ab25b695cae535abb09d1652cbc3/" +
					 obj.latitude + "," + obj.longitude + "," + obj.time + '?exclude=minutely,hourly,daily,flags,alerts';
	    return $.ajax({
	        url: uri,
	        dataType: 'jsonp'
	    });

	} catch (e) {
		console.error(e);
	}
	
	return call;
}

ForecastIO.prototype.getWind = function() {
	if (this.data.windSpeed && Math.round(this.data.windSpeed) > 0) {
		var speed = Math.round(this.data.windSpeed),
			direction = '';

		if (this.data.windBearing) {
			var index = (Math.round(this.data.windBearing/45)*45)/45;
			var cardinals = ['N','NE','E','SE','S','SW','W','NW','N'];
			var direction = cardinals[index];
		}

		return speed + 'mph ' + direction;

	} else {
		return 'None';
	}
}


ForecastIO.prototype.getClouds = function() {
	if (this.data.cloudCover) {
		return Math.round(this.data.cloudCover * 100) + '%';
	} else {
		return '';
	}
}

ForecastIO.prototype.getTemperature = function() {
	if (this.data.temperature) {
		if (celcius) {
			var temp = this.data.temperature;
			temp = (temp - 32) * (5/9);
		}
		return Math.round(temp) + '°';
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
		accumulation = '';

	if (this.data.precipProbability) {
		probability = Math.round(this.data.precipProbability*100) + '%';
	}
	if (this.data.precipType) {
		type = this.data.precipType;
	}
	if (this.data.accumulation) {
		accumulation = this.data.accumulation + ' in';
	}

	if (this.data.precipProbability == 0) {
		return 'None';
	} else {
		return [probability,type,accumulation].join(' ');	
	}

	
}

ForecastIO.prototype.getTime = function() {
	return moment(this.data.time * 1000).format('ddd, M/D h:mm a');
};

ForecastIO.prototype.icon = function() {
	return this.icons[this.data.icon];
};

ForecastIO.prototype.icons = {
	'day-sunny': 'wi-forecast-io-clear-day',
	'clear-night': 'wi-forecast-io-clear-night',
	'rain': 'wi-forecast-io-rain',
	'snow': 'wi-forecast-io-snow',
	'sleet': 'wi-forecast-io-sleet',
	'strong-wind': 'wi-forecast-io-wind',
	'fog': 'wi-forecast-io-fog',
	'cloudy': 'wi-forecast-io-cloudy',
	'day-cloudy': 'wi-forecast-io-partly-cloudy-day',
	'partly-cloudy-day': 'wi-forecast-io-partly-cloudy-day',
	'night-cloudy': 'wi-forecast-io-partly-cloudy-night',
	'partly-cloudy-night': 'wi-forecast-io-partly-cloudy-night',
	'hail': 'wi-forecast-io-hail',
	'thunderstorm': 'wi-forecast-io-thunderstorm',
	'tornado': 'wi-forecast-io-tornado: tornado'
};
