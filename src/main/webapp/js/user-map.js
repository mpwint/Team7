let editMarker;
let map;

function createMapIfLoggedIn(){
    fetch('/login-status')
    .then((response) => {
        return response.json();
    })
    .then((loginStatus) => {
        if (loginStatus.isLoggedIn) {

            var mapDiv = document.getElementById('map');

            var h1 = document.createElement("H1");
            var ait = document.createTextNode("Antarctica Institute of Technology");
            h1.appendChild(ait);
            h1.className = "heading";
            document.body.insertBefore(h1,mapDiv);

            var p = document.createElement("P");
            var description = document.createTextNode("Click on the map to place a new free listing marker!");
            p.appendChild(description);
            document.body.insertBefore(p,mapDiv);

            map = new google.maps.Map(document.getElementById('map'), {
              // Sets the center of the map to be Antarctica
              center: {lat: -77.305164, lng: 23.7427},
              zoom: 6
            });

            // Adds marker to map where user clicked
            map.addListener('click', (event) => {
              createMarkerForEdit(event.latLng.lat(), event.latLng.lng());
            });

            fetchMarkers();

            var iconBase = 'https://maps.google.com/mapfiles/kml/paddle/';
                var icons = {
                  free: {
                    name: 'Free',
                    icon: iconBase + 'F.png'
                  },
                  library: {
                    name: 'Hangout',
                    icon: iconBase + 'H.png'
                  }
            };

            var legend = document.getElementById('legend');
            for (var key in icons) {
              var type = icons[key];
              var name = type.name;
              var icon = type.icon;
              var div = document.createElement('div');
              div.innerHTML = '<img src="' + icon + '"> ' + name;
              legend.appendChild(div);
            }

            map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(legend);
        } else {
            // User not logged in
            alert("Please login to view the map");
        }
    });
}

// Uses Fetch API to get markers from server and adds each to the map
function fetchMarkers(){
  fetch('/user-markers').then((response) => {
    return response.json();
  }).then((markers) => {
    markers.forEach((marker) => {
     createMarkerForDisplay(marker.lat, marker.lng, marker.content)
    });
  });
}

// Adds a non-editable marker to the map
function createMarkerForDisplay(lat, lng, content){

  const marker = new google.maps.Marker({
    position: {lat: lat, lng: lng},
    // F denotes 'free'
    label: 'F',
    map: map
  });

  var infoWindow = new google.maps.InfoWindow({
    content: content
  });
  marker.addListener('click', () => {
    infoWindow.open(map, marker);
  });
}

// Sends new markers to the server
function postMarker(lat, lng, content){
  const params = new URLSearchParams();
  params.append('lat', lat);
  params.append('lng', lng);
  params.append('content', content);

  fetch('/user-markers', {
    method: 'POST',
    body: params
  });
}

// Creates map marker that takes in info from the user
function createMarkerForEdit(lat, lng){

  // Calling setMap(null) on the previous marker before creating a new one
  // so that only one Info Window can be open at a time
  if(editMarker){
   editMarker.setMap(null);
  }

  editMarker = new google.maps.Marker({
    position: {lat: lat, lng: lng},
    label: 'F',
    map: map
  });

  // Populates the user input content in an Info Window that we attach to our marker
  const infoWindow = new google.maps.InfoWindow({
    content: buildInfoWindowInput(lat, lng)
  });

  // Removes the marker when the user closes the Info Window
  google.maps.event.addListener(infoWindow, 'closeclick', () => {
    editMarker.setMap(null);
  });

  infoWindow.open(map, editMarker);
}

// Builds a div that contains a textarea and a button
function buildInfoWindowInput(lat, lng){
  const textBox = document.createElement('textarea');
  textBox.placeholder = "Title: \nDescription: \n";
  const button = document.createElement('button');
  button.appendChild(document.createTextNode('Submit'));

  // When user clicks submit, send data to server and display marker on map
  button.onclick = () => {
    postMarker(lat, lng, textBox.value);
    createMarkerForDisplay(lat, lng, textBox.value);
    // Removes the editable marker after adding display marker
    editMarker.setMap(null);
  };

  const containerDiv = document.createElement('div');
  containerDiv.appendChild(textBox);
  containerDiv.appendChild(document.createElement('br'));
  containerDiv.appendChild(button);

  return containerDiv;
}