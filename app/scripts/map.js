
var map,
    geocoder,
    autocomplete,
    directionsService,
    directionsDisplay,
    weatherMarkers = [],
    routePoints = [];

(function(){
	initMap	();
});

function initMap() {
	geocoder = new google.maps.Geocoder;
	navigator.geolocation.getCurrentPosition(showMap);
    
    directionsService = new google.maps.DirectionsService; 
    directionsDisplay = new google.maps.DirectionsRenderer({
        draggable: true,
        map: map
    });

    directionsDisplay.addListener('directions_changed',directionsChanged);


}

function showMap(position) {
	var lat_lng = {
		lat: position.coords.latitude,
		lng: position.coords.longitude
		}

	geocoder.geocode({
        'location': lat_lng
    }, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
            if (results) {
                
            	$('#start').val(LocationUtil.getLocation(results));

				map = new google.maps.Map(document.getElementById('map'), {
				    center: lat_lng,
				    zoom: 8
		  		});	

			    directionsDisplay = new google.maps.DirectionsRenderer({
			        draggable: true,
			        map: map,
        			suppressMarkers: true,
        			suppressPolylines: true
			    });

			    directionsDisplay.addListener('directions_changed',directionsChanged);

		  		var start = document.getElementById('start');
				var autocomplete_start = new google.maps.places.Autocomplete(start);
			  	autocomplete_start.bindTo('bounds', map);

			  	var end = document.getElementById('end');
				var autocomplete_end = new google.maps.places.Autocomplete(end);
			  	autocomplete_end.bindTo('bounds', map);

            } else {
                window.alert('No results found for orign');
            }
        } else {
            window.alert('Geocoder failed due to: ' + status);
        }
    });

	
}

function addAutocomplete(input) {
	var autocomplete = new google.maps.places.Autocomplete(input);
  	autocomplete.bindTo('bounds', map);	
}


function getDirections() {

}


