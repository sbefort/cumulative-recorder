$(document).ready(function() {

	var timer;
	var dataRecorder;

	var timerId;
	var dataRecorderId;

	var chart = new Chart(); // Show a blank chart upon page load.

	$('#start').click(function(e) {
		e.preventDefault();
		$('#start').hide();
		$('#stop').show();
		$('#reinforcer').show();
		$('#response').show();

		timer = new Timer();
		dataRecorder = new DataRecorder(timer);

		timerId = setInterval(timer.displayTime, 100);
		dataRecorderId = setInterval(dataRecorder.updateDataPoints, 1000);
	});

	$('#stop').click(function(e) {
		e.preventDefault();
		$('button').prop('disabled', true);
		dataRecorder.updateDataPoints();
		clearInterval(timerId);
		clearInterval(dataRecorderId);
	});

	$('#response').click(function(e) {
		e.preventDefault();
		dataRecorder.recordResponseTime();
		dataRecorder.updateDataPoints();
		dataRecorder.incrementResponseCount();
	});

	$('#reinforcer').click(function(e) {
		e.preventDefault();
		dataRecorder.recordReinforcerTime();
		dataRecorder.updateDataPoints('Reinforcer');
	});

});

var DataRecorder = function(timer) {
	
	var reinforcerTimes = [];
	var reinforcerDataPointsAll = [];
	var reinforcerDataPointsVisible = [];
	var responseTimes = [];
	var responseDataPointsAll = [];
	var responseDataPointsVisible = [];
	var responseCount = 0;
	var xAxisTime = 0;
	var eventCount = 1;
	var chart = new Chart();

	var displayEvent = function(type, timestamp) {
		var labelClass = getLabelClass(type);
		$('#timestamps tbody').prepend('<tr><td>'+eventCount+'</td><td><span class="label'+labelClass+'">'+type+'</span></td><td>'+timestamp+'</td></tr>');
		eventCount = eventCount + 1;
	}

	this.recordResponseTime = function(){
		var responseTime = timer.formatTime();
		responseTimes.push(responseTime);
		displayEvent('Response', responseTime);
	}

	this.recordReinforcerTime = function(){
		var reinforcerTime = timer.formatTime();
		reinforcerTimes.push(reinforcerTime);
		displayEvent('Reinforcer', reinforcerTime);
	}

	this.updateDataPoints = function(eventType){
		var pendingDataPointTotal = dataPointAudit();
		for (var i=responseDataPointsAll.length; i<pendingDataPointTotal; i++) {
			reinforcerDataPointsAll.push({x: xAxisTime, y: null});
			reinforcerDataPointsVisible.push({x: xAxisTime, y: null});
			responseDataPointsAll.push({x: xAxisTime, y: responseCount});
			responseDataPointsVisible.push({x: xAxisTime, y: responseCount});
			xAxisTime = xAxisTime + 0.5;
		};
		if (eventType === 'Reinforcer') {
			reinforcerDataPointsAll.pop();
			reinforcerDataPointsVisible.pop();
			reinforcerDataPointsAll.push({x: xAxisTime - 0.5, y: responseCount});
			reinforcerDataPointsVisible.push({x: xAxisTime - 0.5, y: responseCount});
		}
		chart.setDataPoints(reinforcerDataPointsVisible, responseDataPointsVisible);
		chart.updateChart();
	}

	this.incrementResponseCount = function() {
		responseCount = responseCount + 1;
	}

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

	var dataPointAudit = function(){
		return Math.ceil((performance.now() - timer.getStartTime()) / 500);
	}

}

var Chart = function(){
	var responseDataPoints = [];
	var reinforcerDataPoints = [];
	var xAxisMax = 300;

	var chart = new CanvasJS.Chart("cumulative-recorder",
	{
		zoomEnabled: true,
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
			dataPoints: responseDataPoints,
			lineThickness: 1,
			lineDashType: "solid",
			markerType: "none"
		},
		{
			type: "line",
			dataPoints: reinforcerDataPoints,
			lineThickness: 1,
			lineDashType: "solid",
			markerType: "cross"
		}]
	});
	chart.render();

	this.setDataPoints = function(reinforcerData, responseData) {
		if (responseData.length > 601) {
			responseData.splice(0, (responseData.length-601));
			reinforcerData.splice(0, (reinforcerData.length-601));
			delete chart.options.axisX.maximum;
		}
		responseDataPoints = responseData;
		reinforcerDataPoints = reinforcerData;
	}

	this.updateChart = function() {
		chart.options.data[0].dataPoints = responseDataPoints;
		chart.options.data[1].dataPoints = reinforcerDataPoints;
		console.log(responseDataPoints);
		console.log(reinforcerDataPoints);
		chart.render();
	}

}

var Timer = function () {
	var startTime = performance.now();
	var parent = this;

	this.formatTime = function() {
		return msToTime(parent.getElapsedTime());
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

	var msToTime = function(ms) {
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

window.performance = window.performance || {};
performance.now = (function() {
	return	performance.now       ||
					performance.mozNow    ||
					performance.msNow     ||
					performance.oNow      ||
					performance.webkitNow ||
					function() { return new Date().getTime(); };
})();