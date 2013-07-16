# Dynamic Multi-series HighCharts, a jQuery plugin.

Full README coming soon. For now, run a local server on the `index.html` with `python -m SimpleHTTPServer` and play with the query given to `chart_config`.

### Usage

````
$('#container').dynamicHighchart({
	query: "SELECT * FROM t2 WHERE year = 2012 AND type = 'withdrawal' AND (month = 1 OR month = 2) AND is_total = 0",
	chart_type: 'datetime',
	series: 'item',
	date: 'date',
	value: 'today',
	title: 'Jan and Feb withdrawals (2012)',
	y_axis_label: 'Today (millions)'
});
````

Assign `datetime` to `chart_type` if you want a line chart that has a datetime x-axis. Else assign `categorical` if you want a bar chart. Note: these require the data to either be regular output format from treasury.io for the former, or the result of a `GROUP BY` query for the categorical chart to make sense.

`series` is the name of the column that has all of the names of the things you want to chart, e.g. program names or `item` in `t2`.

`date` is the column that has the date, expected to be in `YYYY-MM-DD` which treasury.io does automatically. TODO, test with `year_month` groups.

`value` is the column that has the value you want for your y-axis.

`container` is the selector, usually an id, for the div where your chart will be created

`title` is the title of your chart as a string.

`y_axis_label` is the y-axis label as a string.