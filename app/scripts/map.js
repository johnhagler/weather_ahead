
var map;
var geocoder;

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

            } else {
                window.alert('No results found for orign');
            }
        } else {
            window.alert('Geocoder failed due to: ' + status);
        }
    });

	
}