(function ( $ ) {

  $.fn.allMyCharts = function ( options , callback) {
     var chart_settings = $.extend({
        // These are the defaults.
        data_format: 'json',
        delimiter: ',',
        data: "https://premium.scraperwiki.com/cc7znvq/47d80ae900e04f2/sql/?q=SELECT * FROM t2 WHERE year = 2012 AND transaction_type = 'withdrawal' AND (month = 1 OR month = 2) AND is_total = 0",
        chart_type: 'datetime',
        series: '',
        x: 'date',
        y: 'today',
        title: '',
        y_axis_label: '',
        color_palette: ['#1f77b4', '#ff7f0e','#2ca02c','#d62728','#9467bd','#8c564b','#e377c2','#7f7f7f','#bcbd22','#17becf','#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5', '#c49c94', '#f7b6d2', '#c7c7c7', '#dbdb8d', '#9edae5'],
        min_datetick_interval: 0, // To not let the day go less than a day use 24 * 3600 * 1000
        binning: 'jenks',
        steps: 15,
        y_limit: null
      }, options ),
      response_ds;

    String.prototype.contains = function(it) { return this.indexOf(it) != -1; };

    function commaSeparateNumber(val){
      while (/(\d+)(\d{3})/.test(val.toString())){
        val = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
      }
      return val;
    };

    var stats = {
      mode: function(ary){
        var counter = {},
            mode = [],
            max = 0;
        for (var i in ary) {
            if (!(ary[i] in counter))
                counter[ary[i]] = 0;
            counter[ary[i]]++;

            if (counter[ary[i]] == max)
                mode.push(ary[i]);
            else if (counter[ary[i]] > max) {
                max = counter[ary[i]];
                mode = [ary[i]];
            };
        };
        if (max > 1){
          return mode;
        }else{
          return 'No mode'
        }
      },
      headTail: function(arr, data_min, data_max){
        var mean = ss.mean(arr),
            bins = [data_min];

        while (arr.length > 1){
          arr = _.filter(arr, function(d) { return d > mean } );
          mean = ss.mean(arr);
          bins.push(mean)
        };

        return bins;
      }
    };

    // ## Compute Matrices for Jenks
    //
    // Compute the matrices required for Jenks breaks. These matrices
    // can be used for any classing of data with `classes <= n_classes`
    function jenksMatrices(data, n_classes) {

      // in the original implementation, these matrices are referred to
      // as `LC` and `OP`
      //
      // * lower_class_limits (LC): optimal lower class limits
      // * variance_combinations (OP): optimal variance combinations for all classes
      var lower_class_limits = [],
          variance_combinations = [],
          // loop counters
          i, j,
          // the variance, as computed at each step in the calculation
          variance = 0;

      // Initialize and fill each matrix with zeroes
      for (i = 0; i < data.length + 1; i++) {
          var tmp1 = [], tmp2 = [];
          // despite these arrays having the same values, we need
          // to keep them separate so that changing one does not change
          // the other
          for (j = 0; j < n_classes + 1; j++) {
              tmp1.push(0);
              tmp2.push(0);
          }
          lower_class_limits.push(tmp1);
          variance_combinations.push(tmp2);
      }

      for (i = 1; i < n_classes + 1; i++) {
          lower_class_limits[1][i] = 1;
          variance_combinations[1][i] = 0;
          // in the original implementation, 9999999 is used but
          // since Javascript has `Infinity`, we use that.
          for (j = 2; j < data.length + 1; j++) {
              variance_combinations[j][i] = Infinity;
          }
      }

      for (var l = 2; l < data.length + 1; l++) {

          // `SZ` originally. this is the sum of the values seen thus
          // far when calculating variance.
          var sum = 0,
              // `ZSQ` originally. the sum of squares of values seen
              // thus far
              sum_squares = 0,
              // `WT` originally. This is the number of
              w = 0,
              // `IV` originally
              i4 = 0;

          // in several instances, you could say `Math.pow(x, 2)`
          // instead of `x * x`, but this is slower in some browsers
          // introduces an unnecessary concept.
          for (var m = 1; m < l + 1; m++) {

              // `III` originally
              var lower_class_limit = l - m + 1,
                  val = data[lower_class_limit - 1];

              // here we're estimating variance for each potential classing
              // of the data, for each potential number of classes. `w`
              // is the number of data points considered so far.
              w++;

              // increase the current sum and sum-of-squares
              sum += val;
              sum_squares += val * val;

              // the variance at this point in the sequence is the difference
              // between the sum of squares and the total x 2, over the number
              // of samples.
              variance = sum_squares - (sum * sum) / w;

              i4 = lower_class_limit - 1;

              if (i4 !== 0) {
                  for (j = 2; j < n_classes + 1; j++) {
                      // if adding this element to an existing class
                      // will increase its variance beyond the limit, break
                      // the class at this point, setting the `lower_class_limit`
                      // at this point.
                      if (variance_combinations[l][j] >=
                          (variance + variance_combinations[i4][j - 1])) {
                          lower_class_limits[l][j] = lower_class_limit;
                          variance_combinations[l][j] = variance +
                              variance_combinations[i4][j - 1];
                      }
                  }
              }
          }

          lower_class_limits[l][1] = 1;
          variance_combinations[l][1] = variance;
      }

      // return the two matrices. for just providing breaks, only
      // `lower_class_limits` is needed, but variances can be useful to
      // evaluage goodness of fit.
      return {
          lower_class_limits: lower_class_limits,
          variance_combinations: variance_combinations
      };
    }

    // ## Pull Breaks Values for Jenks
    //
    // the second part of the jenks recipe: take the calculated matrices
    // and derive an array of n breaks.
    function jenksBreaks(data, lower_class_limits, n_classes) {

      var k = data.length - 1,
          kclass = [],
          countNum = n_classes;

      // the calculation of classes will never include the upper and
      // lower bounds, so we need to explicitly set them
      kclass[n_classes] = data[data.length - 1];
      kclass[0] = data[0];

      // the lower_class_limits matrix is used as indexes into itself
      // here: the `k` variable is reused in each iteration.
      while (countNum > 1) {
          kclass[countNum - 1] = data[lower_class_limits[k][countNum] - 2];
          k = lower_class_limits[k][countNum] - 1;
          countNum--;
      }

      return kclass;
    }

    // # [Jenks natural breaks optimization](http://en.wikipedia.org/wiki/Jenks_natural_breaks_optimization)
    //
    // Implementations: [1](http://danieljlewis.org/files/2010/06/Jenks.pdf) (python),
    // [2](https://github.com/vvoovv/djeo-jenks/blob/master/main.js) (buggy),
    // [3](https://github.com/simogeo/geostats/blob/master/lib/geostats.js#L407) (works)
    //
    // Depends on `jenksBreaks()` and `jenksMatrices()`
    function jenks(data, n_classes) {
      if (n_classes > data.length) return null;

      // sort data in numerical order, since this is expected
      // by the matrices function
      data = data.slice().sort(function (a, b) { return a - b; });

      // get our basic matrices
      var matrices = jenksMatrices(data, n_classes),
          // we only need lower class limits here
          lower_class_limits = matrices.lower_class_limits;

      // extract n_classes out of the computed matrices
      return jenksBreaks(data, lower_class_limits, n_classes);

    }

    function rounderToNPlaces(num, places) {
      var multiplier = Math.pow(10, places);
      return Math.round(num * multiplier) / multiplier;
    };

    function currencyFormatNumber(val){
      var with_commas = String(commaSeparateNumber(val));
      if (with_commas.contains('-')){
        return '-$' + with_commas.replace('-','');
      }else{
        return '$' + with_commas;
      };

    };

    function convertTypeString(){
      if (chart_settings.chart_type == 'datetime'){
        return 'line'
      }else if (chart_settings.chart_type == 'categorical'){
        return 'column'
      }else{
        return 'scatter'
      }
    }

    function createAndFetchDs(chart_settings, $ctnr, json_chart_callback){
      var data_format = chart_settings.data_format,
          data        = chart_settings.data,
          delimiter   = chart_settings.delimiter;

      var miso_options = {};

      if (data_format == 'json'){
        if (typeof data == 'string'){
          miso_options = {
            url: data
          };
        }else{
          miso_options = {
            data: data
          };
        };
      }else if (data_format == 'csv'){
        miso_options = {
          url: data,
          delimiter: delimiter
        };
      }else{
        alert('Specify either "csv" or "json" for your data_format');
      };

      response_ds = new Miso.Dataset( miso_options );

      response_ds.fetch({ 
        success : function() {
          var ds = this;
          if (chart_settings.chart_type != 'hist'){
            reshapeData(ds, chart_settings, $ctnr, json_chart_callback)
          }else{
            hist.createHistogram(ds, chart_settings, $ctnr, json_chart_callback)
          }
        },
        error : function() {
        }
      });
    };

    var hist = {
      createHistogram: function(data, chart_settings, $ctnr, json_chart_callback){
        try{
          data = data.column(chart_settings.x).data;
          this.drawHighChart( this.constructHistData(data, chart_settings), chart_settings, $ctnr );
          json_chart_callback('Chart created');
        }
        catch(err){
          alert("Error: Try selecting fewer bins or smaller breaks.");
        }
      },
      constructHistData: function(data, settings){
        var bin_info     = this.createBinsAndXAxis(data, settings.binning, settings.steps),
            data_buckets = this.createDataBuckets(data, bin_info.binned_data, settings.binning, settings.steps);
        
        var hist_data = {
          bin_xAxis: bin_info.bin_xAxis,
          data_buckets: data_buckets
        };

        return hist_data;
      },
      createBinsAndXAxis: function(data, binning, steps){
        var data_min  = d3.min(data),
            data_max  = d3.max(data),
            range     = data_max - data_min,
            bins      = this.calcBins(data, range, data_min, data_max, binning, steps),
            bin_xAxis = [],
            binned_data,
            bin_min,
            bin_max;

        binned_data = d3.layout.histogram()
            .bins(bins)
            (data);

        $.each(binned_data, function(index, value){

          bin_min = rounderToNPlaces(value['x'], 2);
          bin_max = '<' + rounderToNPlaces(value['x'] + value['dx'], 2);

          if (value['x'] == data_min){
            bin_min = rounderToNPlaces(value['x'], 2);
          };

          bin_xAxis.push(String(bin_min + ' to ' + bin_max));

        });

        var bin_info = {
          binned_data: binned_data,
          bin_xAxis: bin_xAxis
        };

        return bin_info;

      },
      createDataBuckets: function(data, binned_data, binning){
        var data_buckets  = _.map(binned_data, function(d) { return d.length } );
        return data_buckets;
      },
      calcBins: function(data, range, data_min, data_max, binning, user_bins_breaks){
        var bins;
        if (binning == 'even'){
          bins = user_bins_breaks;
        }else if (binning == 'jenks'){
          bins = jenks(data, user_bins_breaks);
        }else if (binning == 'head-tail'){
          bins = stats.headTail(data, data_min, data_max);
        }else if (binning == 'custom-breaks'){
          bins = _.map(user_bins_breaks.split(','), function (d) { return parseInt(d)} )
        }else if (binning == 'custom-interval'){
          bins = range / user_bins_breaks;
        };

        return bins;
      },
      drawHighChart: function(hist_data, chart_settings, $ctnr){
        $ctnr.highcharts({
          chart: {
            type: 'column',
            marginRight: 0,
            marginBottom: 50
          },
          title: {
            text: chart_settings.title,
            x: -18,
            style: {
              color: '#303030',
              font: 'normal 16px "Arial", sans-serif'
            }//center
          },
          subtitle: {
            text: '',
          },
          xAxis: {
            categories: hist_data.bin_xAxis,
          title:{
            text: '',
            style: {
                color: '#303030',
                font: 'normal 13px "Arial", sans-serif'
              }
            }
          },
          yAxis: {
            max: chart_settings.y_limit,
            title: {
              text: 'Count',
              style: {
                color: '#303030',
                font: 'normal 13px "Arial", sans-serif'
              }
            }
          },
          tooltip: {
            formatter: function() {
              return 'Count in group: ' + this.y + "<br/>Range: " + this.x;
            },
            borderRadius: 1,
            borderWidth: 1,
            shadow: false
          },
          plotOptions: {
            series: {
              shadow: false,
              borderWidth: 1,
              borderColor: 'white',
              pointPadding: 0,
              groupPadding: 0,
            },
            column: {
              pointPadding: 0.2,
              borderWidth: 0
            }
          },
          legend: {
            y: 100,
            x: -10,
            align: 'right',
            enabled: false,
            borderWidth: 0,
            layout: 'vertical',
            verticalAlign: 'top'
          },
          series: [{
            name: chart_settings.y_axis_label,
            data: hist_data.data_buckets,
            color:'#6c0'
          }]
        });
      }
    }

    function reshapeData(ds, chart_settings, $ctnr, json_chart_callback){
        var items_uniq     = findDistinctSeriesNames(ds, chart_settings.series), // findDistinctSeriesNames takes a miso.dataset object and the column name whose values you want unique records of. It returns an array of unique names that appear as values in the specified column.
            series_ds_arr  = geEachSeriesDs(ds, items_uniq, chart_settings.series), // getDataForEachSeries takes a miso.dataset object, the unique columns and the name of the column those unique items appear in. It returns an array of miso ds objects, one for every unique item name.
            series_data_hc = createHighChartsDataSeries(series_ds_arr, chart_settings.series, chart_settings.y, chart_settings.x, chart_settings.chart_type, chart_settings.color_palette), // createHighChartsDataSeries returns an arrray of objects that conforms to how highcharts like a series object to be, namely, a name as a string, data as an array of values and for our purposes a color chosen from the color palette index. For a datetime series, highcharts wants the data array to be an array of arrays. Each value point is an array of two values, the date in unix time and what will be the y coordinate.
            x_axis_info    = getChartTypeSpecificXAxis(chart_settings.chart_type, items_uniq, chart_settings.series, chart_settings.min_datetick_interval); // getChartTypeSpecificXAxis this will pick what kind of Highcharts xAxis object is added into the chart JSON.
        
        makeHighchart(series_data_hc, x_axis_info, chart_settings, $ctnr, json_chart_callback)
    };

    function findDistinctSeriesNames(ds, col){
      if (col != ''){
        var items = ds.column(col).data,
            items_uniq = _.uniq(items);
      }else{
        items_uniq = [''];
      };
      return items_uniq;
    };

    function geEachSeriesDs(ds, items_uniq, col){
      if (col != ''){
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
      }else{
        series_ds_arr = [ds];
      }
      return series_ds_arr;
    };

    function keepBetweenZeroAndN(index, limit){
        var val = index - Math.floor(index / limit) * limit;
        return val;
    };

    function createHighChartsDataSeries(series_ds_arr, col, value, x, type, color_palette){
      var series = [];
      _.each(series_ds_arr, function(series_ds, index){
        var series_name = (col != '') ? series_ds.column(col).data[0] : 'data',
            series_data_value = series_ds.column(value).data,
            series_date_time,
            series_data = [];

            if (type == 'datetime'){
              series_data_time = series_ds.column(x).data;

              // Create the [unix_time, value] format that highcharts likes for time series
              for (var i = 0; i < series_data_value.length; i++){
                var date_unix = new Date(series_data_time[i]).getTime(),
                    date_val = [date_unix, series_data_value[i]];

                series_data.push(date_val)
              };
            }else{
              series_data = series_data_value;
            };

        // If you exceed the number of colors you put in, start over at the beginning.
        var color_index = keepBetweenZeroAndN(index, color_palette.length);

        var obj = {
              name:  series_name,
              color: color_palette[color_index],
              data:  series_data
            };
            series.push(obj);
      });
      return series
    }

    function getChartTypeSpecificXAxis(type, items_uniq, col, min_datetick_interval){
      var datetime = {
                  type: 'datetime',
                  minTickInterval: min_datetick_interval, 
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
          };

       var categorical = {
            categories: [col]
          };

       var default_x_info = {
            tickColor: '#e3e3e3',
            lineColor: '#e3e3e3'
          };

      if (type == 'datetime'){
        return _.extend(datetime, default_x_info);
      }else if (type == 'categorical'){
        return _.extend(categorical, default_x_info);
      }else if (type == 'scatter' || type == 'line'){
        return default_x_info
      }

    };

    function makeHighchart(series_data, x_axis_info, chart_settings, $ctnr, json_chart_callback){

      Highcharts.setOptions({
        global: {
            useUTC: false
        }
      });

      $ctnr.highcharts({
          chart: {
              type: convertTypeString()
          },
          title: {
              text: chart_settings.title,
              style: {
                  color:'#5e5e5e',
                  font: 'normal 16px "Arial", sans-serif'
              }
          },
          subtitle: {
              text: ''
          },
          legend:{
            borderRadius: 0,
            itemHoverStyle: {
              textDecoration: 'underline'
            },
            itemStyle: {
              textDecoration: 'none'
            }
          },
          xAxis: x_axis_info,
          yAxis: {
            max: chart_settings.y_limit,
            title: {
                text: chart_settings.y_axis_label,
                style: {
                  color:'#5e5e5e',
                  font: 'normal 16px "Arial", sans-serif'
              }
            },
            gridLineWidth: 1,
            gridLineColor: '#e3e3e3'
          },
          tooltip: {
              formatter: function() {
                var s = '<div class="chart-hover-title" style="color:'+ this.series.color +'">'+ this.series.name +'</div> <div class="chart-hover-info">'+
                       (chart_settings.chart_type == 'datetime' ? Highcharts.dateFormat('%b %e, %Y', this.x) : this.x) +': '+ this.y + '</div>';
                // $hover_templ.html(s).show();
                return s
              }
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
      json_chart_callback('Chart created');
      
    };

    function chartLoading($ctnr){
      $ctnr.html('<center><div style="font-family:Helvetica,sans-serif;" class="chart-loading">Loading chart... <img src="data:image/gif;base64,R0lGODlhEAAQAPQAAP///wAAAPj4+Dg4OISEhAYGBiYmJtbW1qioqBYWFnZ2dmZmZuTk5JiYmMbGxkhISFZWVgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCgAAACwAAAAAEAAQAAAFUCAgjmRpnqUwFGwhKoRgqq2YFMaRGjWA8AbZiIBbjQQ8AmmFUJEQhQGJhaKOrCksgEla+KIkYvC6SJKQOISoNSYdeIk1ayA8ExTyeR3F749CACH5BAkKAAAALAAAAAAQABAAAAVoICCKR9KMaCoaxeCoqEAkRX3AwMHWxQIIjJSAZWgUEgzBwCBAEQpMwIDwY1FHgwJCtOW2UDWYIDyqNVVkUbYr6CK+o2eUMKgWrqKhj0FrEM8jQQALPFA3MAc8CQSAMA5ZBjgqDQmHIyEAIfkECQoAAAAsAAAAABAAEAAABWAgII4j85Ao2hRIKgrEUBQJLaSHMe8zgQo6Q8sxS7RIhILhBkgumCTZsXkACBC+0cwF2GoLLoFXREDcDlkAojBICRaFLDCOQtQKjmsQSubtDFU/NXcDBHwkaw1cKQ8MiyEAIfkECQoAAAAsAAAAABAAEAAABVIgII5kaZ6AIJQCMRTFQKiDQx4GrBfGa4uCnAEhQuRgPwCBtwK+kCNFgjh6QlFYgGO7baJ2CxIioSDpwqNggWCGDVVGphly3BkOpXDrKfNm/4AhACH5BAkKAAAALAAAAAAQABAAAAVgICCOZGmeqEAMRTEQwskYbV0Yx7kYSIzQhtgoBxCKBDQCIOcoLBimRiFhSABYU5gIgW01pLUBYkRItAYAqrlhYiwKjiWAcDMWY8QjsCf4DewiBzQ2N1AmKlgvgCiMjSQhACH5BAkKAAAALAAAAAAQABAAAAVfICCOZGmeqEgUxUAIpkA0AMKyxkEiSZEIsJqhYAg+boUFSTAkiBiNHks3sg1ILAfBiS10gyqCg0UaFBCkwy3RYKiIYMAC+RAxiQgYsJdAjw5DN2gILzEEZgVcKYuMJiEAOwAAAAAAAAAAAA=="></div></center>')
    };

    function startTheShow(chart_settings, $ctnr, cb){
      chartLoading($ctnr);
      createAndFetchDs(chart_settings, $ctnr, function(response){
        if(cb){
          callback(response); /* "Chart created" */
        }
      });
    };

    return this.each(function(){
      var $ctnr = $(this);
      startTheShow(chart_settings, $ctnr, callback);

    });
  };

})(jQuery);