function getIntervalPoints(interval_mi) {

    var route = directionsDisplay.getDirections().routes[0];

    var lat_lngA, lat_lngB;

    var points = [],
        duration_sum = 0,
        duration_interval = 0,
        distance_sum = 0,
        distance_interval = 1609.34 * interval_mi,      // 10 mi
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

                    points.push({
                        lat: lat_lngB.lat(),
                        lng: lat_lngB.lng(),
                        duration: duration_sum,
                        distance: distance_sum
                    });

                    distance_interval_sum = 0;
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

function displayRoute(origin, destination, waypoints) {
    directionsService = new google.maps.DirectionsService;
    directionsService.route({
        origin: origin,
		destination: destination,
		waypoints: waypoints,
		travelMode: google.maps.TravelMode.DRIVING,
		avoidTolls: true
	}, function(response, status) {
    	if (status === google.maps.DirectionsStatus.OK) {
			directionsDisplay.setDirections(response);
		} else {
			alert('Could not display directions due to: ' + status);
		}
	});
}

function directionsChanged() {

	computeTotals(directionsDisplay.getDirections());

	clearWeatherMarkers();

	var points = getIntervalPoints(5);

	var calls = [];
	for (var i=0; i<points.length; i++) {
		var point = points[i];
		var call = getWeatherData(point);
		calls.push(call);
	}

	Promise.each(calls, function(result, i) {
		// show weather marker every 20 points or last point
		if (i % 4 == 0 || i + 1 == points.length) {
			addWeatherMarker(result);
		}
		points[i].temperature = result.currently.temperature;
	}).then(function(){
		drawRainbowRoad(points);	
	});
	
	

}


function computeTotals(result) {
    var total_distance = 0,
        total_duration = 0;
	    
	var myroute = result.routes[0];
	for (var i = 0; i < myroute.legs.length; i++) {
		total_distance += myroute.legs[i].distance.value;
		total_duration += myroute.legs[i].duration.value;
	}
	total_distance = Math.round(total_distance / 1609.34 * 10) / 10;
	var hours = moment.duration(total_duration*1000).hours();
	var minutes = moment.duration(total_duration*1000).minutes();
	var duration_string = 
	    (hours == 0 ? '' : hours + ' hr ' ) + 
	    (minutes == 0 ? '' : minutes + ' min');

	$('#total-distance').html(total_distance + ' mi');
	$('#total-duration').html(duration_string);
	$('#totals').show();
}

function clearWeatherMarkers() {
	weatherMarkers.forEach(function(label){
		label.setMap(null);
	});
}

function getWeatherData(point) {
    
    var lat = point.lat;
    var lng = point.lng;
    var time = moment(document.getElementById('time').value).add(point.duration, 'seconds').format();
    
    var uri = "https://api.forecast.io/forecast/e127ab25b695cae535abb09d1652cbc3/" + lat + "," + lng + "," + time + '?exclude=minutely,hourly,daily,alerts,flags';
    return $.ajax({
        url: uri,
        dataType: 'jsonp'
    });
    
}

function addWeatherMarker(result) {
	var icon = 'images/transparent.gif';
	var raindrop = {
		path: 'M 63.233512,197.64699 C 51.539282,195.73253 41.869592,191.77659 33.069014,185.30647 28.968213,182.2916 21.795321,175.04541 18.893878,170.9865 13.014515,162.76172 8.8848447,153.0149 7.2099095,143.41012 6.4644196,139.13517 6.4643423,127.39778 7.2097756,123.50175 8.5032835,116.74119 13.098292,104.23622 18.400759,93.046309 27.682697,73.458451 39.568863,53.115966 57.551589,26.041903 69.682998,7.7773203 71.971485,4.6272207 72.681024,5.2160987 74.058515,6.3593035 90.636499,30.968103 98.310514,43.261166 119.28103,76.854031 131.9908,102.4782 136.85268,120.96601 c 0.98919,3.76151 1.51026,11.6736 1.11465,16.92524 -2.23266,29.63802 -25.31086,54.65404 -54.828451,59.43233 -5.032132,0.81461 -15.833056,0.99007 -19.905367,0.32341 z m -5.061617,-24.10598 c -7.361078,-9.8925 -12.918868,-18.96349 -17.664236,-28.83018 -6.508771,-13.5332 -9.220161,-22.69711 -10.981137,-37.11393 -0.277355,-2.27069 -0.277355,-2.27069 -1.512832,1.51377 -4.92574,15.08831 -3.837224,28.92815 3.259497,41.44266 4.8903,8.62366 12.385239,16.49294 21.717144,22.80181 3.604678,2.43695 8.167886,5.18251 8.631886,5.19359 0.154508,0.004 -1.398132,-2.2498 -3.450322,-5.00772 z',
		fillColor: '#5BC0DE',
	    fillOpacity: 0.8,
	    scale: .03,
	    strokeColor: '#337AB7',
	    strokeWeight: 1,
	    anchor: new google.maps.Point(0, 0)
	};

	var precipIconScale = 0,
		precipIntensity = result.currently.precipIntensity;

	if (precipIntensity >= .002 && precipIntensity < .017) {
		precipIconScale = (0*.01875) + .05;
	} else if (precipIntensity >= .017 && precipIntensity < .1) {
		precipIconScale = (1*.01875) + .05;
	} else if (precipIntensity >= .1 && precipIntensity < .4) {	
		precipIconScale = (2*.01875) + .05;
	} else if (precipIntensity >= .4) {
		precipIconScale = (3*.01875) + .05;
	}

	if (result.currently.precipType == 'rain') {
		icon = raindrop;
		icon.scale = precipIconScale;
		
		console.log(result.currently);
	}

	var current_temp = Math.round(result.currently.temperature );

	
	var lat_lng = {lat: result.latitude, lng: result.longitude};
	var marker = new MarkerWithLabel({
       position: lat_lng,
       map: map,
       icon: icon,
       labelContent: current_temp + '°',
       labelAnchor: new google.maps.Point(0, 28),
       labelClass: "temperature-label", // the CSS class for the label
       labelStyle: {opacity: 0.75},
     });
	addInfoWindow(result, marker);
	weatherMarkers.push(marker);
	
}

function addInfoWindow(result, marker) {
	var f = new ForecastIO(result);

	var s = Mustache.render($('#info-window-template').html(), f);

	var str = 'Temp: ' + f.getTemperature() + '<br>' + 
			'Precip: ' + f.getPrecipitation() + '<br>' + 
			'Conditions: ' + f.getConditions() + '<br>' + 
			'Wind: ' + f.getWind() + '<br>' + 
			'Cloud Cover: ' + f.getClouds() + '<br>' + 
			f.getTime();

	var infowindow = new google.maps.InfoWindow({
		content: s
	});
	marker.addListener('click', function() {
		infowindow.open(map, marker);
	});
}

function drawRainbowRoad(points) {

	routePoints.forEach(function(point){
		point.setMap(null);
	});

	var lat_lngA = {lat: points[0].lat, lng: points[0].lng};

	for (var i=1; i<points.length; i++) {
		var point = points[i];
		var lat_lngB = {lat: point.lat, lng: point.lng};
		var color = getHSLA(point.temperature);
		var path =  new google.maps.Polyline({
		    path: [lat_lngA,lat_lngB],
		    geodesic: true,
		    strokeColor: color,
		    strokeWeight: 6,
		    map: map
		  });
		routePoints.push(path);
		lat_lngA = lat_lngB;
	};
	

}


function getHSLA(t) {

    var h = 0,
        s = 100,
        l = 50,
        a = 1;
    
    
    if (t < 10) {
    	h = 300;
        s = 57;
        l = 50 + ((10 - t) * 2.5);
        
    } else if (t <= 100) {
    	h = 150 * Math.cos(t / 30) + 160;
        // if temp is between 10 and 40, modify saturation
        if (t >= 10 && t <=40) {
            s = (0.105 * (Math.pow(t,2))) - (3.87 * t) + 85;
        }
    } else {
        l = 50 + ((100 - t) * 1.5);
    }
    
    h = Math.round(h);
    s = Math.round(s);
    l = Math.round(l);

    return 'hsla(' + h + ',' + s + '%,' + l + '%,1)';

}


