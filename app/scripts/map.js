
var map,
    geocoder,
    autocomplete,
    directionsService,
    directionsDisplay,
    weatherMarkers = [],
    routePoints = [],
    zIndex = 0,
    google,
    geocodedLocation;

(function(){
	initMap	();
});


function initMap() {
  
  adjustMapSize();
  zIndex = google.maps.Marker.MAX_ZINDEX;

  directionsService = new google.maps.DirectionsService; 
  geocoder = new google.maps.Geocoder;
  map = new google.maps.Map(document.getElementById('map'), {}); 

  directionsDisplay = new google.maps.DirectionsRenderer({
      map: map,
      suppressMarkers: true,
      suppressPolylines: true
  });

  directionsDisplay.addListener('directions_changed',directionsChanged);

  addAutocomplete(document.getElementById('start'));
  addAutocomplete(document.getElementById('end'));


  if (window.navigator.geolocation) {
    var options = {enableHighAccuracy: true, timeout: 5000, maximumAge: 0};
    navigator.geolocation.getCurrentPosition(showCurrentPositionMap, geoError, options);
  } else {
    showDefaultMap(); 
  }
  
  

}

function geoError(error) {
  console.warn(error.message);
  showDefaultMap();
}

function showCurrentPositionMap(position) {
  
	var lat_lng = {
		lat: position.coords.latitude,
		lng: position.coords.longitude
		};

  map.setZoom(8);
  map.setCenter(lat_lng);

	geocoder.geocode({
        'location': lat_lng
    }, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK && results.length > 0) {
        	var location = LocationUtil.getLocation(results);
          $('#start').val(location);
          geocodedLocation = lat_lng;
          geocodedLocation.location = location;

          

          var shadow = new google.maps.Marker({
            position: lat_lng,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: '#4285F4',
              fillOpacity: 0.3,
              scale: 12,
              strokeWeight: 0     
            },
            map: map
          });
          var currentLocationMarker = new google.maps.Marker({
            position: lat_lng,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: '#4285F4',
              fillOpacity: 1,
              scale: 6,
              strokeColor: '#FFFFFF',
              strokeWeight: 1.35,
            },
            map: map
          });

        } else {
            console.warn('Geocoder failed due to: ' + status);
            showDefaultMap();
        }
    });
	
}

function showDefaultMap() {
  map.setZoom(3);
  map.setCenter({
    lat:  39.8282324,
    lng: -98.5796641
  });
}


function addAutocomplete(input) {
	var autocomplete = new google.maps.places.Autocomplete(input);
  	autocomplete.bindTo('bounds', map);	
}


function getIntervalPoints(interval) {

    var route = directionsDisplay.getDirections().routes[0];

    var lat_lngA, lat_lngB;

    var points = [],
        duration_sum = 0,
        duration_interval = 0,
        distance_sum = 0,
        distance_interval = interval,
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
t
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

	var route = new Route();
	route.directions = directionsDisplay.getDirections().routes[0];
	route.calculateTotals();

	updateTotals(route);

	clearWeatherMarkers();
	clearRainbowRoad();


	var points = route.extractIntervalPoints();

	var calls = [];

  var weatherInterval = Math.ceil(points.length / 20);

	_.each(points, function(point, i){

		if (i % weatherInterval == 0 || i + 1 == points.length) {
			var call = ForecastIO.get({
	    					latitude: point.lat, 
	    					longitude: point.lng, 
	    					time: moment($('#time')[0].value).add(point.duration, 'seconds').format()
	    				});
			calls.push(call);
		}
		
	});
	
  var tempPointsCounter = 0;
	
	Promise.each(calls, function(result, i) {
		
		//show forecast icon every other point
		if (i % 2 == 0 || i + 1 == calls.length) {
			addWeatherMarker(result);
		}
    
    
    
		if (points[tempPointsCounter]) {
       points[tempPointsCounter].temperature = result.currently.temperature;  
    }
    tempPointsCounter += weatherInterval;
    

	}).then(function(){
		drawRainbowRoad(points);
	});
	
	

}


