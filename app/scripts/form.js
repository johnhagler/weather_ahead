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

	displayRoute(start, end, throughs);

	$('#map')[0].scrollIntoView();


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
	$('#total-distance').html(route.getTotalDistance());
	$('#total-duration').html(route.getTotalDuration());
	$('#totals').show();
}








