# All My Charts

## A jQuery plugin to create dynamic multi-series HighCharts

### <a href="http://csvsoundsystem.github.io/all-my-charts/" target="_blank">View the example gallery</a>

### Usage 

This plugin requires <a href="" target="_blank">`jQuery`</a>, <a href="https://github.com/misoproject/dataset" target="_blank">`miso.dataset`</a> with dependencies, and <a href="http://www.highcharts.com/" target="_blank">`highcharts`</a>. Require them and the main plugin like so:

````
<script src="path/to/jquery.1.10.1.min.js"></script>
<script src="path/to/miso.ds.deps.ie.0.4.1.js"></script>
<script src="path/to/highcharts.js"></script>
<script src="path/to/jquery.all-my-charts.js"></script>
````

````
$('#container').allMyCharts({
	data: "https://premium.scraperwiki.com/cc7znvq/47d80ae900e04f2/sql/?q=SELECT * FROM t2 WHERE year = 2012 AND type = 'withdrawal' AND (month = 1 OR month = 2) AND is_total = 0",
	chart_type: 'datetime',
	series: 'item',
	x: 'date',
	y: 'today',
	title: 'Jan and Feb withdrawals (2012)',
	y_axis_label: 'Today (millions)',
  min_datetick_interval: 24 * 3600 * 1000 // Don't let it go less than a day
});
````
Note: If you're not a non-profit, HighCharts has [some extra Terms & Conditions](http://shop.highsoft.com/highcharts.html).


#### Options

### data_format
Defaults to `'json'`. Other options: `'csv'`.

A string describing your data format. 

### delimiter
Defaults to `','`. Can be any string.
 
A string of your delimiter.

### data
Defaults to [treasury.io](http://www.treasury.io) endpoint `"https://premium.scraperwiki.com/cc7znvq/47d80ae900e04f2/sql/?q=SELECT * FROM t2 WHERE year = 2012 AND transaction_type = 'withdrawal' AND (month = 1 OR month = 2) AND is_total = 0"`

Can be either a string of the path to your data or a json object (an array of objects) itself. If it's a string it can point to a local path `data: '/data/my_data.csv` or a remote URL to call `data: 'http://data.com/endpoint'`.

### chart_type
Defaults to `'datetime'`. Can be `'datetime'` or `'categorical'`.

A string describing the chart you want. Choose `'datetime'` the former if you have an x-axis that is dates, i.e. a line chart. Choose `'categorical'` if you have categories, i.e. a bar chart.

### series
Defaults to blank, i.e. `''`.

A string of the column name that has all of the names of the things you want to chart, e.g. `'program_name'`. Can also be left blank if you only have one series or want to treat all series as one.

##### y
Defaults to `'today'`.

A string of the column name that holds your Y-axis values. 

### x
Defaults to `'date'`.
A string of the column name that holds your X-axis values. This field is only used for ``datetime`` charts). Dates are expected to be in [ISO-8601](http://en.wikipedia.org/wiki/ISO_8601) i.e. `YYYY-MM-DD`.

### container
Not set by default.

A string CSS selector, usually an id, for the div in which your chart will be created. Make sure this div has a set height and width. 

### title
Defaults to `'Chart Title'`.

A string that will be the title of your chart. Set this to an empty string, `''`, to kill that section (useful if you're short on space).

### y_axis_label
Defaults to `'Y-axis label'`. 

A string that will be the Y-axis label of your chart. Set this to an empty string, `''`, to kill that section (useful if you're short on space).

### min_datetick_interval

A number, in milliseconds, of the minimum tick interval for `datetime` charts. Defaults to `0`, (no limit). To make it so the x-axis never breaks down to intervals less than a day, set it to `24 * 3600 * 1000`, or the number of milliseconds in one day.

### color_palette
Defaults to [20 categeorical ColorBrewer colors](https://github.com/mbostock/d3/wiki/Ordinal-Scales#categorical-colors).

An array of hex code strings to color your data series.

#### Why HighCharts?

The aim of this library is to make it as easy as possible to create multi-series datetime and categorical charts. 

HighCharts has a [nicely documented API](http://api.highcharts.com/) and you get a lot of stuff for free like tooltips and a legend with clickable items that will show/hide your data series and resize your Y-scale. It's also easy to do things like [have all of your data series share one tooltip](http://api.highcharts.com/highcharts#tooltip.shared) just by editing the JSON config. In other words, customizing your chart doesn't require any JS coding, making it more deadline friendly. 

Other recent chart builder libraries such as [ChartBuilder](https://github.com/Quartz/Chartbuilder) and [NVD3](https://github.com/novus/nvd3) use D3 to make charts. Although D3 is extremely powerful, it also has browser compatibility issues and some of these libraries (in their current versions) lack the customization that Highcharts offers, or are designed to have a narrower focus. I've tested HighCharts down to IE8 and it works well. 
