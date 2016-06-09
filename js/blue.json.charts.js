(function() {
    "use strict";
    var win = this,
        oldBlue = win.blue,
        /**
        * @description Create a blue object.
        */
        blue = function(obj) {
            if (obj instanceof blue) return obj;
            if (!(this instanceof blue)) return new blue(obj);
            this.object = obj;
        },
        /**
        * @description Create a chart object.
        */
        chart = function (selector, opt) {
            var _this = this, checkDependency = function () {
                if ("undefined" == typeof d3) { // check d3
                    console.error("d3 library is required.");
                    return false;
                }
                return true;
            };

            // create properties to cache
            _this.data = [];
            _this.dataStatus = false;
            _this.defaultColors = [
                "#80B1D3", // Blue
                "#FB8072", // Red
                "#FDB462", // Orange
                "#B3DE69", // Green
                "#FFED6F", // Yellow
                "#BC80BD", // Purple
                "#8DD3C7", // Turquoise
                "#CCEBC5", // Pale Blue
                "#FFFFB3", // Pale Yellow
                "#BEBADA", // Lavender
                "#FCCDE5", // Pink
                "#D9D9D9"  // Grey
            ];

            /**
             * @description: get formate
             */
            _this.formatPercent = d3.format(".0%");

            /**
             * @description: load data from csv file, json file or json object.
             */
            _this.loadData = function (callback) {
                if (opt.data) {  // for json data object
                    _this.data = opt.data;
                    callback && callback();
                }
                else {
                    if ("csv" == opt.fileType && opt.dataFile) {  // for csv file
                        d3.csv(opt.dataFile, function(data){
                            _this.data = data;
                            _this.dataStatus = true;
                            callback && callback();
                        });
                    }
                    else if ("json" == opt.fileType) {  // for json file
                        d3.json(opt.dataFile, function(data){
                            _this.data = data;
                            _this.dataStatus = true;
                            callback && callback();
                        });
                    }
                    else {
                        console.log("No data source.");
                    }
                }
            }

            /**
             * @description: to plot the graph
             */
            _this.plot = function () {
                var data = d3.range(0,20);
                var color = d3.scale.category20c();
                _this.svg = d3.select(selector).append('svg')
                    .attr('width', 800)
                    .attr('height', 600);

                _this.svg.selectAll("circle")
                    .data([1,2,3])
                    .enter()
                    .append("circle").attr("cx", function (d) {
                        return 200+d*100;
                    })
                    .attr("cy", function (d) {
                        return 100;
                    })
                    .attr("r", 30)
                    .style("fill", function (d) {
                        return color(d);
                    });

                _this.svg.append('rect')
                    .attr('width', 100)
                    .attr('height', 100)
                    .attr('fill', color(0));

                _this.svg.append('rect')
                    .attr('x', 100)
                    .attr('width', 100)
                    .attr('height', 100)
                    .attr('fill', color(1));


                _this.svg.selectAll('rect').data(data)
                    .enter()
                    .append('rect')
                    .attr("x", function (d) {
                        return d*20;
                    })
                    .attr("y", function (d) {
                        return 100+d*20;
                    })
                    .text(function(d){return color(d);})
                    .attr('width', 100)
                    .attr('height', 20)
                    .attr('fill', function(d){
                        return color(d);
                    });
            }

            /**
             * @description: create legend for the graph
             */
            _this.legend = function () {
            }

            /**
             * @description: resize event
             */
            _this.resize = function () {
                _this.redraw();
            }

            /**
             * @description: bind events
             */
            _this.bindEvents = function () {
                d3.select(window).on("resize", _this.resize);   // bind window resize event
                //_this.svg.call(_this.tooltip);
            }

            /**
             * @description: draw graph first time
             */
            _this.draw = function () {
                if (checkDependency()) {
                    var callback = function () {
                        _this.plot();
                    };
                    // load the data
                    _this.loadData(callback);
                }
            }

            /*
             * @description: redraw the existing graph
             */
            _this.redraw = function () {
                _this.svg && _this.svg.remove();    // remove svg if exist
                _this.draw();                       // draw the graph
                _this.bindEvents();                 // bind events
            }

            return _this;
        };

    /**
  	 * @description: library details
  	 */
  	blue.VERSION = "0.1";
  	blue.AUTHOR="Yogesh Kumar";
  	blue.WEBSITE="http://bluejson.com";

    /**
     * @description: if object pbsGraphs conflict with other object
     */
    blue.noConflict = function () {
        win.json = oldBlue;
        return this;
    }

    /**
     * @description: merge two json object
     */
    blue.mergeJson = function (jOne, jTwo, inDeep) {
        var obj = {}, key;
        for (key in jTwo) {
            if (jOne[key] && jOne[key].constructor == obj.constructor && jTwo[key] && jTwo[key].constructor == obj.constructor && inDeep) {
                jOne[key] = pbsGraphs.mergeJson(jOne[key], jTwo[key], inDeep);
            }
            else {
                jOne[key] = jTwo[key];
            }
        }
        return jOne;
    }

    /**
     * @description: to create diversity chart object
     */
    blue.diversityChart = function (selector, options) {
        // define default properties
        var settings = {};
        this.mergeJson(settings, options);      // merge json of default properties and user defined properties
        settings["type"] = "diversity";
        return new chart(selector, settings);
    }

    /**
     * @description: to create line chart object
     */
    blue.lineChart = function (selector, options) {
        // define default properties
        var settings = {};
        this.mergeJson(settings, options);      // merge json of default properties and user defined properties
        settings["type"] = "line";
        return new chart(selector, settings);
    }

    /**
     * @description: to create bar chart object
     */
    blue.barChart = function (selector, options) {
        // define default properties
        var settings = {};
        this.mergeJson(settings, options);      // merge json of default properties and user defined properties
        settings["type"] = "bar";
        return new chart(selector, settings);
    }

    /**
     * @description: to create pie chart object
     */
    blue.pieChart = function (selector, options) {
        // define default properties
        var settings = {};
        this.mergeJson(settings, options);      // merge json of default properties and user defined properties
        settings["type"] = "pie";
        return new chart(selector, settings);
    }

    /**
     * @description: to create dot chart object
     */
    blue.dotChart = function (selector, options) {
        // define default properties
        var settings = {};
        this.mergeJson(settings, options);      // merge json of default properties and user defined properties
        settings['type'] = 'dot';
        return new chart(selector, settings);
    }

    /**
    * @description add reference of blue to window object.
    */
    win.blue = blue;
}).call(this);  // call with window object.
