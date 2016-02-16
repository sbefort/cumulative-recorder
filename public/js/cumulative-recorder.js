$(document).ready(function() {

	var timer;								// Variable to store Timer object.
	var dataRecorder;					// Variable to store DataRecorder object.

	var timerId;							// Stores a reference to a timer setInterval loop.
	var dataRecorderId;				// Stores a reference to a dataRecorder setInterval loop.

	var chart = new Chart();	// Show a blank chart upon page load.

	// Start button is clicked.
	// Block the default button event action.
	// Hide the start button. Show all the other event buttons.
	// Create a timer and dataRecorder object.
	// Begin the timer, refreshing it every tenth of a second.
	// Begin chart rendering, refreshing it every half second.
	$('#start').click(function(e) {
		e.preventDefault();
		$('#start').hide();
		$('#stop').show();
		$('#reinforcer').show();
		$('#response').show();
		$('#reinforcer-response').show();

		timer = new Timer();
		dataRecorder = new DataRecorder(timer);

		timerId = setInterval(timer.displayTime, 100);
		dataRecorderId = setInterval(dataRecorder.updateDataPoints, 500);
	});

	// Stop button is clicked.
	// Block the default button event action.
	// Disable all of the event buttons.
	// Stop the timer.
	// Stop refreshing the chart.
	// Update the chart data points a final time.
	$('#stop').click(function(e) {
		e.preventDefault();
		$('.btn').prop('disabled', true);
		clearInterval(timerId);
		clearInterval(dataRecorderId);
		dataRecorder.updateDataPoints();
	});

	// R button is clicked.
	// Block the default button event action.
	// Get the clickTime and store it so the clock does not continue to move after the click.
	// Record the response time into the appropriate array.
	// Update the chart data points.
	$('#response').click(function(e) {
		e.preventDefault();
		var clickTime = timer.getElapsedSeconds();
		dataRecorder.recordResponseTime(clickTime);
		dataRecorder.updateDataPoints();
	});

	// SR+ button is clicked.
	// Block the default button event action.
	// Get the clickTime and store it so the clock does not continue to move after the click.
	// Record the reinforcer time into the appropriate array.
	// Update the chart data points.
	$('#reinforcer').click(function(e) {
		e.preventDefault();
		var clickTime = timer.getElapsedSeconds();
		dataRecorder.recordReinforcerTime(clickTime);
		dataRecorder.updateDataPoints();
	});

	// R & Sr+ button is clicked.
	// Block the default button event action.
	// Get the clickTime and store it so the clock does not continue to move after the click.
	// Record the reinforcer and response times into the appropriate arrays.
	// Update the chart data points.
	$('#reinforcer-response').click(function(e) {
		e.preventDefault();
		var clickTime = timer.getElapsedSeconds();
		dataRecorder.recordResponseTime(clickTime);
		dataRecorder.recordReinforcerTime(clickTime);
		dataRecorder.updateDataPoints();
	});

});

// This class contains all the properties and methods used for recording data.
var DataRecorder = function(timer) {
	
	var responseTimes = [];												// Array that stores every response click to the precision of a tenth of a second.
	var reinforcerTimes = [];											// Array that stores every reinforcer click to the precision of a tenth of a second.
	var dataPoints = [];													// Array that is updated with any response/reinforcer/stop click. Also updated with a setInterval function every half second.
	var eventCount = 1;														// Integer to keep a running total of all response and reinforcer events.
	var chart = new Chart();											// Object to manipulate CanvasJS chart.

	// Display a response or reinforcer event to the screen.
	var displayEvent = function(type, timestamp) {
		var labelClass = getLabelClass(type);
		$('#timestamps tbody').prepend('<tr><td>'+eventCount+'</td><td><span class="label'+labelClass+'">'+type+'</span></td><td>'+timestamp+'</td></tr>');
		eventCount = eventCount + 1;
	}

	// Insert a response time into the responseTimes array.
	// Display the response event on the screen.
	this.recordResponseTime = function(responseTime){
		responseTimes.push(responseTime);
		displayEvent('Response', timer.msToFormattedTime(responseTime * 1000));
	}

	// Insert a reinforcer time into the reinforcerTimes array.
	// Display the reinforcer event on the screen.
	this.recordReinforcerTime = function(reinforcerTime){
		reinforcerTimes.push(reinforcerTime);
		displayEvent('Reinforcer', timer.msToFormattedTime(reinforcerTime * 1000));
	}

	// Determine the total number of data points needed (one for each tenth of a second elapsed).
	// Reset the dataPoints array so that it can be rebuilt.
	// Reset the axisTime and responseCount to prepare for the dataPoints array to be rebuilt.
	// Loop until all the data points are caught up to the current click.
	// Update the chart.
	this.updateDataPoints = function() {

		// Get the total number of data points needed (one for each tenth of a second elapsed).
		var totalDataPoints = getTotalDataPoints();

		// Create a new array that will hold all the data points.
		var dataPoints = [];

		// Reset the xAxisTime and responseCount
		var xAxisTime = 0.1;
		var responseCount = 0;

		// Loop through the new array and fill it with the appropriate values.
		for (var i=0; i<totalDataPoints; i++) {
			
			// If the loop finds a response time, increment the response count before filling the element with a new value.
			if (responseTimes.indexOf(xAxisTime) >= 0) {
				responseCount = responseCount + 1;
			}

			// Add the response data points.
			dataPoints[i] = {x: xAxisTime, y: responseCount}

			// If the loop finds a reinforcer time, merge a reinforcer object with the appropriate response object.
			if (reinforcerTimes.indexOf(xAxisTime) >= 0) {
				var reinforcer = {markerType: 'cross', markerColor: 'red', markerSize: 10};
				dataPoints[i] = $.extend(dataPoints[i], reinforcer);
			}
			
			// Increment the xAxisTime another tenth of a second.
			xAxisTime = Math.round((xAxisTime + 0.1) * 10) / 10; // Imprecise Javascript decimals require this funky solution. See http://stackoverflow.com/questions/7342957/how-do-you-round-to-1-decimal-place-in-javascript
		}

		// Update the chart
		chart.setDataPoints(dataPoints);
		chart.updateChart();
	}

	// Return the correct label CSS class for the type of event.
	var getLabelClass = function(eventType){
		var labelClass = '';
		if (eventType === 'Response') {
			return ' label-success';
		}
		else if (eventType === 'Reinforcer') {
			return ' label-primary';
		}
		return '';
	}

	// Return the total number of data points from the time the start button was clicked (one data point for each tenth of a second).
	var getTotalDataPoints = function(){
		return Math.round((performance.now() - timer.getStartTime()) / 100);
	}

}

