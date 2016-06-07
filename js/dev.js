var set;
var arr;

d3.json("//localhost:3000/js/data.json", function(data) {

  arr = data;
  set = new Set(data);

  var start = Date.now();

  var count = 0;

  // for (var value of set.values()) { count++; }

  // for (var i = 0; i < arr.length; i++) { count++; }

  console.log(count);

  var end = Date.now();
  console.log("Execution time: " + ((end - start) / 1000) + " seconds");

});
