(function() {
  $("form#search").on("submit", function(ev) {
    console.log("Load the graph");
    return false;
  });

  // Finally, remove spinner
  $("#content").addClass("on-search");
})();
