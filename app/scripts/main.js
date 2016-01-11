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




});
