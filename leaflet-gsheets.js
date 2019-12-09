
/*
 * Script to display two tables from Google Sheets as point and polygon layers using Leaflet
 * The Sheets are then imported using Tabletop.js and overwrite the initially laded layers
 */


// init() is called as soon as the page loads
function init() {

  // PASTE YOUR URLs HERE
  // these URLs come from Google Sheets 'shareable link' form
  // the first is the polygon layer and the second the points
  var polyURL = 'https://docs.google.com/spreadsheets/d/1IUvPxkzFq-150l_tNod22UjmDiD2qZqRFyV3DU3ObUs/edit?usp=sharing';
  var pointsURL = 'https://docs.google.com/spreadsheets/d/1vAwVVkXdXVDvUKsMqRcwEI_rmr9t1q8Z-PLNiKncB1k/edit?usp=sharing';

  Tabletop.init( { key: polyURL,
    callback: addPolygons,
    simpleSheet: true } );
  Tabletop.init( { key: pointsURL,
    callback: addPoints,
    simpleSheet: true } );  // simpleSheet assumes there is only one table and automatically sends its data
}
window.addEventListener('DOMContentLoaded', init);

// Create a new Leaflet map centered on the continental US
var map = L.map('map').setView([41.15, -4.00], 9.3);

// This is the Carto Positron basemap
var basemap = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
	maxZoom: 18
});
basemap.addTo(map);

var sidebar = L.control.sidebar({
  container: 'sidebar',
  closeButton: true,
  position: 'right'
}).addTo(map);

panelID = 'my-info-panel'
var panelContent = {
  id: panelID,
  tab: '<i class="fa fa-bars active"></i>',
  pane: '<p id="sidebar-content"></p>',
  title: '<h2 id="sidebar-title">No state selected</h2>',
};
sidebar.addPanel(panelContent);

map.on('click', function (feature, layer) {
  sidebar.close(panelID);
});

// These are declared outisde the functions so that the functions can check if they already exist
var polygonLayer;
var pointGroupLayer;

// The form of data must be a JSON representation of a table as returned by Tabletop.js
// addPolygons first checks if the map layer has already been assigned, and if so, deletes it and makes a fresh one
// The assumption is that the locally stored JSONs will load before Tabletop.js can pull the external data from Google Sheets
function addPolygons(data) {
  if (polygonLayer != null) {
    // If the layer exists, remove it and continue to make a new one with data
    polygonLayer.remove()
  }

  // Need to convert the Tabletop.js JSON into a GeoJSON
  // Start with an empty GeoJSON of type FeatureCollection
  // All the rows will be inserted into a single GeoJSON
  var geojsonStates = {
    'type': 'FeatureCollection',
    'features': []
  };

  for (var row in data) {
    // The Sheets data has a column 'include' that specifies if that row should be mapped
    if (data[row].include == 'y') {
      var coords = JSON.parse(data[row].geometry);

      geojsonStates.features.push({
        'type': 'Feature',
        'geometry': {
          'type': 'MultiPolygon',
          'coordinates': coords
        },
        'properties': {
          'name': data[row].name,
          'summary': data[row].summary,
          'state': data[row].state,
          'local': data[row].local,
        }
      });
    }
  }

  // The polygons are styled slightly differently on mouse hovers
  var polygonStyle = {'color': '#2ca25f', 'fillColor': '#FFFFFF80', 'weight': 1.5};
  //var polygonHoverStyle = {'color': 'green', 'fillColor': '#2ca25f', 'weight': 3};

  polygonLayer = L.geoJSON(geojsonStates, {
    //onEachFeature: function (feature, layer) {
      //layer.on({
        //mouseout: function(e) {
        //  e.target.setStyle(polygonStyle);
        //},
        //mouseover: function(e) {
        //  e.target.setStyle(polygonHoverStyle);
        //},
        //click: function(e) {
          // Esto acerca el mapa al polígono seleccionado
          // map.fitBounds(e.target.getBounds());

          // if this isn't added, then map.click is also fired!
          //L.DomEvent.stopPropagation(e);

          //document.getElementById('sidebar-title').innerHTML = e.target.feature.properties.name;
          //document.getElementById('sidebar-content').innerHTML = e.target.feature.properties.summary;
          //sidebar.open(panelID);
        //}
      //});
    //},
    style: polygonStyle
  }).addTo(map);
}

