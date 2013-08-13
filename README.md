# All My Charts

## A jQuery plugin to create dynamic multi-series HighCharts

### Usage

This plugin requires <a href="" target="_blank">`jQuery`</a>, <a href="https://github.com/misoproject/dataset" target="_blank">`miso.dataset`</a> with dependencies, and <a href="http://www.highcharts.com/" target="_blank">`highcharts`</a>. Require them and the main plugin like so:

````
<script src="path/to/jquery.1.10.1.min.js"></script>
<script src="path/to/miso.ds.deps.ie.0.4.1.js"></script>
<script src="path/to/highcharts.js"></script>
<script src="path/to/jquery.dynamic-highchart.js"></script>
````

Note: If you're not a non-profit, Highcharts has [some extra Terms & Conditions](http://shop.highsoft.com/highcharts.html).

````
$('#container').dynamicHighchart({
	query_url: "https://premium.scraperwiki.com/cc7znvq/47d80ae900e04f2/sql/?q=SELECT * FROM t2 WHERE year = 2012 AND type = 'withdrawal' AND (month = 1 OR month = 2) AND is_total = 0",
	chart_type: 'datetime',
	series: 'item',
	x: 'date',
	y: 'today',
	title: 'Jan and Feb withdrawals (2012)',
	y_axis_label: 'Today (millions)'
});
````

#### Options

* `chart_type` can be `datetime` or `categorical`. Choose the former if you have an x-axis that is dates, i.e. a line chart. Choose the latter if you have categories, i.e. a bar chart.
* `series` is the name of the column that has all of the names of the things you want to chart, e.g. program names or `item` in `t2`.
* `x` is the column that has the date, not used for categorical charts, expected to be in [ISO-8601](http://en.wikipedia.org/wiki/ISO_8601) such as `YYYY-MM-DD`.
* `y` is the column that has the value you want for your y-axis.
* `container` is the selector, usually an id, for the div where your chart will be created.
* `title` is the title of your chart as a string.
* `y_axis_label` is the y-axis label as a string.
