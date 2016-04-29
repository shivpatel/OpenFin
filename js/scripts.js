// Global
var years = [
    1994,
    2015
]

var categories = [];
var areas = [];
var countries = [];

var optionsCategories = [];
var optionsAreas = [];
var optionsCountries = [];

var bigData;
var geoData;

String.prototype.cleanup = function() {
    return this.toLowerCase().replace(/[^a-zA-Z0-9]+/g, "-");
}

function scrollToAnchor(anchorName) {
  $('html, body').animate({
    scrollTop: $('[name="'+anchorName+'"]').offset().top - 120
  }, 500);
}

// Year Slider
var snapSlider = document.getElementById('yearSlider');

noUiSlider.create(snapSlider, {
    start: [years[0], years[1]],
    step: 1,
    connect: true,
    range: {
        'min': [years[0]],
        'max': [years[1]]
    }
});

var snapValues = [
    document.getElementById('yearSlider-start'),
    document.getElementById('yearSlider-end')
];

// Visuals Definiton
var annualTotalFundingSvg = dimple.newSvg("#average-total-funding", 750, 280);
var annualTotalFunding;
var smallMultiples = [];
var smallMultiplesData;

$(function() {
    // Visuals Code
    d3.json("./js/data.json", function(data) {

        // initalize global data
        // initalize filter options drop down menu - data
        bigData = data;
        var length = bigData.length;
        var areaSet = new Set();
        var countrySet = new Set();
        var categorySet = new Set();
        for (var i = 0; i < length; i++) {
          areaSet.add(bigData[i].Area);
          countrySet.add(bigData[i].Country);
          bigData[i].Categories = bigData[i].Categories.split("|");
          var categoriesCount = bigData[i].Categories.length;
          for (var j = 0; j < categoriesCount; j++) {
            categorySet.add(bigData[i].Categories[j]);
          }
        }
        optionsCategories = categories = Array.from(categorySet).sort();
        optionsAreas = areas = Array.from(areaSet).sort();
        optionsCountries = countries = Array.from(countrySet).sort();

        // initalize filter options drop down menu - dom elements
        $("#filter-menu-categories-count").html(categories.length);
        $("#filter-menu-countries-count").html(countries.length);
        $("#filter-menu-areas-count").html(areas.length);
        $.each(categories, function(i, category) {
            var html = '<li><a href="#" class="small" data-value="' + category + '" tabIndex="-1"><input type="checkbox" checked/>&nbsp;&nbsp;&nbsp;' + category + '</a></li>';
            $("#category-menu").append(html);
        });
        $.each(areas, function(i, area) {
            var html = '<li><a href="#" class="small" data-value="' + area + '" tabIndex="-1"><input type="checkbox" checked/>&nbsp;&nbsp;&nbsp;' + area + '</a></li>';
            $("#area-menu").append(html);
        });
        $.each(countries, function(i, country) {
            var html = '<li><a href="#" class="small" data-value="' + country + '" tabIndex="-1"><input type="checkbox" checked/>&nbsp;&nbsp;&nbsp;' + country + '</a></li>';
            $("#country-menu").append(html);
        });
        // initalize filter options drop down menu - event listeners
        initalizeFilterMenuEventListeners();

        // show viz body to user
        $("#body-a").delay(0).hide(function() {
            $("#body-b").show();
        });

        // annual total funding area graph
        annualTotalFunding = new dimple.chart(annualTotalFundingSvg, calcAnnualTotalFundingData());
        annualTotalFunding.defaultColors = [
            new dimple.color("#0275d8"),
            new dimple.color("#5cb85c"),
            new dimple.color("#f0ad4e"),
            new dimple.color("#d9534f")
        ];
        annualTotalFunding.setBounds(65, 30, 790, 200);
        var x = annualTotalFunding.addCategoryAxis("x", "Year");
        x.addOrderRule("Date");

        var y2 = annualTotalFunding.addMeasureAxis("y", "Companies Founded");
        y2.tickFormat = ',.0f';
        y2.showGridlines = false;
        // y2.overrideMax = 1500;
        // y2.overrideMin = 0;
        var s2 = annualTotalFunding.addSeries("Annual Companies Founded", dimple.plot.area, [x, y2]);

        var y = annualTotalFunding.addMeasureAxis("y", "Amount ($)");
        y.tickFormat = ',.0f';
        y.showGridlines = false;
        // y.overrideMax = 35000000000;
        // y.overrideMin = 0;
        var s = annualTotalFunding.addSeries("Annual Funding Raised", dimple.plot.area, [x, y]);

        annualTotalFunding.draw();

        // small multiples
        smallMultiplesData = getSmallMultipleData(bigData);

        $.each(categories, function(index, category) {
            // if (index > 1) return; // for debugging
            var obj = {};
            obj.category = category;

            var catData = getCategoryData(smallMultiplesData, category);
            var catCount = getCompanyCountForCatInSmallMultiples(catData);

            // dom div creation
            var html = '<div class="smallmultiple" id="main-viz-multiple-' + category.cleanup() + '"><h3>' + category + ' <span class="smallmultiple-count">('+catCount+')<span></h3><div class="smallmultiple-visual" id="viz-multiple-' + category.cleanup() + '"></div></div>';
            $("#multiplePlaceholder").append(html);

            obj.svg = dimple.newSvg("#viz-multiple-" + category.cleanup(), 315, 200);
            var s1 = null;
            var s2 = null;
            var x = null;
            var y1 = null;
            var y2 = null;

            obj.chart = new dimple.chart(obj.svg);
            // obj.chart.setBounds(10, 10, 240, 190);
            // obj.chart.setMargins(0, 0, 0, 0);
            // obj.chart.width = 250;
            // obj.chart.height = 200;

            // 5.0 shades of grey
            obj.chart.defaultColors = [
                new dimple.color("#5cb85c"),
                new dimple.color("#0275d8"),
                new dimple.color("#f0ad4e"),
                new dimple.color("#d9534f")
            ];

            x = obj.chart.addTimeAxis("x", "Year", "%Y", "%Y");
            y2 = obj.chart.addMeasureAxis("y", "Companies Founded");
            y1 = obj.chart.addMeasureAxis("y", "Total Funding ($)");
            s1 = obj.chart.addSeries("Type", dimple.plot.line, [x, y1]);
            s2 = obj.chart.addSeries("Type", dimple.plot.line, [x, y2]);

            // x.dateParseFormat = "%Y";
            x.overrideMin = new Date(years[0].toString());
            x.overrideMax = new Date(years[1].toString());
            x.timePeriod = d3.time.years;
            x.timeInterval = 3;

            y1.showGridlines = false;
            y1.overrideMax = 10000000000;
            y1.overrideMin = 0;
            y1.useLog = true;
            // y1.logBase = 2;
            y1.title = "";

            y2.showGridlines = false;
            y2.overrideMax = 445;
            y2.overrideMin = 1;
            y2.useLog = true;
            // y2.logBase = 2;
            y2.title = "";

            s1.data = catData.FundingPerYear;
            s2.data = catData.FoundedPerYear;

            var yearsTmp = createYearStringArray();
            s1.data = dimple.filterData(s1.data, "Year", yearsTmp);
            s2.data = dimple.filterData(s2.data, "Year", yearsTmp);

            obj.chart.draw();

            smallMultiples.push(obj);
        });

        // geo map
        generateWorld();

        snapSlider.noUiSlider.on('update', function(values, handle) {
            snapValues[handle].innerHTML = Number(values[handle]).toFixed(0);
            years[handle] = Number(values[handle]).toFixed(0);
            filterVisuals(true, false);
            regenerateWorld();
        });

        snapSlider.noUiSlider.on('set', function(values, handle) {
            filterVisuals(true, true);
        });

    });
});