// addPoints is a bit simpler, as no GeoJSON is needed for the points
// It does the same check to overwrite the existing points layer once the Google Sheets data comes along
function addPoints(data) {
  if (pointGroupLayer != null) {
    pointGroupLayer.remove();
  }
  pointGroupLayer = L.layerGroup().addTo(map);

  for(var row = 0; row < data.length; row++) {
    var marker = L.marker([data[row].Latitud, data[row].Longitud], {
		title: (data[row].Especie+ ' / ' + data[row].Fecha),
		//draggable:false,
		opacity: 1
	}).addTo(pointGroupLayer);

    // UNCOMMENT THIS LINE TO USE POPUPS
    // marker.bindPopup(data[row].N + ' / ' + data[row].Especie + ' / ' + data[row].Fecha);

    // COMMENT THE NEXT 14 LINES TO DISABLE SIDEBAR FOR THE MARKERS
    marker.feature = {
      properties: {
		N: data[row].N, 
		Usuario: data[row].Usuario,
        Clase: data[row].Clase,
        Especie: data[row].Especie,
		Fecha: data[row].Fecha,
		Seguridad_id: data[row].Seguridad_id,
		Frecuencia_paso: data[row].Frecuencia_paso,
		Carretera: data[row].Carretera,
		Pk: data[row].Pk,
		Foto: data[row].Foto,
		Observaciones: data[row].Observaciones,
      }
    };
    marker.on({
      click: function(e) {
        L.DomEvent.stopPropagation(e);
        document.getElementById('sidebar-title').innerHTML = e.target.feature.properties.Especie;
        document.getElementById('sidebar-content').innerHTML = (
			'N: ' + e.target.feature.properties.N + '<br/>' +
			'Usuario: ' + e.target.feature.properties.Usuario + '<br/>' +
			'Fecha: ' + e.target.feature.properties.Fecha + '<br/>' +
			//'Clase: ' + e.target.feature.properties.Clase + '<br/>' +
			//'Especie: ' + e.target.feature.properties.Especie + '<br/>' +
			'Seguridad_id: ' + e.target.feature.properties.Seguridad_id + '<br/>' +
			'Frecuencia_paso: ' + e.target.feature.properties.Frecuencia_paso + '<br/>' +
			'Carretera: ' + e.target.feature.properties.Carretera + '<br/>' +	
			'Pk: ' + e.target.feature.properties.Pk + '<br/>' +
			//'Foto: ' + e.target.feature.properties.Foto + '<br/>' +
			'Observaciones: ' + e.target.feature.properties.Observaciones + '<br/>' +
			'<img src="' + e.target.feature.properties.Foto + '" width="275">' 
			);		
		
        sidebar.open(panelID);
      }
    });

	//<i class='fas fa-map-marker-alt' style='font-size:24px;color:red'></i>
	
    // For Awesome icons use, see master branch
    var icon = L.icon({
    iconUrl: getIcon(data[row].Clase),
    iconSize: [20, 30],
    iconAnchor: [10, 30],
    popupAnchor: [0, -30],
    //shadowUrl: 'css/images/markers-shadow.png',
    //shadowSize: [30, 10],
    //shadowAnchor: [5, 5]
    });
    marker.setIcon(icon);
  }
}

// Returns different colors depending on the string passed
// Used for the points layer
  function getIcon(type) {
  switch (type) {
    case 'MAMIFERO':
      return 'css/images/marker-icon-red.png';
    case 'AVE':
      return 'css/images/marker-icon-yellow.png';
	 case 'REPTIL':
      return 'css/images/marker-icon-green.png';
	 case 'ANFIBIO':
     return 'css/images/marker-icon-blue.png';
    default:
      return 'pink';
  }
}
