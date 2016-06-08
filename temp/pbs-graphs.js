/**
 * @desciption: plugin to create custom graphs like status, dot, bar etc.
 * @dependency: d3, crossfilter
 * @verion: 0.1
 * @author: Yogesh Kumar
 * @date: 19-Sep-2014
 * @company: PBS
 */
(function () {
    'use strict';
    var win = this,
    oldPbsGraphs = win.pbsGraphs,
    pbs = function (selector, opt) {
        var _this = this,
        // to create dummy element
        createDummyElement = function (text, options) {
            var element = document.createElement('div'), dummyD3, textPro;

            element.style.position = 'absolute';
            element.style.visibility = 'hidden';
            element.style.left = '-999px';
            element.style.top = '-999px';
            element.style.width = 'auto';
            element.style.height = 'auto';
            document.body.appendChild(element); // create a hidden div

            // create a svg tag and plot text to get width and height
            dummyD3 = d3.select(element);
            textPro = dummyD3.append('svg')
                    //.attr('version', '1.1')
                    //.attr('viewBox', '0 0 ' + opt.width + ' ' + opt.height)
                    .attr('height', opt.height)
                    .attr('width', opt.width)
                    //.attr('preserveAspectRatio', 'xMinYMin meet')
                    .append('text')
                    .style('font-family', options.fontFamily)
                    .style('font-size', options.fontSize)
                    .style('font-weight', options.fontWeight)
                    .text(text)[0][0].getBBox();

            return {
                'element': element,
                'height': textPro.height,
                'width': textPro.width
            }
        },
        // destory dummy element
        destoryDummyElement = function (element) {
            element.parentNode.removeChild(element);    // destory the element
        },
        // get the width and height of the text
        getFontSize = function (text, options) {
            var size = {}, dt,
                defaultStyle = getComputedStyle(document.getElementsByTagName('body')[0]);

            options = options || {};
            options.fontFamily = options.fontFamily || defaultStyle.fontFamily;
            options.fontSize = options.fontSize || defaultStyle.fontSize;
            options.fontWeight = options.fontWeight || defaultStyle.fontWeight;

            dt = createDummyElement(text, options); // create element

            size.width = dt.width;
            size.height = dt.height;

            destoryDummyElement(dt.element);    // remove that element

            return size;
        },
        // plot status legend
        plotStatusLegend = function (options) {
            var text = '';
            if (void 0 != options.text) {
                if ('total' == options.text) {
                    text = _this.statusDataSum;
                }
                else if (!isNaN(+options.text)) {
                    text = (void 0 != _this.statusData[options.text] ? _this.statusData[options.text] : '') + ' ' +
                        (void 0 != opt.status.text[options.text] ? opt.status.text[options.text] : '');
                }
                else {
                    text = options.text;
                }
            }
            return text;
        },
        // date option and filter function
        dateOption = {
            'Today': function () {
                var nowDate = new Date();
                _this.startDate = new Date(nowDate.getUTCFullYear(), nowDate.getUTCMonth(), nowDate.getUTCDate() - 1);
                _this.endDate = new Date();
            },
            'This Week': function () {
                var nowDate = new Date();
                _this.startDate = new Date(nowDate.getUTCFullYear(), nowDate.getUTCMonth(), nowDate.getUTCDate() - 7);
                _this.endDate = new Date();
            },
            'This Month': function () {
                var nowDate = new Date();
                _this.startDate = new Date(nowDate.getUTCFullYear(), nowDate.getUTCMonth() - 1, nowDate.getUTCDate());
                _this.endDate = new Date();
            },
            'This Year': function () {
                var nowDate = new Date();
                _this.startDate = new Date(nowDate.getUTCFullYear() - 1, nowDate.getUTCMonth(), nowDate.getUTCDate());
                _this.endDate = new Date();
            }
        };

        // create properties to cache
        _this.data = [];                                        // empty data object
        _this.dataStatus = false;                               // data loaded status
        _this.cf = null;                                        // crossfilter object (default is null)
        _this.statusData = [];                                  // to store status count
        _this.statusDataSum = 0;                                // to store status sum
        _this.dateParser = d3.time.format(opt.dateFormat);      // date parser
        _this.startDate = null;                                 // start date for filter
        _this.endDate = null;                                   // end date for filter

        /**
         * @description: check the dependancies of d3 and crossfilter
         * @return: true/false (true if satisfy else false)
         */
        _this.checkDependancis = function () {
            if ('undefined' == typeof d3) {                     // check d3
                pbsGraphs.log('d3 library is missing.');
                return false;
            }
            if ('undefined' == typeof crossfilter) {            // check crossfilter
                pbsGraphs.log('crossfilter library is missing.');
                return false;
            }
            return true;
        }

        /**
         * @description: create data object (by crossfilter) from csv file, json file or json object.
         */
        _this.loadData = function (fObj) {
            if (opt.data) {                                         // for json data object
                _this.data = opt.data;
                fObj && fObj();
            }
            else {
                if ('csv' == opt.fileType && opt.dataFile) {        // for csv file
                    d3.csv(opt.dataFile, function(data){
                        _this.data = data;
                        _this.dataStatus = true;
                        fObj && fObj();
                    });
                }
                else if ('json' == opt.fileType) {                  // for json file
                    d3.json(opt.dataFile, function(data){
                        _this.data = data;
                        _this.dataStatus = true;
                        fObj && fObj();
                    });
                }
            }
        }

        /**
         * @description: date parsing apply to whole data.
         */
        _this.parseDate = function () {
            // parse date for each row
            _this.data.forEach(function(d) {
                d.date = _this.dateParser.parse(d.date);
            });
        }

        /**
         * @description: create crossfilter object.
         */
        _this.createCfObject = function () {
            _this.cf = crossfilter(_this.data);
        }

        /**
         * @description: create date filter dimension (only date dimension for now).
         */
        _this.dataDimension = function () {
            _this.byDate = _this.cf.dimension(function(d) { return d.date; });
        }
        /**
         * @description: filter data by date
         */
        _this.filterByDate = function () {
            _this.byDate.filterAll();   // clear all filters
            if (this.startDate && this.endDate) {
                _this.byDate.filter([this.startDate, this.endDate]);  // filter by date
            }
        }

        /**
         * @description: get formate
         */
        _this.formatPercent = d3.format(".0%");

        /*
         * @description: get x point
         */
        _this.x = d3.scale.ordinal().rangeRoundBands([0, opt.width], .1);

        /**
         * @description: get y point
         */
        _this.y = d3.scale.linear().range([opt.height, 0]);


        /**
         * @description: get x Axis
         */
        _this.xAxis = d3.svg.axis().scale(_this.x).orient("bottom");

        /**
         * @description: get y Axis
         */
        _this.yAxis = d3.svg.axis().scale(_this.y).orient("left").tickFormat(_this.formatPercent);;

        /**
         * @description: create tooltip
         */
        _this.tooltip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function(d) {
                var date = d.date.getUTCMonth() + '-' + d.date.getUTCDate() + '-' + d.date.getUTCFullYear(),
                index = opt.status.getIndex(d.status), color = opt.status.colors[index] || '#fff', status = opt.status.text[index];
                return '<p><strong>Date:</strong> <span>' + date + '</span></p><p><strong>Status:</strong> <span>' + status + '</span></p>';
            });

        /*
         * @description: create select date option for the graph
         */
        _this.dateFilter = function () {
            var g = _this.svg.append('g').style('cursor', 'pointer').on('click', function() {
                _this.filterBox.attr('visibility', 'visible');
            }), color = '#555', textWidth = 45, x = opt.width/2, y = 20,
            points = (x + textWidth) + ',' + (y - 7) + ' ' + (x + textWidth + 3) + ',' + (y - 4) + ' ' + (x + textWidth + 6) + ',' + (y -7);

            // create selected text
            _this.selectedText = g.append('text')
                .text(opt.selectedFilter || 'Select Date')
                .attr('text-anchor','middle')
                .attr('x', x)
                .attr('y', y)
                .attr('font-weight','bold')
                .attr('fill', color);

            // create arrow icon
            g.append('polyline')
                .attr('stroke', '#FCAF41')
                .attr('stroke-width', '2')
                .attr('fill', 'none')
                .attr('points', points);

            // create options box
            var boxWidth = 220, boxHeight = 130, boxX = x - boxWidth/2, boxY = y - 20, defs = _this.svg.append('defs'),
            filter = defs.append('filter')
                .attr('id', 'drop-shadow')
                .attr('height', '130%');

            filter.append('feGaussianBlur')
                .attr('in', 'SourceAlpha')
                .attr('stdDeviation', 3)
                .attr('result', 'blur');

            filter.append('feOffset')
                //.attr('in', 'blur')
                .attr('dx', 2)
                .attr('dy', 2)
                .attr('result', 'offsetBlur');

            var feMerge = filter.append('feMerge');
            feMerge.append('feMergeNode')
                .attr('in', 'offsetBlur');
            feMerge.append('feMergeNode')
                .attr('in', 'SourceGraphic');

            _this.filterBox = _this.svg.append('g').attr('visibility', 'hidden');
            _this.filterBox.append('rect')
                .attr('fill', '#FFF')
                .attr('width', boxWidth)
                .attr('height', boxHeight)
                .attr('rx', '4')
                .attr('ry', '4')
                .style('filter', 'url(#drop-shadow)')
                .attr('transform', 'translate(' + boxX + ',' + boxY + ')');

            // create options
            var optionHeight = 25,
                margin = 5;
            boxY = boxY + 20;
            for (var dt in dateOption) {
                var textG = _this.filterBox.append('g').style('cursor', 'pointer');
                textG.append('text')
                    .attr('text-anchor','middle')
                    .attr('x', x)
                    .attr('y', boxY)
                    .attr('font-weight','bold')
                    .attr('fill', color)
                    .text(dt);
                textG.on('click', function () {
                    var text = d3.select(this).selectAll('text').text();
                    opt.selectedFilter = text;
                    _this.filterBox.attr('visibility', 'hidden');
                    _this.selectedText.text(text);
                    dateOption[text] && dateOption[text]();
                    _this.filterByDate();
                    _this.redraw();
                });
                boxY = boxY + optionHeight + margin;
            }
        }

        /*
         * @description: create legend for the graph
         */
        _this.legend = function () {
            // default settings
            var settings = {
                x: 10,
                y: opt.height - 10,
                dy: 0,
                fontSize: 10,
                color: '#888',
                format: ''
            }, legendText = '';

            pbsGraphs.mergeJson(settings, opt.status.legend);

            /* to get the text width and height
            getFontSize(settings.format, {
                'fontSize': settings.fontSize
            });*/

            // get all legend required in text
            var regExp = /\{([^}]+)\}/g,
                matches = settings.format.split(regExp),
                i = 0, ln = matches.length;

            for (;i < ln; i++) {
                var obj = plotStatusLegend(pbsGraphs.mergeJson({
                    'text': matches[i],
                }, settings));
                //pbsGraphs.mergeJson(settings, obj);
                legendText += obj;
            }

            this.svg.append('text')
                .style('font-size', settings.fontSize)
                .attr('fill', settings.color)
                .attr('x', settings.x)
                .attr('y', settings.y)
                .attr('dy', settings.dy).text(legendText);
        }

        /**
         * @description: to plot the graph
         */
        _this.plot = function () {
            if ('status' == opt.type) { // plot status graph
                var centerPoint = opt.height / 2 + opt.status.circleRadius/2,
                    startPoint = 0,
                    endPoint = opt.width,
                    points = [],
                    xAxisDiff = 18,     // will calculate dynamically
                    mainLine = null,
                    startMainLine = '',
                    endMainLine = '',
                    startBackLine = '',
                    endBackLine = '',
                    backLine = null,
                    cy, cx, i ,ln,
                    index;

                // create back line
                backLine = _this.svg.append('polygon').attr('fill', opt.status.backLineColor);

                // create main line
                mainLine = _this.svg.append('polygon').attr('fill', opt.status.mainLineColor);

                points.push([startPoint, centerPoint]);

                // loop on filtered data to draw circles.
                _this.svg.selectAll('.circle')
                    .data(_this.byDate.top(Infinity))
                    .enter().append('circle')
                    .attr('class', 'circle')
                    .attr('fill', function(d) {
                        _this.index = opt.status.getIndex(d.status);
                        void 0 != _this.statusData[_this.index] ? _this.statusData[_this.index]++ : _this.statusData[_this.index] = 1;
                        _this.statusDataSum++;
                        return opt.status.colors[_this.index];
                    })
                    .attr('r', opt.status.circleRadius)
                    .attr('cx', function (d) {
                        _this.index = opt.status.getIndex(d.status);
                        cx = startPoint + xAxisDiff;      // cx
                        points.push([cx]);
                        startPoint = cx;
                        return cx;
                    })
                    .attr('cy', function (d, i) {
                        _this.index = opt.status.getIndex(d.status);
                        cy = centerPoint + opt.status.pointDiff[_this.index]; // cy
                        points[i+1].push(cy);
                        return cy;
                    })
                    .on('mouseover', _this.tooltip.show)
                    .on('mouseout', _this.tooltip.hide);


                // loop to draw back line and main line
                for (i = 0, ln = points.length; i < ln; i++) {
                    startMainLine = startMainLine + points[i][0] + ',' + (points[i][1] - opt.status.circleRadius) + ' ';
                    endMainLine = points[i][0]  + ',' + (points[i][1] + opt.status.circleRadius) + ' ' + endMainLine;
                }
                startBackLine = endPoint + ',' + (points[i-1][1] - opt.status.circleRadius) + ' ';
                endBackLine = endPoint + ',' + (points[i-1][1] + opt.status.circleRadius) + ' ';

                mainLine.attr('points', startMainLine + endMainLine);
                backLine.attr('points', startMainLine + startBackLine + endBackLine + endMainLine);
            }
            else if ('dot' == opt.type) {
                // coming soon
            }
            else if ('bar' == opt.type) {
                // coming soon
            }
        }

        /**
         * @description: draw graph first time
         */
        _this.draw = function () {
            if (_this.checkDependancis()) {
                // reset all data before ploting the graph
                _this.resetData();

                _this._d3 = d3.selectAll(selector);
                _this.svg = _this._d3.append('svg')
                    //.attr('version', '1.1')
                    //.attr('viewBox', '0 0 ' + opt.width + ' ' + opt.height)
                    .attr('height', opt.height)
                    .attr('width', opt.width)
                    //.attr('preserveAspectRatio', 'xMinYMin meet');

                _this.svg[0][0].onload = function() {
                    // on load event
                }

                var callback = function () {
                    // after loading parse the date field
                    _this.parseDate();

                    // create crossfilter object
                    _this.createCfObject();

                    // create data dimensions - only for status graph
                    _this.dataDimension();

                    // filter data by date only - only for status graph
                    _this.filterByDate();

                    // plot graph
                    _this.plot();

                    // create legend
                    _this.legend();

                    // add date filter - only for status graph
                    _this.dateFilter();
                }

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

        _this.applyFilter = function () {
            // call if default date is selected
            dateOption[opt.selectedFilter] && dateOption[opt.selectedFilter]();
        }
        /**
         * @description: bind events
         */
        _this.bindEvents = function () {
            d3.select(window).on('resize', _this.resize);   // bind window resize event
            _this.svg.call(_this.tooltip);
        }

        /**
         * @description: resize event
         */
        _this.resize = function () {
            _this.redraw();
        }

        /**
         * @description: reset all data
         */
        _this.resetData = function () {
            _this.statusDataSum = 0;
            _this.statusData = [];
            for (var i = 0, ln = opt.status.text.length; i < ln; i++) {
                _this.statusData[i] = 0;
            }

            // get width and height
            var current = selector[0], allStyle = getComputedStyle(current), parent = current.parentNode;
            opt.height = opt.height * parseInt(allStyle.width)/opt.width
            opt.width = parseInt(allStyle.width);
            parent.style.height = opt.height + 'px';    // to remove page up.

        }

        return _this;
    },

    /**
     * @description: create a pbsGraphs object.
     */
    pbsGraphs = function (obj) {
        if (obj instanceof pbsGraphs) return obj;
        if (!(this instanceof pbsGraphs)) return new pbsGraphs(obj);
        this.object = obj;
    };
    /**
     * library details
     */
    pbsGraphs.VERSION = '0.1';

    /**
     * @description: if object pbsGraphs conflict with other object
     */
    pbsGraphs.noConflict = function () {
        win.pbsGraphs = oldPbsGraphs;
        return this;
    }

    /**
     * @description: to log library errors and warnings.
     */
    pbsGraphs.log = function () {
        if(win.console) {
            if (win.console.log.apply === undefined) {  // For IE
                var str = '';
                for(var i = 0; i < arguments.length; i++){
                    str += arguments[i] + ' ';
                }
                win.console.log(str);
            }
            else {
                win.console.log.apply(win.console, arguments);  // For chrome, FF and Safari
            }
        }
        else if (win.debug) {
            win.debug.log.apply(debug, arguments); // For older version of IE
        }
    }

    /**
     * @description: merge two json object
     */
    pbsGraphs.mergeJson = function (json1, json2, inDeep) {
        var obj = {}, key;
        for (key in json2) {
            if (json1[key] && json1[key].constructor == obj.constructor && json2[key] && json2[key].constructor == obj.constructor && inDeep) {
                json1[key] = pbsGraphs.mergeJson(json1[key], json2[key], inDeep);
            }
            else {
                json1[key] = json2[key];
            }
        }
        return json1;
    }
    /*
     * @description: to create status graph
     */
    pbsGraphs.status = function (selector, options) {
        // define default properties
        var settings = {
            width: 2,
            height: 1,
            status: {
                // to get circle color for status by value (values are divided into three categories <0 , =0, >0).
                pointDiff: [10, 0, -10],
                colors: ['#EB7828', '#FCC233', '#95C842'],
                text: ['Keep Trying', 'No Result', 'Good Effort'],
                getIndex: function (val) {
                    var index = 0;
                    if (0 > val) {
                        index = 0;
                    }
                    else if (0 == val){
                        index = 1;
                    }
                    else if (0 < val){
                        index = 2;
                    }
                    return index;
                },
                legend: {
                    format: 'Kimmy played {total} times and got {0} and {2} scores.',
                    circleText: true,
                    circleTextColor: '#FFF'
                },
                mainLineColor: '#CCE6F4',
                backLineColor: '#EAEBEB',
                circleRadius: 6,
            },
            dateFormat: '%m/%d/%Y',
            selectedFilter: 'This Year',
            data: null,
            dataFile: null,
            fileType: null
        };
        this.mergeJson(settings, options);      // merge json of default properties and user defined properties
        settings['type'] = 'status';            // set graph type
        return new pbs(selector, settings);
    }

    /*
     * @description: to create dot graph
     */
    pbsGraphs.dot = function (selector, options) {
        // define default properties
        var settings = {};
        this.mergeJson(settings, options);      // merge json of default properties and user defined properties
        settings['type'] = 'dot';
        return new pbs(selector, settings);
    }

    /*
     * @description: to create bar graph
     */
    pbsGraphs.bar = function (selector, options) {
        // define default properties
        var settings = {};
        this.mergeJson(settings, options);      // merge json of default properties and user defined properties
        settings['type'] = 'bar';
        return new pbs(selector, settings);
    }

    win.pbsGraphs = pbsGraphs;
}).call(this)
