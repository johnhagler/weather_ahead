
var map;
var geocoder;
var autocomplete;

function initMap() {
	geocoder = new google.maps.Geocoder;
	navigator.geolocation.getCurrentPosition(showMap);



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