var geoSvg;
var geoZoom = d3.behavior.zoom();
    geoZoom.scaleExtent([1, 5])

// Visual Helper Functions
function generateWorld() {
    geoData = parseDataForGeoMap(bigData);
    var geoDataFiltered = getGeoFilteredData(geoData.data)
    var width = 950,
        height = 600;
    var projection = d3.geo.mercator()
        .scale((width + 1) / 2 / Math.PI)
        .translate([(width / 2), (height / 2) + 120])
        .precision(.1);
    var path = d3.geo.path()
        .projection(projection);
    var tooltip = d3.select("body")
        .append("div")
        .attr("id", "tooltip")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .text("A simple tooltip.");
    var graticule = d3.geo.graticule();
    var color = d3.scale.linear()
        .domain([0, 25000000, 75000000, 150000000, 300000000])
        .range(["#c51b7d", "#de77ae", "#92c5de", "#2166ac", "#053061"]);
    geoSvg = d3.select("#geomap").append("svg")
        .attr("width", width)
        .attr("height", height)
        .call(geoZoom.on("zoom", function() {
          geoSvg.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
        }))
        .append("g");

    var places = d3.nest()
        .key(function(d) {
            return d.area;
        })
        .rollup(function(a) {
            return {
                "fundingTotal": d3.mean(a, function(d) {
                    return Number(d.fundingTotal);
                }).toFixed(0),
                "companyCount": a.length,
                "latitude": a[0].latitude,
                "longitude": a[0].longitude
            }
        })
        .entries(geoDataFiltered);

    geoSvg.append("path")
        .datum(graticule)
        .attr("class", "graticule")
        .attr("d", path);

    d3.json("./js/world-50m.json", function(error, world) {
        if (error) throw error;

        geoSvg.insert("path", ".graticule")
            .datum(topojson.feature(world, world.objects.land))
            .attr("class", "land")
            .attr("d", path);

        geoSvg.insert("path", ".graticule")
            .datum(topojson.mesh(world, world.objects.countries, function(a, b) {
                return a !== b;
            }))
            .attr("class", "boundary")
            .attr("d", path);

        geoSvg.selectAll(".pin")
            .data(places)
            .enter().append("circle", ".pin")
            .attr("r", function(d) {
                return (Math.sqrt(d.values.companyCount + 3 / Math.PI));
            })
            .attr("fill", function(d, i) {
                return color(d.values.fundingTotal)
            })
            .attr("fill-opacity", .95)
            .attr("transform", function(d) {
                return "translate(" + projection([
                    d.values.longitude,
                    d.values.latitude
                ]) + ")";
            })
            .on("mouseover", function(d) {
                tooltip.html("Location: " + d.key + "<br>Average Funding: $" + addCommas(d.values.fundingTotal) + "<br>Companies: " + d.values.companyCount);
                return tooltip.style("visibility", "visible");
            })
            .on("mousemove", function() {
                return tooltip.style("top",
                    (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
            })
            .on("mouseout", function() {
                return tooltip.style("visibility", "hidden");
            });

    });
    d3.select(self.frameElement).style("height", height + "px");
}

function regenerateWorld() {

    var width = 950,
        height = 600;
    var projection = d3.geo.mercator()
        .scale((width + 1) / 2 / Math.PI)
        .translate([(width / 2), (height / 2) + 120])
        .precision(.1);
    var path = d3.geo.path()
        .projection(projection);
    var tooltip = d3.select("body")
        .append("div")
        .attr("id", "tooltip")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .text("A simple tooltip.");
    var graticule = d3.geo.graticule();
    var color = d3.scale.linear()
        .domain([0, 25000000, 75000000, 150000000, 300000000])
        .range(["#c51b7d", "#de77ae", "#92c5de", "#2166ac", "#053061"]);

    var places = d3.nest()
        .key(function(d) {
            return d.area;
        })
        .rollup(function(a) {
            return {
                "fundingTotal": d3.mean(a, function(d) {
                    return Number(d.fundingTotal);
                }).toFixed(0),
                "companyCount": a.length,
                "latitude": a[0].latitude,
                "longitude": a[0].longitude
            }
        })
        .entries(getGeoFilteredData(geoData.data));

    geoSvg.selectAll("circle").remove();
    geoSvg.selectAll(".pin")
        // .remove()
        .data(places)
        .enter().append("circle", ".pin")
        .attr("r", function(d) {
            return (Math.sqrt(d.values.companyCount + 3 / Math.PI));
        })
        .attr("fill", function(d, i) {
            return color(d.values.fundingTotal)
        })
        .attr("fill-opacity", .95)
        .attr("transform", function(d) {
            return "translate(" + projection([
                d.values.longitude,
                d.values.latitude
            ]) + ")";
        })
        .on("mouseover", function(d) {
            tooltip.html("Location: " + d.key + "<br>Average Funding: $" + addCommas(d.values.fundingTotal) + "<br>Companies: " + d.values.companyCount);
            return tooltip.style("visibility", "visible");
        })
        .on("mousemove", function() {
            return tooltip.style("top",
                (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
        })
        .on("mouseout", function() {
            return tooltip.style("visibility", "hidden");
        });
}

function repositionGeo() {
  geoSvg.attr("transform","");
}

function getUniqueCompaniesLocations(data) {
    var companies = [];
    var locations = [];
    for (var i = 0; i < data.length; i++) {
        if (companies.indexOf(data[i].Name) == -1) {
            companies.push(data[i].Name);
        }
        if (locations.indexOf(data[i].Area) == -1) {
            locations.push(data[i].Area);
        }
    }
    return {
        locations: locations,
        companies: companies
    };
}

function parseDataForGeoMap(data) {
    var result = [];
    var uniques = getUniqueCompaniesLocations(data);
    for (var i = 0; i < data.length; i++) {
        var index = uniques.companies.indexOf(data[i].Name);
        if (index > -1) {
            // add company to result
            result.push({
                name: data[i].Name,
                founded: data[i].Founded,
                fundingTotal: Number(data[i]["Funding Total"]),
                area: data[i].Area,
                Area: data[i].Area,
                Country: data[i].Country,
                latitude: data[i].Latitude,
                longitude: data[i].Longitude,
                categories: data[i].Categories,
                Categories: data[i].Categories
            });
            uniques.companies.splice(index, 1);
        }
    }
    return {
        locations: uniques.locations,
        data: result
    };
}

function getGeoFilteredData(data) {
  var result = []
  for (var i = 0; i < data.length; i++) {
      var catOk = catFilterAllow(data[i]);
      var yearOk = false;
      if (data[i].founded >= years[0] && data[i].founded <= years[1]) {
          yearOk = true;
      }
      if (yearOk && catOk) {
          result.push(data[i]);
      }
  }
  return result;
}

function addCommas(nStr) {
    nStr += '';
    var x = nStr.split('.');
    var x1 = x[0];
    var x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
}

function filterVisuals(yearChanged, doSmalls) {
    annualTotalFunding.data = calcAnnualTotalFundingData();
    annualTotalFunding.draw();
    if (doSmalls) {
      smallMultiplesData = getSmallMultipleData(bigData);
      $.each(smallMultiples, function(i, graph) {
          var hide = true;
          var catData = getCategoryData(smallMultiplesData, graph.category);
          var catCount = getCompanyCountForCatInSmallMultiples(catData);
          var catDivID = '#main-viz-multiple-' + catData.Category.cleanup();
          $(catDivID + " .smallmultiple-count").html('('+catCount+')');
          if (catData != null) {
            hide = false;
            var yearsTmp = createYearStringArray();
            graph.chart.series[0].data = dimple.filterData(catData.FundingPerYear, "Year", yearsTmp);
            graph.chart.series[1].data = dimple.filterData(catData.FoundedPerYear, "Year", yearsTmp);
            graph.chart.axes[0].overrideMin = new Date(years[0].toString());
            graph.chart.axes[0].overrideMax = new Date(years[1].toString());
            if (yearChanged) {
                graph.chart.draw();
            }
          }
          if (optionsCategories.indexOf(graph.category) == -1 || hide) {
              $("#main-viz-multiple-" + graph.category.cleanup()).css("visibility", "hidden").css("width","0").css("height","0");
          } else {
              $("#main-viz-multiple-" + graph.category.cleanup()).css("visibility", "visible").css("width","315px").css("height","250px");
          }
      });
    }
}

function calcAnnualTotalFundingData() {
    var tmp = [];
    var years = [];
    for (var i = 0; i < bigData.length; i++) {
        var item = bigData[i];
        if (catFilterAllow(item)) {
            if (years.indexOf(item.Year) == -1) {
                if (between(item.Year)) {
                    years.push(item.Year);
                    tmp.push({
                        Year: item.Year,
                        "Amount ($)": item.Amount,
                        "Companies Founded": 0
                    });
                }
            } else {
                for (var j = 0; j < tmp.length; j++) {
                    if (tmp[j].Year == item.Year) {
                        tmp[j]["Amount ($)"] += item.Amount;
                        break;
                    }
                }
            }
        }
    }
    for (var i = 0; i < bigData.length; i++) {
      if (catFilterAllow(bigData[i])) {
        var founded = Number(bigData[i].Founded);
        for (var j = 0; j < tmp.length; j++) {
          if (tmp[j].Year == founded) {
            tmp[j]["Companies Founded"]++;
            break;
          }
        }
      }
    }
    return tmp;
}

function between(year) {
    if (year >= years[0] && year <= years[1]) {
        return true;
    } else {
        return false;
    }
}

function catFilterAllow(item) {
    var catAllow = false;
    var areaAllow = false;
    var countryAllow = false;
    for (var i = 0; i < item.Categories.length; i++) {
      if (optionsCategories.indexOf(item.Categories[i]) != -1) {
        catAllow = true;
        break;
      }
    }
    if (optionsAreas.indexOf(item.Area) != -1) areaAllow = true;
    if (optionsCountries.indexOf(item.Country) != -1) countryAllow = true;
    if (catAllow && areaAllow && countryAllow) {
      return true;
    } else {
      return false;
    }
}

function getSmallMultipleData(data) {
    var tmp = [];
    $.each(data, function(itemIndex, item) {
        var processFounded = true;
        var processAmount = true;
        if (item.Founded == null) {
            processFounded = false;
            item.Founded = 0;
        }
        if (item.Amount == null) {
            processAmount = false;
            item.Amount = 0;
        }
        if (optionsAreas.indexOf(item.Area) != -1 && optionsCountries.indexOf(item.Country) != -1) {
          $.each(item.Categories, function(catIndex, category) {
              var catExist = categoryExist(category, tmp);
              if (catExist != -1) {
                  // category exists
                  if (processAmount) {
                      // funding
                      var fundingYearExist = yearExist(item.Year, tmp[catExist].FundingPerYear);
                      if (fundingYearExist == -1) {
                          // funding year not in category
                          tmp[catExist].FundingPerYear.push({
                              "Year": item.Year.toString(),
                              "Total Funding ($)": Number(item.Amount),
                              "Type": "Funding"
                          });
                      } else {
                          // funding year in category
                          tmp[catExist].FundingPerYear[fundingYearExist]["Total Funding ($)"] += item.Amount;
                      }
                  }
                  // founded
                  if (processAmount) {
                      var foundedYearExist = yearExist(item.Founded.toString(), tmp[catExist].FoundedPerYear);
                      if (foundedYearExist == -1) {
                          // founded year not in category
                          tmp[catExist].FoundedPerYear.push({
                              "Year": item.Founded.toString(),
                              "Companies Founded": 1,
                              "Type": "Founded"
                          });
                      } else {
                          // founded year in category
                          tmp[catExist].FoundedPerYear[foundedYearExist]["Companies Founded"]++;
                      }
                  }
              } else {
                  // category does not exist
                  tmp.push({
                      Category: category,
                      FundingPerYear: [{
                          "Year": item.Year.toString(),
                          "Total Funding ($)": Number(item.Amount),
                          "Type": "Funding"
                      }],
                      FoundedPerYear: [{
                          "Year": item.Founded.toString(),
                          "Companies Founded": 1,
                          "Type": "Founded"
                      }]
                  })
              }
          });
        }
    });
    return tmp;
}

function yearExist(year, list) {
    for (var i = 0; i < list.length; i++) {
        if (list[i].Year == year) {
            return i;
        }
    }
    return -1;
}

function categoryExist(category, list) {
    for (var i = 0; i < list.length; i++) {
        if (list[i].Category == category) {
            return i;
        }
    }
    return -1;
}

function createYearStringArray() {
    var arr = [];
    for (var i = years[0]; i < years[1]; i++) {
        arr.push(i.toString());
    }
    return arr;
}

function getCategoryData(data, category) {
    for (var i = 0; i < data.length; i++) {
        if (data[i].Category == category) {
            return data[i];
        }
    }
    return null;
}

function stringifyCategories(categories) {
  var result = "";
  for (var i = 0; i < categories.length; i++) {
    result += categories[i] + ", ";
  }
  return result.slice(0, -2);
}

function initalizeFilterMenuEventListeners() {
  // categories
  $('#category-menu a').on('click', function(event) {
      var $target = $(event.currentTarget);
      if ($target.attr('data-value') == "selectall") {
        // loop through all check boxes
        if ($target.prop('checked')) {
          optionsCategories = categories.slice(0);
          $target.prop('checked', false);
          $('#category-menu a').each(function() {
            if ($(this).parent().find('input:checkbox:first').attr('data-value') != "selectall") {
              $(this).parent().find('input:checkbox:first').prop('checked', true);
            }
          });
        } else {
          optionsCategories = [];
          $target.prop('checked', true);
          $('#category-menu a').each(function() {
            if ($(this).parent().find('input:checkbox:first').attr('data-value') != "selectall") {
              $(this).parent().find('input:checkbox:first').prop('checked', false);
            }
          });
        }
      } else {
        targetCategoryClick($(event.currentTarget));
      }
      filterVisuals(false, true);
      regenerateWorld();
      return false;
  });
  // areas
  $('#area-menu a').on('click', function(event) {
      var $target = $(event.currentTarget);
      if ($target.attr('data-value') == "selectall") {
        // loop through all check boxes
        if ($target.prop('checked')) {
          optionsAreas = areas.slice(0);
          $target.prop('checked', false);
          $('#area-menu a').each(function() {
            if ($(this).parent().find('input:checkbox:first').attr('data-value') != "selectall") {
              $(this).parent().find('input:checkbox:first').prop('checked', true);
            }
          });
        } else {
          optionsAreas = [];
          $target.prop('checked', true);
          $('#area-menu a').each(function() {
            if ($(this).parent().find('input:checkbox:first').attr('data-value') != "selectall") {
              $(this).parent().find('input:checkbox:first').prop('checked', false);
            }
          });
        }
      } else {
        targetAreaClick($(event.currentTarget));
      }
      filterVisuals(true, true);
      regenerateWorld();
      return false;
  });
  // countries
  $('#country-menu a').on('click', function(event) {
      var $target = $(event.currentTarget);
      if ($target.attr('data-value') == "selectall") {
        // loop through all check boxes
        if ($target.prop('checked')) {
          optionsCountries = countries.slice(0);
          $target.prop('checked', false);
          $('#country-menu a').each(function() {
            if ($(this).parent().find('input:checkbox:first').attr('data-value') != "selectall") {
              $(this).parent().find('input:checkbox:first').prop('checked', true);
            }
          });
        } else {
          optionsCountries = [];
          $target.prop('checked', true);
          $('#country-menu a').each(function() {
            if ($(this).parent().find('input:checkbox:first').attr('data-value') != "selectall") {
              $(this).parent().find('input:checkbox:first').prop('checked', false);
            }
          });
        }
      } else {
        targetCountryClick($(event.currentTarget));
      }
      filterVisuals(true, true);
      regenerateWorld();
      return false;
  });
}

function targetCategoryClick(target) {
  var $target = target,
      val = $target.attr('data-value'),
      $inp = $target.find('input'),
      idx;
  if ((idx = optionsCategories.indexOf(val)) > -1) {
      optionsCategories.splice(idx, 1);
      setTimeout(function() {
          $inp.prop('checked', false)
      }, 0);
  } else {
      optionsCategories.push(val);
      setTimeout(function() {
          $inp.prop('checked', true)
      }, 0);
  }
  $(event.target).blur();
}

function targetAreaClick(target) {
  var $target = target,
      val = $target.attr('data-value'),
      $inp = $target.find('input'),
      idx;
  if ((idx = optionsAreas.indexOf(val)) > -1) {
      optionsAreas.splice(idx, 1);
      setTimeout(function() {
          $inp.prop('checked', false)
      }, 0);
  } else {
      optionsAreas.push(val);
      setTimeout(function() {
          $inp.prop('checked', true)
      }, 0);
  }
  $(event.target).blur();
}

function targetCountryClick(target) {
  var $target = target,
      val = $target.attr('data-value'),
      $inp = $target.find('input'),
      idx;
  if ((idx = optionsCountries.indexOf(val)) > -1) {
      optionsCountries.splice(idx, 1);
      setTimeout(function() {
          $inp.prop('checked', false)
      }, 0);
  } else {
      optionsCountries.push(val);
      setTimeout(function() {
          $inp.prop('checked', true)
      }, 0);
  }
  $(event.target).blur();
}

function getCompanyCountForCatInSmallMultiples(data) {
  var length = data.FoundedPerYear.length;
  var num = 0;
  for (var i = 0; i < length; i++) {
    var year = Number(data.FoundedPerYear[i]["Year"]);
    var count = Number(data.FoundedPerYear[i]["Companies Founded"]);
    if (year >= years[0] && year <= years[1]) {
      num += count;
    }
  }
  return num;
}
