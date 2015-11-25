
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
		path: 'M406.269,10.052l-232.65,405.741c-48.889,85.779-52.665,194.85,0,286.697c79.169,138.07,255.277,185.82,393.348,106.65 c138.071-79.169,185.821-255.276,106.651-393.348L440.968,10.052C433.283-3.351,413.953-3.351,406.269,10.052z',
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
		precipIconScale = .020;
	} else if (precipIntensity >= .017 && precipIntensity < .1) {
		precipIconScale = .023;
	} else if (precipIntensity >= .1 && precipIntensity < .4) {	
		precipIconScale = .026;
	} else if (precipIntensity >= .4) {
		precipIconScale = .030;
	}

	if (result.currently.precipType == 'rain') {
		icon = raindrop;
		icon.scale = precipIconScale;
		
		console.log(result.currently);
	}

	var current_temp = Math.round(result.currently.temperature * 10)/10;

	
	var lat_lng = {lat: result.latitude, lng: result.longitude};
	var marker = new MarkerWithLabel({
       position: lat_lng,
       map: map,
       icon: icon,
       labelContent: current_temp + '° ' + result.currently.summary,
       labelAnchor: new google.maps.Point(0, 28),
       labelClass: "temperature-label", // the CSS class for the label
       labelStyle: {opacity: 0.75},
     });
	weatherMarkers.push(marker);
	
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
