// declare variables
var lyrOSM;
var lyrESRIWorldImagery;

var lyrElements;
var lyrStreamReaches;
var lyrSmallWatersheds;
var lyrSearch;
var arrElementIDs = [];

var baseMaps;
var mapLayers;

var layerControl;
var sidebarControl;
var sidebarButton;

var modelMap;

var fgpDrawnItems;

$(document).ready(function () {
  /* BASE MAP LAYERS */
  lyrOSM = L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png");

  lyrESRIWorldImagery = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution:
        "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    }
  );

  // create map
  modelMap = L.map("map", {
    center: [38.5816, -121.4944],
    zoom: 8,
    layers: [lyrOSM, lyrESRIWorldImagery],
    contextmenu: true,
    contextmenuWidth: 140,
    contextmenuItems: [
      {
        text: "Show coordinates",
        callback: showCoordinates,
      },
      {
        text: "Center map here",
        callback: centerMap,
      },
      "-",
      {
        text: "Zoom in",
        icon: "images/magnifying-glass-plus-solid.svg",
        callback: zoomIn,
      },
      {
        text: "Zoom out",
        icon: "images/magnifying-glass-minus-solid.svg",
        callback: zoomOut,
      },
    ],
  });

  fgpDrawnItems = new L.FeatureGroup();
  fgpDrawnItems.addTo(modelMap);

  /* MAP DATA */
  lyrStreamReaches = L.geoJSON
    .ajax("data/i08_C2VSimFG_Stream_Reaches.geojson", {
      style: styleStreamReaches,
      onEachFeature: processStreamReaches,
    })
    .addTo(modelMap);

  lyrElements = L.geoJSON
    .ajax("data/i08_C2VSimFG_Elements.geojson", {
      style: styleElements,
      onEachFeature: processElements,
      filter: filterElements,
    })
    .addTo(modelMap);

  lyrElements.on("data:loaded", function () {
    arrElementIDs.sort(function (a, b) {
      return a - b;
    });
    $("#txt-find-element").autocomplete({
      source: arrElementIDs,
    });
  });

  lyrSmallWatersheds = L.geoJSON
    .ajax("data/i08_C2VSimFG_Small_Watersheds.geojson", {
      style: styleSWS,
      onEachFeature: processSWS,
    })
    .addTo(modelMap);

  // zoom to layer
  lyrSmallWatersheds.on("data:loaded", function () {
    modelMap.fitBounds(lyrSmallWatersheds.getBounds());
  });

  /* MAP CONTROLS */
  // set-up layer control
  baseMaps = {
    "Open Street Map": lyrOSM,
    "ESRI World Imagery": lyrESRIWorldImagery,
  };

  mapLayers = {
    "C2VSimFG Stream Reaches": lyrStreamReaches,
    "C2VSimFG Elements": lyrElements,
    "C2VSimFG Small Watersheds": lyrSmallWatersheds,
  };

  //console.log(lyrElements.urls[0]);

  layerControl = L.control.layers(baseMaps, mapLayers).addTo(modelMap);

  sidebarControl = L.control.sidebar("side-bar").addTo(modelMap);

  sidebarButton = L.easyButton(
    '<i class="fa-solid fa-right-left"></i>',
    function () {
      sidebarControl.toggle();
    }
  ).addTo(modelMap);

  /* context menu functionality */
  function showCoordinates(e) {
    alert(e.latlng);
  }

  function centerMap(e) {
    modelMap.panTo(e.latlng);
  }

  function zoomIn(e) {
    modelMap.zoomIn();
  }

  function zoomOut(e) {
    modelMap.zoomOut();
  }
});

/* USER INTERACTION */
function styleElements(json) {
  return {
    color: "#B2BEB5",
    weight: 1,
  };
}

$("#txt-find-element").on("keyup paste", function () {
  var val = $("#txt-find-element").val();
  console.log(val);
  testLayerAttribute(
    arrElementIDs,
    val,
    "ElementID",
    "#element-error-msg",
    "#btn-find-element"
  );
});

$("#btn-find-element").click(function () {
  var val = $("#txt-find-element").val();
  var lyr = returnLayerByAttribute(lyrElements, "ElementID", val);
  if (lyr) {
    if (lyrSearch) {
      lyrSearch.remove();
    }
    lyrSearch = L.geoJSON(lyr.toGeoJSON(), {
      style: { color: "red", weight: 10, opacity: 0.5 },
    }).addTo(modelMap);
    modelMap.fitBounds(lyr.getBounds().pad(1));
    var att = lyr.feature.properties;
    $("#element-data").html(
      "<h4 class='text-center'>Attributes</h4><table><tr><th>ElementID</th><th>Subregion</th></tr><tr><td>" +
        att.ElementID +
        "</td><td>" +
        att.SubRegion +
        "</td></tr></table>"
    );
    $("#element-error-msg").html("");

    fgpDrawnItems.clearLayers();
    fgpDrawnItems.addLayer(lyr);
  } else {
    $("#element-error-msg").html("**** Element ID not found ****");
  }
});

function processElements(json, lyr) {
  const att = json.properties;
  lyr.bindPopup(
    "<H4>Element ID: " + att.ElementID + "</H4>Subregion: " + att.SubRegion
  );
  arrElementIDs.push(att.ElementID.toString());
}

function filterElements(json) {
  var att = json.properties;
  var optFilter = $("option[name=fltElements]:selected").val();
  if (optFilter == "All") {
    return true;
  } else {
    return att.SubRegion == optFilter;
  }
}

$("#btnFltElements").click(function () {
  arrElementIDs = [];
  lyrElements.refresh();
});

function styleSWS(json) {
  return {
    color: "#c4abac",
    weight: 1,
  };
}

function processSWS(json, lyr) {
  const att = json.properties;
  lyr.bindPopup(
    "<H4>Small Watershed ID: " +
      att.SWSHED_ID +
      "</H4>Groundwater Node: " +
      att.GW_NODE +
      "<br>Stream Node: " +
      att.STR_NODE
  );
}

function styleStreamReaches(json) {
  return {
    color: "blue",
    weight: 2,
  };
}

function processStreamReaches(json, lyr) {
  const att = json.properties;
  lyr.bindPopup("<h4>" + att.Name + "</h4><br>Stream Reach ID:" + att.StreamID);
}

function testLayerAttribute(arr, val, att, err, btn) {
  if (arr.indexOf(val) < 0) {
    $(err).html("**** " + att + " NOT FOUND ****");
    $(btn).prop("disabled", true);
  } else {
    $(err).html("");
    $(btn).prop("disabled", false);
  }
}

function returnLayerByAttribute(lyr, att, val) {
  var arLayers = lyr.getLayers();
  for (i = 0; i < arLayers.length - 1; i++) {
    var ftrVal = arLayers[i].feature.properties[att];
    if (ftrVal == val) {
      return arLayers[i];
    }
  }
  return false;
}