// This class contains all the properties and methods used for manipulating the chart.
var Chart = function(){
	var dataPoints = [];
	var xAxisMax = 100;

	var chart = new CanvasJS.Chart("cumulative-recorder",
	{
		zoomEnabled: true,
		exportEnabled: true,
		title :{
			text: "Cumulative Recorder Demo",
			fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
			fontSize: 30,
		},
		axisX:{
			maximum: xAxisMax,
			title: "Time in Seconds",
			interval: 30,
			intervalType: "seconds",
			titleFontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
			titleFontSize: 22
		},
		axisY:{
			title: "Response Count",
			interval: 10,
			titleFontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
			titleFontSize: 22
		},
		data: [{
			type: "line",
			dataPoints: dataPoints,
			lineThickness: 1,
			lineDashType: "solid",
			markerType: "none"
		}]
	});
	chart.render();

	this.setDataPoints = function(data) {
		if (data.length > 1001) {
			dataPoints = data.slice(data.length-1001);
			delete chart.options.axisX.maximum;
		}
		else {
			dataPoints = data;
		}
	}

	this.updateChart = function() {
		chart.options.data[0].dataPoints = dataPoints;
		chart.render();
	}

}

// This class contains all the properties and methods used for manipulating the timer.
var Timer = function () {
	var startTime = performance.now();
	var parent = this;

	this.formatTime = function() {
		return parent.msToFormattedTime(parent.getElapsedTime());
	}

	this.getElapsedSeconds = function() {
		return msToSeconds(parent.getElapsedTime());
	}

	this.displayTime = function() {
		$('#timer').text(parent.formatTime());
	}

	this.getElapsedTime = function() {
		var now = performance.now();
		return now - startTime;
	}

	this.getStartTime = function(){
		return startTime;
	}

	var msToSeconds = function(ms) {
		var s = ms / 1000;
		return Math.round(s * 10) / 10;
	}

	this.msToFormattedTime = function(ms) {
		var s = ms / 1000;
		var secs = s % 60;
		s = (s - secs) / 60;
		var mins = s % 60;
		var hrs = (s - mins) / 60;

		var time = zeroPad(hrs, 2) + ':' + zeroPad(mins, 2) + ':' + zeroPad(secs, 2) + '.' + ms;
		return time.substring(0,10);
	}

	var zeroPad = function(num, numZeros) {
		var n = Math.abs(num);
		var zeros = Math.max(0, numZeros - Math.floor(n).toString().length );
		var zeroString = Math.pow(10,zeros).toString().substr(1);
		if( num < 0 ) {
			zeroString = '-' + zeroString;
		}

		return zeroString+n;
	}
}

// This snippet is for browsers that do not support performance.now.
window.performance = window.performance || {};
performance.now = (function() {
	return	performance.now       ||
					performance.mozNow    ||
					performance.msNow     ||
					performance.oNow      ||
					performance.webkitNow ||
					function() { return new Date().getTime(); };
})();