function clearWeatherMarkers() {
	weatherMarkers.forEach(function(label){
		label.setMap(null);
	});
	weatherMarkers.length = 0;
}

function addWeatherMarker(result) {
	var icon = 'images/transparent.gif';
	var raindrop = {
		path: 'm 125.33948,294.25094 c -16.72534,-3.20344 -28.401074,-8.04068 -42.169154,-17.47062 -21.11748,-14.46364 -36.5586,-35.80509 -43.87304,-60.63773 -3.76491,-12.78192 -4.4641,-33.07899 -1.5846,-46 2.93885,-13.18732 7.50342,-24.99541 16.6314,-43.02374 16.0851,-31.769098 34.56191,-56.353074 67.467484,-89.767649 l 21.45944,-21.791388 9.89095,9.791388 c 19.51473,19.318312 54.78074,60.580827 65.20428,76.291389 11.83459,17.83731 23.9318,43.08416 28.99223,60.50671 8.44779,29.0849 3.69085,58.10566 -13.81857,84.30318 -15.35431,22.97306 -38.2376,39.28245 -64.74585,46.14571 -10.77314,2.78928 -33.08921,3.63804 -43.45457,1.65275 z',
		fillColor: '#337AB7',
	    fillOpacity: 1,
	    scale: 1,
	    strokeColor: '#337AB7',
	    strokeWeight: 1,
	    anchor: new google.maps.Point(0, 0)
	};

	var snowflake = {
		path: 'm 98.250945,323.83158 c -1.341664,-0.47012 -2.998138,-1.36043 -3.681045,-1.97845 -1.688499,-1.52807 -2.764688,-5.42511 -2.252345,-8.15611 0.469349,-2.50185 3.833046,-5.90173 6.50155,-6.57148 5.806475,-1.45734 11.726675,3.66134 10.948125,9.46588 -0.77369,5.7683 -6.12161,9.13048 -11.516285,7.24016 z m -65.372386,-26.7812 c -3.755317,-1.69866 -6.091841,-6.42585 -5.109899,-10.33821 0.225492,-0.89843 1.345716,-2.65455 2.489394,-3.90252 6.247235,-6.81692 17.441271,0.1322 14.511753,9.00871 -1.491804,4.52022 -7.561163,7.19067 -11.891248,5.23202 z m 63.33723,-0.39526 c -4.106991,-2.70285 -4.154945,-3.02741 -4.154945,-28.119 l 0,-22.69757 -15.820753,15.7484 c -8.701415,8.66162 -16.449057,16.06645 -17.216981,16.45518 -2.059018,1.04229 -6.458395,0.8592 -8.512651,-0.35428 -3.513857,-2.07568 -5.402855,-7.41478 -3.76688,-10.64677 0.388711,-0.76792 7.937409,-8.65939 16.774888,-17.53659 l 16.068138,-16.14036 -21.728861,-0.004 c -12.779653,-0.002 -22.694458,-0.27176 -24.073356,-0.65475 -1.315187,-0.36529 -3.209497,-1.63636 -4.314751,-2.89518 -1.606276,-1.82945 -1.969808,-2.80079 -1.967865,-5.25805 0.0013,-1.8607 0.47987,-3.79716 1.250178,-5.0605 2.427524,-3.981 2.734012,-4.02591 27.480699,-4.02591 12.322487,0 22.404525,-0.21794 22.404525,-0.48431 0,-0.26637 -7.048468,-7.52837 -15.66326,-16.13778 -10.653043,-10.64639 -15.887252,-16.33217 -16.363498,-17.77521 -2.344162,-7.10288 4.839303,-13.6516 12.009447,-10.94826 0.989715,0.37315 8.918813,7.7725 17.620228,16.44298 l 15.820753,15.76455 0.0026,-22.67542 c 0.0026,-21.49901 0.06829,-22.78348 1.272602,-24.75871 3.952778,-6.48308 12.808317,-5.95212 15.746777,0.94414 0.68682,1.61229 0.87629,6.92879 0.87629,24.5937 l 0,22.53677 16.45997,-16.39971 c 10.82317,-10.78353 17.07385,-16.55091 18.25254,-16.84123 6.6066,-1.62729 12.19414,4.15311 10.64672,11.01419 -0.43577,1.93214 -3.32554,5.14767 -16.23285,18.06273 -8.63649,8.64168 -15.70271,15.91552 -15.70271,16.1641 0,0.24857 10.52161,0.5341 23.38135,0.63451 l 23.38136,0.18257 2.09587,2.28768 c 2.83454,3.09393 3.38279,6.25738 1.69036,9.75347 -2.5207,5.20707 -2.44359,5.19224 -28.11704,5.40855 l -22.63327,0.1907 15.69487,15.78986 c 16.66802,16.7689 17.55746,17.98906 16.50736,22.64506 -1.09326,4.84738 -3.62383,6.88808 -8.54159,6.88808 -3.97789,0 -5.62545,-1.36728 -21.81859,-18.10691 -7.71114,-7.97138 -14.25518,-14.49343 -14.5423,-14.49343 -0.28713,0 -0.52205,10.07922 -0.52205,22.39825 0,20.76903 -0.0886,22.57076 -1.21761,24.76987 -0.66968,1.30439 -2.08041,2.875 -3.13493,3.49025 -2.57913,1.50477 -6.981717,1.43359 -9.390741,-0.15182 z m 65.536221,0.12189 c -4.72719,-2.60342 -6.18615,-8.73756 -3.10675,-13.06218 4.8493,-6.81022 15.88099,-3.30694 15.87288,5.04065 -0.006,6.56408 -7.2024,11.08565 -12.76613,8.02153 z M 7.2970593,232.64762 c -6.53848401,-1.81315 -8.3342513,-10.36287 -3.172467,-15.10425 4.052689,-3.72261 10.2799037,-2.56798 13.0869847,2.42654 1.561173,2.77774 1.68492,4.93597 0.452186,7.88633 -1.591101,3.80803 -6.211643,5.9436 -10.3667037,4.79138 z M 189.54225,232.38694 c -6.63056,-2.30958 -7.94381,-10.18784 -2.49562,-14.97142 1.8331,-1.60948 2.77034,-1.94962 5.37212,-1.94962 2.60178,0 3.53902,0.34014 5.37212,1.94962 7.56604,6.64307 1.16995,18.25212 -8.24862,14.97142 z M 34.211222,168.34029 c -3.504741,-0.89403 -6.711835,-5.10195 -6.711835,-8.80635 0,-2.63043 1.91047,-6.08665 4.103782,-7.42413 2.450101,-1.49407 6.918726,-1.56325 9.320815,-0.14431 2.154741,1.27284 4.473629,5.17139 4.473629,7.52113 0,5.28499 -6.136522,10.14185 -11.186391,8.85366 z m 129.189598,-0.22686 c -6.7106,-1.91588 -8.54591,-10.56694 -3.23164,-15.23293 5.45005,-4.78521 14.34181,-0.74156 14.34896,6.52538 0.006,5.93756 -5.55739,10.29492 -11.11732,8.70755 z M 96.117515,140.00308 c -5.570599,-3.56874 -5.096194,-12.08082 0.834102,-14.966 4.380273,-2.13108 9.676153,-0.52934 11.760893,3.55708 1.51538,2.97039 1.5747,5.1254 0.21967,7.9809 -2.11592,4.45898 -8.52796,6.17425 -12.814665,3.42802 z',
		fillColor: '#337AB7',
		fillOpacity: 1,
		scale: 1,
		strokeColor: '#337AB7',
		strokeWeight: 1,
		anchor: new google.maps.Point(0, 0)
	};

	var hail = {
		path: 'm 90.512425,427.97658 c -2.627563,-1.4882 -3.965241,-3.66906 -3.965241,-6.46466 0,-8.69641 11.106736,-11.65094 14.836316,-3.94665 3.45397,7.13494 -4.019225,14.29207 -10.871075,10.41131 z m 7.92007,-25.21797 c -3.275966,-1.24488 -4.912085,-3.46925 -4.912085,-6.67818 0,-2.21009 16.91341,-65.32292 17.91556,-66.8524 1.65956,-2.53281 6.80533,-3.69966 10.1085,-2.29219 2.89744,1.23458 4.8152,4.56536 4.40206,7.64552 -0.42393,3.16061 -16.68603,63.97054 -17.47682,65.35223 -0.42373,0.74033 -1.33702,1.76838 -2.02955,2.28456 -1.62225,1.20916 -5.55029,1.47427 -8.007665,0.54046 z M 66.78971,398.97728 c -3.053697,-1.60987 -4.865109,-4.0883 -4.966899,-6.79589 -0.194395,-5.17093 4.793158,-9.50987 9.452617,-8.22334 2.790248,0.77043 4.713534,2.38038 5.706833,4.7771 0.810823,1.95644 0.850598,2.46592 0.343905,4.40526 -0.767887,2.93904 -1.822043,4.31248 -4.27005,5.56335 -2.384918,1.21863 -4.313945,1.30283 -6.266406,0.27352 z m 66.17249,0.31935 c -2.5807,-0.77964 -4.16372,-2.11928 -5.33626,-4.51586 -0.90461,-1.84896 -1.10571,-2.78154 -0.85289,-3.95515 0.48628,-2.25736 1.39959,-3.82993 3.01258,-5.18717 3.96664,-3.33771 9.78412,-2.02609 12.08381,2.72443 2.20251,4.5498 -0.0896,9.53409 -5.01324,10.90152 -1.96324,0.54525 -2.1896,0.54712 -3.894,0.0322 z M 73.995377,374.63165 c -3.636626,-1.69143 -5.578581,-4.14335 -5.578581,-7.04355 0,-1.80513 8.582182,-35.27272 9.500416,-37.04838 2.636642,-5.0987 11.301034,-5.65639 14.18562,-0.91308 1.916852,3.15201 1.795071,3.99274 -3.37718,23.31545 -2.891011,10.80036 -5.195593,18.53329 -5.741043,19.26386 -2.374407,3.18026 -5.533869,4.03283 -8.989232,2.4257 z m 65.508143,-0.42982 c -3.26197,-0.98855 -5.7051,-4.31355 -5.65398,-7.69489 0.0366,-2.42482 8.67642,-34.77577 9.80208,-36.70317 1.18076,-2.02174 4.0127,-3.48843 6.75351,-3.4977 4.67996,-0.0158 7.96272,3.38269 7.85095,8.12779 -0.0663,2.81526 -8.87236,35.36375 -10.05679,37.17141 -1.52494,2.32736 -5.58431,3.53949 -8.69577,2.59656 z M 50.558246,372.28268 C 41.271381,370.89264 32.958454,367.01471 26.088865,360.86785 18.030864,353.6576 13.50481,346.45218 10.942059,336.75431 9.8713857,332.7027 9.7133253,331.18912 9.7045347,324.90378 c -0.00888,-6.34698 0.1371859,-7.75836 1.2256813,-11.84357 4.455944,-16.72351 17.509403,-29.97319 33.66139,-34.1674 1.147537,-0.29798 1.975748,-0.78778 1.975748,-1.16845 0,-1.46383 2.544981,-8.62295 4.395503,-12.3647 2.72516,-5.51027 5.364312,-9.25803 9.698916,-13.77305 10.815813,-11.266 23.725222,-17.27256 38.9021,-18.10058 14.691097,-0.80151 27.934007,3.43898 39.364707,12.60493 8.90014,7.13676 14.79354,15.64535 18.52543,26.74607 l 1.48472,4.41637 4.83004,0.28441 c 8.17588,0.48142 13.80089,1.95656 20.40358,5.35076 11.90165,6.11821 20.86065,17.13108 24.23943,29.79636 1.22662,4.59796 1.69894,15.09227 0.89312,19.84373 -2.58591,15.24761 -12.09047,28.33569 -25.47993,35.08666 -5.7681,2.90828 -11.0127,4.40905 -17.38602,4.97508 -3.34756,0.29731 -3.58635,0.25618 -4.10148,-0.70634 -0.79697,-1.48917 -0.47259,-14.33518 0.37519,-14.85791 0.34221,-0.211 1.92384,-0.50519 3.51473,-0.65375 11.66332,-1.08913 22.6676,-10.5316 26.37992,-22.63587 0.83411,-2.71967 1.06572,-4.56032 1.05292,-8.36787 -0.0202,-6.00265 -0.65834,-8.85717 -3.11788,-13.94645 -1.55831,-3.22443 -2.68628,-4.73172 -6.13038,-8.19195 -3.61815,-3.63507 -4.84908,-4.54203 -8.62228,-6.35297 -2.42088,-1.16188 -5.51017,-2.33933 -6.8651,-2.61655 -1.35493,-0.27722 -7.01556,-0.50404 -12.57917,-0.50404 -7.3905,0 -10.31373,-0.15654 -10.85087,-0.5811 -0.49874,-0.3942 -0.91648,-2.07507 -1.29881,-5.22603 -1.40183,-11.55321 -4.84472,-19.06587 -12.06304,-26.32254 -7.85615,-7.89787 -17.83115,-12.03409 -29.02172,-12.03409 -14.252297,0 -25.527864,5.80918 -34.293182,17.66788 -3.628681,4.90928 -6.075191,11.90387 -6.973886,19.93838 -0.303317,2.71173 -0.726271,5.16056 -0.939893,5.44184 -0.213623,0.28129 -2.219281,0.64372 -4.457022,0.80541 -12.384544,0.89484 -22.321801,7.43622 -27.516397,18.11317 -2.053955,4.22168 -2.849351,7.84511 -2.878216,13.11172 -0.05265,9.60683 3.054725,16.81382 10.130151,23.49504 4.911969,4.63829 10.70499,7.50215 16.428281,8.12154 5.19134,0.56183 4.6891,-0.37673 4.543787,8.49113 l -0.12741,7.77511 -1.859527,0.0701 c -1.02274,0.0385 -3.096977,-0.11516 -4.60942,-0.34154 z',
		fillColor: '#337AB7',
		fillOpacity: 1,
		scale: 1,
		strokeColor: '#337AB7',
		strokeWeight: 1,
		anchor: new google.maps.Point(0, 0)
	};

	var sleet = {
		path: 'm 91.990336,433.2894 c -2.276149,-1.18381 -3.444765,-2.55986 -4.128091,-4.86087 -0.580872,-1.95601 -0.553009,-2.61445 0.274821,-6.49513 1.116382,-5.23331 2.372468,-7.31967 5.243535,-8.70953 3.423467,-1.65728 7.806899,-0.63049 10.027359,2.34882 1.64302,2.20453 1.84947,4.6053 0.8011,9.31598 -1.1001,4.94307 -1.96157,6.63734 -4.11152,8.0862 -1.87339,1.26247 -5.978339,1.42173 -8.107204,0.31453 z m 8.085004,-27.76415 c -4.426115,-1.82069 -6.362981,-7.21932 -4.0601,-11.31674 3.817705,-6.7927 14.72805,-3.91412 14.67596,3.87208 -0.0148,2.21544 -1.50736,5.14509 -3.25531,6.38973 -1.53158,1.09059 -5.79013,1.70093 -7.36055,1.05493 z m -30.189311,-1.28922 c -2.263093,-0.8069 -3.664987,-2.13126 -4.710645,-4.45011 -0.755943,-1.67639 -0.777625,-2.23682 -0.244772,-6.32715 0.71093,-5.45729 1.25305,-6.84403 3.419022,-8.74577 4.580537,-4.02177 11.899321,-1.71175 13.226952,4.1748 0.380674,1.68787 -0.693739,7.95759 -1.914344,11.17113 -1.542068,4.05987 -5.437228,5.72417 -9.776213,4.1771 z m 62.871441,0.0135 c -2.75792,-0.98413 -4.00509,-2.47066 -5.00868,-5.96999 -0.46012,-1.60434 0.67906,-9.48387 1.63971,-11.34155 1.76094,-3.40529 6.5276,-5.12794 10.27327,-3.71273 2.75869,1.0423 5.22875,4.49386 5.22669,7.30353 -0.001,2.1708 -2.18175,10.29353 -3.09873,11.54513 -1.89604,2.58792 -5.46661,3.44797 -9.03226,2.17561 z m -26.32991,-20.80063 c -3.64537,-0.95057 -5.42822,-3.40879 -5.42822,-7.4845 0,-2.8352 2.2323,-11.45858 3.42401,-13.22696 2.23713,-3.31968 5.91622,-4.64414 9.30525,-3.34985 4.26461,1.62867 6.3241,5.29779 5.29977,9.44188 -1.2708,5.14126 -3.32453,11.10889 -4.21083,12.23563 -1.88503,2.39643 -4.97486,3.27432 -8.38998,2.3838 z m -30.145227,-8.05191 c -8.157596,-3.74599 -4.948326,-15.58751 3.991695,-14.72849 2.447279,0.23515 4.11679,1.2052 5.68176,3.30131 0.739561,0.99055 0.952547,1.96555 0.952547,4.36045 0,3.7163 -1.166398,5.71745 -4.112295,7.05532 -2.388808,1.08486 -4.169264,1.08798 -6.513707,0.0114 z m 62.797227,-0.0638 c -2.71675,-1.34479 -4.0456,-3.36577 -4.24241,-6.45202 -0.19681,-3.08613 0.79351,-5.28846 3.05833,-6.80131 3.2547,-2.17408 6.9462,-1.9354 9.78903,0.63293 4.12268,3.72459 3.31026,10.23266 -1.57245,12.59634 -2.49079,1.20576 -4.63044,1.21309 -7.0325,0.0241 z m -88.1312,-0.69564 c -9.598744,-1.93903 -17.675832,-5.88935 -24.027114,-11.7511 -6.609844,-6.1004 -11.711695,-14.60036 -14.014873,-23.34955 -1.062568,-4.03643 -1.21619,-5.52454 -1.21619,-11.78101 0,-6.25646 0.153622,-7.74457 1.21619,-11.781 2.325995,-8.83587 7.348765,-17.15863 14.219631,-23.562 5.765775,-5.37348 11.666257,-8.55607 20.603609,-11.11313 0.304307,-0.0871 0.779065,-1.05258 1.055017,-2.14559 5.492051,-21.75333 23.759882,-38.45005 46.167437,-42.19686 6.977273,-1.16669 18.029383,-0.76849 24.296273,0.87538 5.09181,1.33563 12.58062,4.76412 17.39007,7.96144 3.865,2.56945 10.91947,9.10516 14.15012,13.10957 2.99139,3.70786 7.42011,12.40304 8.86618,17.40753 l 1.07616,3.7243 5.36174,0.27653 c 12.80977,0.66066 24.62354,6.07068 33.08175,15.14949 13.53032,14.52308 16.39454,36.48851 7.10276,54.47035 -7.46291,14.44253 -23.18265,24.80965 -38.05677,25.09831 l -4.158,0.0807 -0.1278,-7.3892 c -0.14313,-8.27506 -0.0443,-8.5498 3.07409,-8.5498 2.75384,0 7.5215,-1.41141 11.23562,-3.32617 6.93719,-3.57638 13.01757,-10.70526 15.48636,-18.15683 1.07394,-3.24148 1.22752,-4.463 1.24884,-9.93301 0.0221,-5.65929 -0.0936,-6.57198 -1.2487,-9.85346 -2.83376,-8.05033 -9.05527,-14.97411 -16.74566,-18.63585 -5.10981,-2.43302 -8.32794,-2.90956 -19.70998,-2.91867 -5.51168,-0.005 -10.12709,-0.17929 -10.25645,-0.38861 -0.12937,-0.20932 -0.64423,-3.17189 -1.14414,-6.5835 -1.47414,-10.06024 -4.51376,-16.85177 -10.49815,-23.45642 -5.44426,-6.00854 -13.33649,-10.69514 -21.21004,-12.59505 -6.71948,-1.62142 -15.362135,-1.29763 -22.176004,0.83082 -6.275754,1.96036 -13.707663,6.91523 -18.198368,12.13289 -5.714096,6.6391 -8.370819,12.77132 -9.817138,22.65984 -0.501736,3.43036 -1.056303,6.38123 -1.232371,6.5575 -0.176073,0.17628 -2.60703,0.55176 -5.40213,0.83442 -8.42635,0.85213 -13.873253,3.25843 -19.703149,8.70438 -3.290868,3.07413 -6.283309,7.34564 -7.737304,11.04448 -4.794118,12.19584 -0.422661,28.19637 9.92156,36.3152 4.700702,3.68942 12.20139,6.76804 16.48951,6.76804 0.885086,0 1.848001,0.28769 2.139818,0.6393 0.362855,0.43722 0.49027,2.95644 0.403068,7.9695 l -0.127503,7.3302 -2.310001,0.0823 c -1.2705,0.0453 -3.731085,-0.20478 -5.467968,-0.55565 z',
		fillColor: '#337AB7',
		fillOpacity: 1,
		scale: 1,
		strokeColor: '#337AB7',
		strokeWeight: 1,
		anchor: new google.maps.Point(0, 0)
	};

	var precipIconScale = 0,
		precipIntensity = result.currently.precipIntensity;

	if (precipIntensity >= .002 && precipIntensity < .017) {
		precipIconScale = (0*.01875) + .07;
	} else if (precipIntensity >= .017 && precipIntensity < .1) {
		precipIconScale = (1*.01875) + .07;
	} else if (precipIntensity >= .1 && precipIntensity < .4) {	
		precipIconScale = (2*.01875) + .07;
	} else if (precipIntensity >= .4) {
		precipIconScale = (3*.01875) + .07;
	}

	if (result.currently.precipType == 'rain') {
		icon = raindrop;
		icon.scale = precipIconScale;
	}
	if (result.currently.precipType == 'snow') {
		icon = snowflake;
		icon.scale = precipIconScale * 1.3;
	}
	if (result.currently.precipType == 'hail') {
		icon = hail;
		icon.scale = precipIconScale * 1.3;
	}
	if (result.currently.precipType == 'sleet') {
		icon = sleet;
		icon.scale = precipIconScale * 1.3;
	}

	var current_temp = Math.round(result.currently.temperature );

	
	var lat_lng = {lat: result.latitude, lng: result.longitude};

	var marker = new MarkerWithLabel({
       position: lat_lng,
       map: map,
       icon: icon,
       labelContent: current_temp + '°',
       labelAnchor: new google.maps.Point(0, 14),
       labelClass: "temperature-label", // the CSS class for the label
       labelStyle: {opacity: 0.75}
     });
	addInfoWindow(result, marker);
	weatherMarkers.push(marker);
	
}

