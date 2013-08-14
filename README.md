# All My Charts

## A jQuery plugin to create dynamic multi-series HighCharts

### <a href="http://csvsoundsystem.github.io/all-my-charts/" target="_blank">View the example gallery</a>

### Usage

This plugin requires <a href="" target="_blank">`jQuery`</a>, <a href="https://github.com/misoproject/dataset" target="_blank">`miso.dataset`</a> with dependencies, and <a href="http://www.highcharts.com/" target="_blank">`highcharts`</a>. Require them and the main plugin like so:

````
<script src="path/to/jquery.1.10.1.min.js"></script>
<script src="path/to/miso.ds.deps.ie.0.4.1.js"></script>
<script src="path/to/highcharts.js"></script>
<script src="path/to/jquery.dynamic-highchart.js"></script>
````

Note: If you're not a non-profit, HighCharts has [some extra Terms & Conditions](http://shop.highsoft.com/highcharts.html).

````
$('#container').dynamicHighchart({
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

#### Options

* `data_format` is the format of your original data. Needn't be specified if your data is `json`. If your data is a `csv` use `data_format: 'csv'` (optional).
* `delimiter` can be set to whatever your data is delimited by. If you choose `'csv'` for `data_format`, this will default to `','`, a comma (optional).
* `data` is either the path to your data or your data itself as json object (array of objects). If it's a path it can be a url or a local file path.
* `chart_type` can be `datetime` or `categorical`. Choose the former if you have an x-axis that is dates, i.e. a line chart. Choose the latter if you have categories, i.e. a bar chart.
* `series` is the name of the column that has all of the names of the things you want to chart, e.g. program names or `item` in `t2`.
* `y` is the column that has the value you want for your y-axis.
* `x` (only for for `datetime` charts) is the column that has the date, expected to be in [ISO-8601](http://en.wikipedia.org/wiki/ISO_8601) such as `YYYY-MM-DD`.
* `container` is the selector, usually an id, for the div where your chart will be created.
* `title` is the title of your chart as a string (optional).
* `y_axis_label` is the y-axis label as a string (optional).
* `min_datetick_interval` is an optional limit if you don't want the axis to display less than a certain time interval. Default is `0`, no limit (optional).
* `color_palette` pass in an array of hex codes to override the default of [20 categeorical ColorBrewer colors](https://github.com/mbostock/d3/wiki/Ordinal-Scales#categorical-colors) (optional).

#### Why HighCharts?

The aim of this library is to make it as easy as possible to create multi-series datetime charts. 

HighCharts has a [nicely documented API](http://api.highcharts.com/) and you get a lot of stuff for free like tooltips and a legend with clickable items that will show/hide your data series and resize your Y-scale.

Other recent chart builder libraries such as [ChartBuilder](https://github.com/Quartz/Chartbuilder) and [NVD3](https://github.com/novus/nvd3) use D3 to make charts and although D3 is extremely powerful, it also has browser compatibility issues. I've tested HighCharts down to IE8 and it works well. 
