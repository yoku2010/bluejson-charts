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
            _this.title = "Gender Diversity";
            _this.subtitle = "(In Percentage)";
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

            _this.margin = {top: 10, right: 10, bottom: 10, left: 10};
            _this.margin = opt.margin && opt.margin || _this.margin;
            _this.width = opt.width && opt.width || 800;
            _this.height = opt.height && opt.height || 600;
            _this.padding = {top: 140, right: 20, bottom: 20, left: 20};
            _this.padding = opt.padding && opt.padding || _this.padding;
            _this.midSpace = opt.midSpace && opt.midSpace || 50;
            _this.innerPadding = opt.innerPadding && opt.innerPadding || 0.5;
            _this.outerPadding = opt.outerPadding && opt.outerPadding || 0.5;
            _this.titleTopMargin = opt.titleTopMargin && opt.titleTopMargin || 60;
            _this.subtitleTopMargin = opt.subtitleTopMargin && opt.subtitleTopMargin || 80;
            _this.entityLegend = {
                left: {
                    fontSize: 60,
                    fontIcon: "\uf182",
                    legendSpacing: 10,
                    legendRectSize: 20,
                    legendX: -50,
                    textSize: 20,
                    text: "For Female %"
                },
                right: {
                    fontSize: 60,
                    fontIcon: "\uf183",
                    legendSpacing: 10,
                    legendRectSize: 20,
                    legendX: -50,
                    textSize: 20,
                    text: "For Male %"
                }
            };
            _this.xLegend = {
                A: {
                    text: "Board",
                    img: "img/board.png",
                    imgWidth: 100,
                    imgHeight: 40,
                    count: "13"
                },
                B: {
                    text: "Executive Team",
                    img: "img/executive-team.png",
                    imgWidth: 100,
                    imgHeight: 40,
                    count: "20"
                },
                C: {
                    text: "Employees",
                    img: "img/employees.png",
                    imgWidth: 100,
                    imgHeight: 40,
                    count: "6,080"
                }
            };
            _this.yLegend = {
                label: '%'
            };

            _this.xPointsRight = d3.scale.linear().range([_this.width/2 + _this.midSpace, _this.width-_this.padding.right]);
            _this.xPointsLeft = d3.scale.linear().range([_this.width/2 - _this.midSpace, 0 + _this.padding.left]);
            _this.yPoints = d3.scale.ordinal().rangeRoundBands([_this.padding.top, _this.height-_this.padding.bottom], _this.innerPadding, _this.outerPadding);
            _this.xAxisC2R = d3.svg.axis().scale(_this.xPointsRight).orient("bottom");
            _this.xAxisC2L = d3.svg.axis().scale(_this.xPointsLeft).orient("bottom");
            _this.yAxisLeft = d3.svg.axis().scale(_this.yPoints).orient("right").tickSize(1).tickPadding(5);
            _this.yAxisRight = d3.svg.axis().scale(_this.yPoints).orient("left").tickSize(1).tickPadding(5);

            _this.dataFormat = function (d) {
                d.left = +d.left;
                d.right = +d.right;
                return d;
            }

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
                    _this.dataFormat && _this.data.forEach(_this.dataFormat);
                    callback && callback();
                }
                else {
                    if ("csv" == opt.fileType && opt.dataFile) {  // for csv file
                        d3.csv(opt.dataFile, _this.dataFormat, function(data){
                            _this.data = data;
                            _this.dataStatus = true;
                            callback && callback();
                        });
                    }
                    else if ("tsv" == opt.fileType) {  // for tsv file
                        d3.tsv(opt.dataFile, _this.dataFormat, function(data){
                            _this.data = data;
                            _this.dataStatus = true;

                            var maxRight = d3.max(_this.data, function(d) { return d.right; }),
                            maxLeft = d3.max(_this.data, function(d) { return d.left; }), finalMax;
                            if (maxRight<=maxLeft) {
                                finalMax = maxLeft;
                            }
                            else {
                                finalMax = maxRight;
                            }
                            finalMax = 100;
                            _this.xPointsRight.domain([0, finalMax]).nice();
                            _this.xPointsLeft.domain([0, finalMax]).nice();
                            _this.yPoints.domain(data.map(function(d) { return d.name; }));

                            callback && callback();
                        });
                    }
                    else if ("json" == opt.fileType) {  // for json file
                        d3.json(opt.dataFile, _this.dataFormat, function(data){
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
                var color = d3.scale.category20c(),
                svgContainer = d3.select(selector).append("svg")
                    .attr("xmlns", "http://www.w3.org/2000/svg")
                    .attr("width", _this.width + _this.margin.left + _this.margin.right)
                    .attr("height", _this.height + _this.margin.top + _this.margin.bottom);

                _this.svg = svgContainer.append("g")
                   .attr("transform", "translate(" + _this.margin.left + "," + _this.margin.top + ")");

                // draw title
                _this.svg.append("text")
                    .attr("text-anchor", "middle")
                    .attr("fill", "#000")
                    .attr("y", _this.titleTopMargin)
                    .attr("x", _this.width/2)
                    .style("font-size", "20px")
                    .text(_this.title);

                // draw subtitle
                _this.svg.append("text")
                    .attr("text-anchor", "middle")
                    .attr("fill", "#000")
                    .attr("y", _this.subtitleTopMargin)
                    .attr("x", _this.width/2)
                    .style("font-size", "14px")
                    .text(_this.subtitle);

                // draw entity legend (left)
                _this.leftLegend = _this.svg.append("g")
                    .attr("transform", function() {
                        return "translate(" + (_this.width/2 + _this.width/4) + "," + _this.titleTopMargin + ")";
                    });
                // icon
                _this.leftLegend.append("text")
                    .attr("font-family", "FontAwesome")
                    .attr("fill", _this.defaultColors[1])
                    .attr("font-size", _this.entityLegend.left.fontSize)
                    .text(_this.entityLegend.left.fontIcon);
                // rect
                _this.leftLegend.append("rect")
                    .attr("x", _this.entityLegend.left.legendX)
                    .attr("y", _this.entityLegend.left.legendRectSize)
                    .attr("width", _this.entityLegend.left.legendRectSize)
                    .attr("height", _this.entityLegend.left.legendRectSize)
                    .style("fill", _this.defaultColors[1])
                    .style("stroke", _this.defaultColors[1]);
                // text
                _this.leftLegend.append("text")
                    .attr("x", _this.entityLegend.left.legendX + _this.entityLegend.left.legendRectSize + _this.entityLegend.left.legendSpacing)
                    .attr("y", _this.entityLegend.left.legendRectSize + _this.entityLegend.left.textSize * 0.9)
                    .attr("font-size", _this.entityLegend.left.textSize)
                    .text(_this.entityLegend.left.text);

                // draw entity legend (right)
                _this.rightLegend = _this.svg.append("g")
                    .attr("transform", function() {
                        return "translate(" + (_this.width/2 - _this.width/4) + "," + _this.titleTopMargin + ")";
                    });
                // icon
                _this.rightLegend.append("text")
                    .attr("font-family", "FontAwesome")
                    .attr("fill", _this.defaultColors[0])
                    .attr("font-size", _this.entityLegend.right.fontSize)
                    .text(_this.entityLegend.right.fontIcon);
                // rect
                _this.rightLegend.append("rect")
                    .attr("x", _this.entityLegend.right.legendX)
                    .attr("y", _this.entityLegend.right.legendRectSize)
                    .attr("width", _this.entityLegend.right.legendRectSize)
                    .attr("height", _this.entityLegend.right.legendRectSize)
                    .style("fill", _this.defaultColors[0])
                    .style("stroke", _this.defaultColors[0]);
                // text
                _this.rightLegend.append("text")
                    .attr("x", _this.entityLegend.right.legendX + _this.entityLegend.right.legendRectSize + _this.entityLegend.right.legendSpacing)
                    .attr("y", _this.entityLegend.right.legendRectSize + _this.entityLegend.right.textSize * 0.9)
                    .attr("font-size", _this.entityLegend.right.textSize)
                    .text(_this.entityLegend.right.text);

                // draw scale (x-axis) center to left
                _this.svg.append("g")
                    .attr("fill", "none")
                    .attr("stroke", "#000")
                    .attr("transform", "translate(0," + (_this.height-_this.padding.bottom) + ")")
                    .call(_this.xAxisC2L);

                // draw scale (x-axis) center to right
                _this.svg.append("g")
                    .attr("fill", "none")
                    .attr("stroke", "#000")
                    .attr("transform", "translate(0," + (_this.height-_this.padding.bottom) + ")")
                    .call(_this.xAxisC2R);

                // draw scale (y-axis) for right graph
                _this.svg.append("g")
                    .attr("fill", "#888")
                    .attr("transform", "translate(" + _this.xPointsRight(0) + ",0)")
                    .call(_this.yAxisRight).selectAll("text").remove();
                _this.svg.append("text")
                    .attr("x", _this.width - _this.margin.right)
                    .attr("y", _this.height - _this.margin.bottom)
                    .attr('fill', "#000")
                    .text(_this.yLegend.label)

                // draw scale (y-axis) for left graph
                _this.svg.append("g")
                    .attr("fill", "#888")
                    .attr("transform", "translate(" + _this.xPointsLeft(0) + ",0)")
                    .call(_this.yAxisLeft).selectAll("text").remove();
                _this.svg.append("text")
                    .attr("x", 0 - _this.margin.left)
                    .attr("y", _this.height - _this.margin.bottom)
                    .attr('fill', "#000")
                    .text(_this.yLegend.label)

                // draw bar for right graph
                _this.svg.selectAll("rect.right-rect")
                    .data(_this.data)
                    .enter()
                    .append("rect")
                    .attr("class", "right-rect")
                    .attr("fill", function(d){ return _this.defaultColors[1];})
                    .attr("x", function(d) { return _this.xPointsRight(Math.min(0, d.right)); })
                    .attr("y", function(d) { return _this.yPoints(d.name); })
                    .attr("width", function(d) { return Math.abs(_this.xPointsRight(d.right) - _this.xPointsRight(0)); })
                    .attr("height", _this.yPoints.rangeBand());

                // draw bar text for right graph
                _this.svg.selectAll("text.right-text")
                    .data(_this.data)
                    .enter()
                    .append("text")
                    .attr("class", "right-text")
                    .attr("text-anchor", "middle")
                    .attr("fill", "#000")
                    .attr("y", function(d, i) {
                        return _this.yPoints(d.name) + _this.yPoints.rangeBand()/2;
                    })
                    .attr("x", function(d, i) {
                        return _this.xPointsRight(d.right) + 20;
                    })
                    .text(function(d){
                         return d.right + "%";
                    });

                // draw bar for left graph
                _this.svg.selectAll("rect.left-rect")
                    .data(_this.data)
                    .enter()
                    .append("rect")
                    .attr("class", "left-rect")
                    .attr("fill", function(d){ return _this.defaultColors[0];})
                    .attr("x", function(d) { return _this.xPointsLeft(d.left); })
                    .attr("y", function(d) { return _this.yPoints(d.name); })
                    .attr("width", function(d) { return Math.abs(_this.xPointsLeft(d.left) - _this.xPointsLeft(0)); })
                    .attr("height", _this.yPoints.rangeBand());

                // draw bar text for left graph
                _this.svg.selectAll("text.left-text")
                    .data(_this.data)
                    .enter()
                    .append("text")
                    .attr("class", "left-text")
                    .attr("text-anchor", "middle")
                    .attr("fill", "#000")
                    .attr("y", function(d, i) {
                        return _this.yPoints(d.name) + _this.yPoints.rangeBand()/2;
                    })
                    .attr("x", function(d, i) {
                        return _this.xPointsLeft(d.left) - 20;
                    })
                    .text(function(d){
                         return d.left + "%";
                    });

                // xLegend
                _this.centerLegend = _this.svg.append("g")
                    .attr("transform", function() {
                        return "translate(" + (_this.width/2 - _this.midSpace) + "," + _this.padding.top + ")";
                    });
                _this.centerLegend.selectAll("text.center-text")
                    .data(_this.data)
                    .enter()
                    .append("text")
                    .attr("class", "center-text")
                    .attr("text-anchor", "middle")
                    .attr("x", _this.midSpace)
                    .attr("y", function(d, i) {
                        return _this.yPoints(d.name) - _this.padding.top;
                    })
                    .text(function(d){
                         return _this.xLegend[d.name].text;
                    });

                _this.centerLegend.selectAll("image")
                    .data(_this.data)
                    .enter()
                    .append("image")
                    .attr("x", 0)
                    .attr("y", function(d, i) {
                        return _this.yPoints(d.name) - _this.padding.top + 5;
                    })
                    .attr("width", function(d){
                        return _this.midSpace*2;
                    })
                    .attr("height", function(d){
                        return _this.xLegend[d.name].imgHeight;
                    })
                    .attr("xlink:href", function(d){
                        return _this.xLegend[d.name].img;
                    })

                _this.centerLegend.selectAll("text.count-text")
                    .data(_this.data)
                    .enter()
                    .append("text")
                    .attr("class", "count-text")
                    .attr("text-anchor", "middle")
                    .attr("x", _this.midSpace)
                    .attr("y", function(d, i) {
                        return _this.yPoints(d.name) + _this.xLegend[d.name].imgHeight + 20 - _this.padding.top;
                    })
                    .text(function(d){
                         return _this.xLegend[d.name].count;
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
                        console.log(_this.data);
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
        settings["type"] = "dot";
        return new chart(selector, settings);
    }

    /**
    * @description add reference of blue to window object.
    */
    win.blue = blue;
}).call(this);  // call with window object.