function addInfoWindow(result, marker) {
	var f = new ForecastIO(result);

	var s = Mustache.render($('#info-window-template').html(), f);

	var infowindow = new google.maps.InfoWindow({
		content: s
	});

	marker.addListener('click', function() {
    infowindow.setZIndex(zIndex++);
		infowindow.open(map, marker);
	});
}

function clearRainbowRoad() {
	routePoints.forEach(function(point){
		point.setMap(null);
	});
	routePoints.length = 0;
}

function drawRainbowRoad(points) {

	var lat_lngA = {lat: points[0].lat, lng: points[0].lng};

	var hsla = '';

	for (var i=0; i<points.length; i++) {
		var point = points[i];
		var lat_lngB = {lat: point.lat, lng: point.lng};

		if (point.temperature) {
			hsla = getHSLA(point.temperature);
		}
		
		var path =  new google.maps.Polyline({
		    path: [lat_lngA,lat_lngB],
		    geodesic: true,
		    strokeColor: hsla,
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

function adjustMapSize() {
  var windowHeight = window.innerHeight,
      mapHeight = $('#map').innerHeight();

  if (mapHeight - 80 > windowHeight) {
    $('#map').css('height',windowHeight - 80 + 'px');
  } else {
    $('#map').css('height','400px');
  }
}
