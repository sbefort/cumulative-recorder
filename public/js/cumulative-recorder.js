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
		dataRecorder.updateDataPoints();
	});

});

var DataRecorder = function(timer) {
	
	var responseTimes = [];
	var reinforcerTimes = [];
	var dataPoints = [];
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

	this.updateDataPoints = function(){
		var nowDataPointTotal = dataPointAudit();
		for (var i=dataPoints.length; i<nowDataPointTotal; i++) {
			dataPoints.push({x: xAxisTime, y: responseCount});
			xAxisTime = xAxisTime + 0.5;
		};
		//console.log(dataPoints);
		chart.setDataPoints(dataPoints);
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
	var dps = [];
	var marks = [];
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
			dataPoints: dps,
			lineThickness: 1,
			lineDashType: "solid",
			markerType: "none"
		},
		{
			type: "line",
			dataPoints: marks,
			lineThickness: 1,
			lineDashType: "solid",
			markerType: "cross"
		}]
	});
	chart.render();

	this.setDataPoints = function(data) {
		if (data.length > 600) {
			delete chart.options.axisX.maximum;
		}
		dps = data;
	}

	this.updateChart = function() {
		//console.log(dps);
		chart.options.data[0].dataPoints = dps;
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