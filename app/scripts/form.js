function addThroughPoint(e) {
	e.preventDefault();
	
	$('#through-example').show();

	var new_through = $.parseHTML($('#through-template').html());
	
	$('#throughs').append(new_through);

	var input = $(new_through).find('.going-through')[0];
	addAutocomplete(input);

	$(new_through).find('input').focus();

	$(new_through).find('a.remove-button').click(function(e){
		e.preventDefault();
		$(this).parents('.form-group').remove();
		if ($('.going-through').length == 0) {
			$('#through-example').hide();
		}
	});

  $('.clear-input').click(clearInput);

	return false;
}

function setCurrentDateTime() {
	var current_time = (new Date()).getTime();
	// round off to minutes;
	current_time = current_time - (current_time % 60000);
	var current_time_tmz = current_time - (new Date()).getTimezoneOffset() * 60000;
    document.getElementById('time').valueAsNumber = Math.round(current_time_tmz / 1000) * 1000;
}

function submitSearchForm(e) {
	e.preventDefault();

	var start = $('#start').val(),
		throughs = getThroughPoints(),
		end = $('#end').val();

  if (geocodedLocation.location == start) {
    start = geocodedLocation.lat + ',' + geocodedLocation.lng;
  }

	displayRoute(start, end, throughs);

	$('#map-container')[0].scrollIntoView();


}

function getThroughPoints() {
	var throughs = [];
	$('.going-through').each(function(){
		var through = $(this).val();		

		if (through !== '') {
			throughs.push({location:through});
		}

	});
	return throughs;
}


function addHour() {
	addTime(60*60*1000);
}

function subHour() {
	addTime(-60*60*1000);
}

function addTime(milliseconds) {
	document.getElementById('time').valueAsNumber = 
		document.getElementById('time').valueAsNumber + milliseconds;	
}

function updateTotals(route) {
	$('#total-distance').html(route.getTotalDistanceText());
	$('#total-duration').html(route.getTotalDurationText());
	$('#totals').show();
}

function jumpToSearchForm(e) {
  e.preventDefault();
  $('form')[0].scrollIntoView();
}

function clearInput(e) {
  e.preventDefault();
  $(e.target).siblings('input').val('').focus();
}

function notifyOffline() {
  $('#offline-modal').modal('show');
}

function updateFlex() {
	flex = $('#speed-flex').val() * 1;
	$('#speed-flex-display').html(flex + 'x');

}


