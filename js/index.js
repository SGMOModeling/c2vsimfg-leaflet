$(document).ready(function () {
  /* BASE MAP LAYERS */
  const lyrOSM = L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png");

  const Esri_WorldImagery = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution:
        "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    }
  );

  // create map
  const modelMap = L.map("map", {
    center: [38.5816, -121.4944],
    zoom: 8,
    layers: [lyrOSM, Esri_WorldImagery],
  });

  /* MAP DATA */
  const lyrElements = L.geoJSON
    .ajax("data/i08_C2VSimFG_Elements.geojson", {
      style: styleElements,
      onEachFeature: processElements,
    })
    .addTo(modelMap);

  const lyrStreamReaches = L.geoJSON
    .ajax("data/i08_C2VSimFG_Stream_Reaches.geojson")
    .addTo(modelMap);

  const lyrSmallWatersheds = L.geoJSON
    .ajax("data/i08_C2VSimFG_Small_Watersheds.geojson", {
      style: styleSWS,
      onEachFeature: processSWS,
    })
    .addTo(modelMap);

  // zoom to layer
  lyrElements.on("data:loaded", function () {
    modelMap.fitBounds(lyrElements.getBounds());
  });

  /* MAP CONTROLS */
  // set-up layer control
  const baseMaps = {
    "Open Street Map": lyrOSM,
    "ESRI World Imagery": Esri_WorldImagery,
  };

  const mapLayers = {
    "C2VSimFG Elements": lyrElements,
    "C2VSimFG Stream Reaches": lyrStreamReaches,
    "C2VSimFG Small Watersheds": lyrSmallWatersheds,
  };

  const layerControl = L.control.layers(baseMaps, mapLayers).addTo(modelMap);

  //
});

/* USER INTERACTION */
function styleElements(json) {
  return {
    color: "#B2BEB5",
    weight: 1,
  };
}

function processElements(json, lyr) {
  const att = json.properties;
  lyr.bindPopup(
    "<H4>Element ID: " + att.ElementID + "</H4>Subregion: " + att.SubRegion
  );
}

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
