var celcius, km, flex = 1;

var ga = function() {};

$(function(){

  if (!navigator.onLine) {
    notifyOffline();
  }

  $(window).on('online', function(){document.location.reload(true)});
  $(window).on('offline', notifyOffline);

  

	initMap();
	setCurrentDateTime();

  $('#add-through').click(function(){ga('send', 'event', 'UI', 'Form', 'Add Through');});
	$('#add-through').click(addThroughPoint);
	
  $('#search-form').submit(function(){
    ga('send', 'event', 'UI', 'Form', 'Search');
    ga('send', 'event', 'Location', 'Start', $('#start').val());
    ga('send', 'event', 'Location', 'End', $('#end').val());

  });

  $('#useC').change(function(){
    celcius = $('#useC').is(':checked');
    var tempsF = [ 10,  20, 30, 40,  50, 60, 70, 80, 90];
    var tempsC = [-12, -6,  -1,  4,  10, 15, 21, 26, 32];
    var tempsArr = tempsF;
    if (celcius) {
      tempsArr = tempsC;
    }     
    $('#gradient-numbers td').each(function(i, el){
        $(el).html(tempsArr[i]);
    });

  });
  $('#useKm').change(function(){
    km = $('#useKm').is(':checked');
  });

  $('#search-form').submit(submitSearchForm);

  $('#add-hour').click(function(){ga('send', 'event', 'UI', 'Time', 'Add Hour');});
	$('#add-hour').click(addHour);
  $('#sub-hour').click(function(){ga('send', 'event', 'UI', 'Time', 'Subtract Hour');});
	$('#sub-hour').click(subHour);

  $('#time').change(function(){ga('send', 'event', 'UI', 'Time', 'Change');});
  

  $('#search').click(function(){ga('send', 'event', 'UI', 'Navigation', 'Jump to Search');});
  $('#search').click(jumpToSearchForm);

  $(window).resize(adjustMapSize);

  $('.clear-input').click(function(){ga('send', 'event', 'UI', 'Form', 'Clear Input');});
  $('.clear-input').click(clearInput);

  $('#speed-flex').on('input', updateFlex);


});
