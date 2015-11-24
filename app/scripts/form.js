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

	$(new_through).find('a.stopping-for-button').click(function(e){
		e.preventDefault();
		var el = $(this).parent().find('.stopping-for-container');
		if ($(this).parent().find('.stopping-for-container:visible').length > 0) {
			$(el).hide();
			$(this).removeClass('active');
			$(el).parent().find('input.stopping-for').prop('disabled',true);
			$(el).parent().find('input.going-through').focus();
		} else {
			$(el).show();
			$(el).parent().find('input.stopping-for').prop('disabled',false);
			$(el).parent().find('input.stopping-for').focus();
			$(this).addClass('active');
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


}

function getThroughPoints() {
	var throughs = [];
	$('.going-through').each(function(){
		var through = $(this).val();		
		var stopping_for = getStoppingFor($(this)),
			stopping_for_sec = stopping_for * 60 * 60;

		if (through !== '') {
			// add back stopping_for_sec
			throughs.push({location:through});
		}

	});
	return throughs;
}

function getStoppingFor(going_through) {
	var sf = $(going_through).parent().find('input.stopping-for'),
		value = 0;
	if ($(sf).prop('disabled')) {
		// input is disabled
	} else {
		value = $(sf).val();
	}
	return value;
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










