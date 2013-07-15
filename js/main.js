(function(){
	var color_palette = ['#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78', '#2ca02c', '#98df8a', '#d62728', '#ff9896', '#9467bd', '#c5b0d5', '#8c564b', '#c49c94', '#e377c2', '#f7b6d2', '#7f7f7f', '#c7c7c7', '#bcbd22', '#dbdb8d', '#17becf', '#9edae5'],
		  response_ds;

	function treasuryIo(query){
	  return $.ajax({
	    url: 'https://premium.scraperwiki.com/cc7znvq/47d80ae900e04f2/sql/?q='+query
	  })
	};

	function fetchJSON(chart_config){
		treasuryIo(chart_config.query)
		  .done(function(response){

		    createAndFetchDs(response, chart_config);

		  }).fail(function(err){

		    console.log(err);

		  });
	};

	function createAndFetchDs(response, chart_config){
		response_ds = new Miso.Dataset({
			data: response
		});

		response_ds.fetch({ 
		  success : function() {
		  	var that = this;
		  	reshapeData(that, chart_config)
		  },
		  error : function() {
		  }
		});
	};

	function reshapeData(that, chart_config){
	  	var items_uniq = findDistinctSeriesNames(that, chart_config.series), // findDistinctSeriesNames takes a miso.dataset object and the column name whose values you want unique records of. It returns an array of unique names that appear as values in the specified column.
	  			series_ds_arr  = geEachSeriesDs(that, items_uniq, chart_config.series), // getDataForEachSeries takes a miso.dataset object, the unique columns and the name of the column those unique items appear in. It returns an array of miso ds objects, one for every unique item name.
	  			series_data_hc = createHighChartsDataSeries(series_ds_arr, chart_config.series, chart_config.value, chart_config.date, chart_config.chart_type),
	  			x_axis_info    = getChartTypeSpecificXAxis(chart_config.chart_type, items_uniq, chart_config.series);

	  	console.log(x_axis_info)
	  	makeHighchart(series_data_hc, x_axis_info, chart_config)
  };

	function findDistinctSeriesNames(ds, col){
		var items = ds.column(col).data,
				items_uniq = _.uniq(items);
		return items_uniq;
	};

	function geEachSeriesDs(ds, items_uniq, col){
		var series_ds_arr = [];
		_.each(items_uniq, function(item){
			var series = ds.where({
	      // copy only where the value of the specified call is equal to one of the unique item names
	      rows: function(row) {
	        return row[col] == item;
	      }
	    });
	    series_ds_arr.push(series);
		})
		return series_ds_arr;
	};

	function createHighChartsDataSeries(series_ds_arr, col, value, date, type){
		var series = [];
		_.each(series_ds_arr, function(series_ds, index){
			var series_name = series_ds.column(col).data[0],
					series_data_value = series_ds.column(value).data,
					series_date_time,
			    series_data = [];

			    if (type == 'datetime'){
			    	series_data_time = series_ds.column(date).data;

				    // Create the [unix_time, value] format that highcharts likes for time series
				    for (var i = 0; i < series_data_value.length; i++){
				    	var date_unix = new Date(series_data_time[i]).getTime(),
				    			date_val = [date_unix, series_data_value[i]];

				    	series_data.push(date_val)
				    };
			    }else{
			    	series_data = series_data_value;
			    };

			var obj = {
			    	name:  series_name,
						color: color_palette[index],
						data:  series_data
			    };
			    series.push(obj);
		});
		return series
	}

	function startTheShow(chart_config){
		fetchJSON(chart_config);
	};



	function getChartTypeSpecificXAxis(type, items_uniq, col){
		var datetime = {
                type: 'datetime',
                minTickInterval: 24 * 3600 * 1000, // Don't let the time interval go less than one day
                dateTimeLabelFormats: {
										millisecond: '%H:%M:%S.%L',
										second: '%H:%M:%S',
										minute: '%H:%M',
										hour: '%H:%M',
										day: '%b %e',
										week: '%b %e',
										month: '%b \'%y',
										year: '%Y'
									}
        },
        categorical = {
      		categories: [col]
        };

		if (type == 'datetime'){
			return datetime;
		}else{
			return categorical;
		}
	};

	function makeHighchart(series_data, x_axis_info, chart_config){
		console.log(series_data)
	   $('#container').highcharts({
          chart: {
              type: (chart_config.chart_type == 'datetime' ? 'line' : 'column')
          },
          title: {
              text: chart_config.title
          },
          subtitle: {
              text: ''
          },
          xAxis: x_axis_info,
          yAxis: {
              title: {
                  text: chart_config.y_axis_label
              }
          },
          tooltip: {
              formatter: function() {
                      return '<b>'+ this.series.name +'</b><br/>'+
                      (chart_config.chart_type == 'datetime' ? Highcharts.dateFormat('%b %e', this.x) : this.x) +': '+ this.y;
              }
              // formatter: function() {
              //         return '<b>'+ this.series.name +'</b><br/>'+
              //         Highcharts.dateFormat('%b %e', this.x) +': '+ this.y;
              // }
          },
          series: series_data,
          plotOptions: {
          	line: {
            	marker: {
            		enabled: false,
            		radius: 2
            	}
          	}
          }
      });
	};

	var chart_config = {
		// query: 'SELECT item, avg(today) as today FROM "t2" WHERE year = 2012 AND type = \'withdrawal\' AND is_total = 0 GROUP BY item',
		// query: "SELECT * FROM t2 WHERE year = 2012 AND type = 'withdrawal' AND (month = 1 OR month = 2) AND item = 'Energy Department programs'",
		query: "SELECT * FROM t2 WHERE year = 2012 AND type = 'withdrawal' AND (month = 1 OR month = 2) AND is_total = 0 ",
		chart_type: 'datetime',
		series: 'item',
		date: 'date',
		value: 'today',
		container: '#container',
		title: 'chart title',
		y_axis_label: 'y axis label'
	};

	startTheShow(chart_config);


}).call(this);