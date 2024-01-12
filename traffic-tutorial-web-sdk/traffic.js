var apiKey = 'LV0YAdniBN99sBdObDGUaPGalGmpRu4R';
var centerCoords = [4.89218, 52.37187];
var initialZoom = 14;
var map = tt.map({
    key: 'LV0YAdniBN99sBdObDGUaPGalGmpRu4R',
    container: "map",
    center: centerCoords,
    zoom: initialZoom,
    interactive:true



});
map.addControl(new tt.GeolocateControl({
    positionOptions: {
        enableHighAccuracy: true

    },
}));
let startPoint = null;
let endPoint = null;
var searchBoxInstance;
var startCornerLngLat;
var endCornerLngLat;
var mousePressed;
var drawBoundingBoxButtonPressed;
var layerFillID = "layerFillID";
var layerOutlineID = "layerOutlineID";
var sourceID = "sourceID";
var styleBase = "tomtom://vector/1/";
var styleS1 = "s1";
var styleRelative = "relative";
var refreshTimeInMillis = 30000;
var popupHideDelayInMilis = 4000;
var incidentListContainer = document.getElementById("incident-list");
var trafficFlowTilesToggle = document.getElementById("flow-toggle");

var trafficIncidentsTier = new tt.TrafficIncidentTier({
    key: 'LV0YAdniBN99sBdObDGUaPGalGmpRu4R',
    incidentDetails: {
        style: styleS1
    },
    incidentTiles: {
        style: styleBase + styleS1,
    },
    refresh: refreshTimeInMillis
});

var trafficFlowTilesTier = new tt.TrafficFlowTilesTier({
    key: 'LV0YAdniBN99sBdObDGUaPGalGmpRu4R',
    style: styleBase + styleRelative,
    refresh: refreshTimeInMillis
});

var commonSearchBoxOptions = {
    key: apiKey,
    center: map.getCenter()
};


function toggleTrafficFlowTilesTier() {
    if (trafficFlowTilesToggle.checked) {
        map.addTier(trafficFlowTilesTier);
    } else {
        map.removeTier(trafficFlowTilesTier.getId());
    }
}

function showTrafficIncidentsTier() {
    document.getElementById("incidents-toggle").checked = true;
    map.addTier(trafficIncidentsTier);
}

function hideTrafficIncidentsTier() {
    document.getElementById("incidents-toggle").checked = false;
    map.removeTier(trafficIncidentsTier.getId());
    clearIncidentList();
    removeBoundingBox();
}

function toggleTrafficIncidentsTier() {
    if (document.getElementById("incidents-toggle").checked) {
        showTrafficIncidentsTier();
    } else {
        hideTrafficIncidentsTier();
    }
}

function updateSearchBoxOptions() {
    var updatedOptions = Object.assign(commonSearchBoxOptions, {
        center: map.getCenter()
    });
    searchBoxInstance.updateOptions({
        minNumberOfCharacters: 0,
        searchOptions: updatedOptions,
        autocompleteOptions: updatedOptions
    });
}


function updateWeatherInfo(city, temperature) {
    const temperatureCelsius = temperature;
    const temperatureFahrenheit = convertCelsiusToFahrenheit(temperatureCelsius);

    const weatherInfoDiv = document.getElementById('weatherInfo');
    weatherInfoDiv.innerHTML = `<p>Temperature in ${city}: ${temperatureCelsius}°C / ${temperatureFahrenheit}°F</p>`;
}


function onSearchBoxResult(result) {
    map.flyTo({
        center: result.data.result.position,
        speed: 3
    });

    const city = result.data.result.address["municipality"];
    console.log(city)
    getWeather(city);
}


function getWeather(city) {
    const apiKey = 'fd455eb5bbfc4e80871213133231212';
    const url = `http://api.weatherapi.com/v1/current.xml?key=fd455eb5bbfc4e80871213133231212&q=${city}&aqi=no`;

    fetch(url)
        .then(response => response.text())
        .then(data => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(data, 'text/xml');
            const temperature = xmlDoc.getElementsByTagName('temp_c')[0].childNodes[0].nodeValue;

            updateWeatherInfo(city, temperature);

        })
        .catch(error => {
            console.error('Error fetching weather data:', error);
        });
}
function convertCelsiusToFahrenheit(celsius) {
    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
    <soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
      <soap12:Body>
        <CelsiusToFahrenheit xmlns="https://www.w3schools.com/xml/">
          <Celsius>${celsius}</Celsius>
        </CelsiusToFahrenheit>
      </soap12:Body>
    </soap12:Envelope>`;

    fetch('https://www.w3schools.com/xml/tempconvert.asmx', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/soap+xml',
        },
        body: soapRequest,
    })
        .then((response) => response.text())
        .then((data) => {
            console.log(data);
        })
        .catch((error) => {
            console.error('SOAP request error:', error);
        });
}


function enableBoundingBoxDraw() {
    showInfoPopup("Click and mark your point");
    drawBoundingBoxButtonPressed = true;
    removeBoundingBox();
    clearIncidentList();
}

function getPopupWrapper() {
    return document.getElementById("popup-wrapper");
}

function showPopup(element) {
    element.style.opacity = "0.9";
}

function showInfoPopup(message) {
    var popupElementDiv = getPopupWrapper();
    popupElementDiv.innerHTML = getPopupInnerHTML("popup-info", message);
    showPopup(popupElementDiv);
}

function showErrorPopup(message) {
    var popupElementDiv = getPopupWrapper();
    popupElementDiv.innerHTML = getPopupInnerHTML("popup-error", message);
    showPopup(popupElementDiv);
}

function hidePopup(delayInMilis) {
    var element = getPopupWrapper();
    if (delayInMilis == 0) {
        element.style.opacity = "0";
    } else {
        setTimeout(function () {
            element.style.opacity = "0";
        }, delayInMilis);
    }
}

function getPopupInnerHTML(popupClass, popupMessage) {
    return `<div class="container ${popupClass} popup"> <div class="row"> <div class="col py-2"> <div class="row align-items-center pt-1"> <div class="col-sm-1"> <img src="img/error-symbol.png" alt=""/> </div><div id="popup-message" class="col"> ${popupMessage} </div></div></div></div></div>`;
}

function removeBoundingBox() {
    if (map.getSource(sourceID)) {
        map.removeLayer(layerFillID);
        map.removeLayer(layerOutlineID)
        map.removeSource(sourceID);
    }
}

function onMouseDown(eventDetails) {
    if (drawBoundingBoxButtonPressed) {
        eventDetails.preventDefault();
        const startCornerLngLat = eventDetails.lngLat;

        const incidentDetails = prompt("Please enter incident details:");

        if (incidentDetails !== null && incidentDetails.trim() !== '') {
            const marker = new tt.Marker().setLngLat(startCornerLngLat).addTo(map);
            marker.getElement().innerHTML = "<img style='background-color: red; position: absolute' src='./img/error-symbol.png'>";

            const popup = new tt.Popup({ className: 'tt-popup', offset: 20 })
                .setHTML(`Incident: ${incidentDetails}`)
                .setLngLat(startCornerLngLat)
                .addTo(map);

            marker.getElement().addEventListener('mouseenter', () => {
                popup.addTo(map);
            });

            marker.getElement().addEventListener('mouseleave', () => {
                popup.remove();
            });

            const incident = {
                details: incidentDetails,
                latitude: startCornerLngLat.lat,
                longitude: startCornerLngLat.lng
            };

            fetch('http://localhost:8081/incidents', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(incident)
            })
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    }
                    throw new Error('Failed to add incident');
                })
                .then(data => {
                    console.log('Incident added:', data);
                })
                .catch(error => {
                    console.error('Error adding incident:', error);
                });
        }

        drawBoundingBoxButtonPressed = false;
    }
}

map.on('mousedown', onMouseDown);




function fetchAndMarkIncidents() {
    fetch('http://localhost:8081/incidents/all')
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Failed to fetch incidents');
        })
        .then(data => {
            data.forEach(incident => {
                const marker = new tt.Marker().setLngLat([incident.longitude, incident.latitude]).addTo(map);
                marker.getElement().innerHTML = "<img style='background-color: red; position: absolute' src='./img/error-symbol.png'>";

                marker.getElement().addEventListener('click', () => {
                    const popup = new tt.Popup().setHTML(`Incident Details: ${incident.details}`).addTo(marker);
                });
            });
        })
        .catch(error => {
            console.error('Error fetching incidents:', error);
        });
}
function flyToCurrentPosition() {
     {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function (position) {
                    const {latitude, longitude} = position.coords;
                    map.flyTo({center: [longitude, latitude], zoom: initialZoom});

                    const marker = new tt.Marker().setLngLat([longitude, latitude]).addTo(map);

                    fetchNearbyIncidents({latitude, longitude});
                },
                function (error) {
                    console.error('Error getting current position:', error);
                },
                {
                    enableHighAccuracy: true
                }
            );
        } else {
            console.error('Geolocation is not supported by this browser.');
        }
    }
}
function fetchNearbyIncidents(userLocation) {
    fetch('http://localhost:8081/incidents/all')
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Failed to fetch incidents');
        })
        .then(data => {
                const nearbyIncidents = data.filter(incident => {
                const incidentLocation = { latitude: incident.latitude, longitude: incident.longitude };
                const distance = calculateDistance(userLocation, incidentLocation);

                const proximityThreshold = 5;

                return distance <= proximityThreshold;
            });

            console.log('Nearby Incidents:', nearbyIncidents);
        })
        .catch(error => {
            console.error('Error fetching nearby incidents:', error);
        });
}


function calculateDistance(location1, location2) {
    const earthRadius = 6371;
    const lat1 = location1.latitude;
    const lon1 = location1.longitude;
    const lat2 = location2.latitude;
    const lon2 = location2.longitude;

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadius * c;

    return distance;
}

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

navigator.geolocation.getCurrentPosition(
    position => {
        const { latitude, longitude } = position.coords;
        const userLocation = { latitude, longitude };
        fetchNearbyIncidents(userLocation);
    },
    error => {
        console.error('Error getting user location:', error);
    }
);


document.addEventListener('DOMContentLoaded', function () {
    const defaultCity = 'Tunis';
    getWeather(defaultCity);
});

function onMouseMove(eventDetails) {
    if (mousePressed) {
        endCornerLngLat = eventDetails.lngLat;
        updateRectangleData(startCornerLngLat, endCornerLngLat);
    }
}

function onMouseUp(eventDetails) {
    mousePressed = false;
    hidePopup(0);
    if (drawBoundingBoxButtonPressed) {
        endCornerLngLat = eventDetails.lngLat;
        if (bothLngLatAreDifferent(startCornerLngLat, endCornerLngLat)) {
            updateRectangleData(startCornerLngLat, endCornerLngLat);
            clearIncidentList();
            displayTrafficIncidents(getLngLatBoundsForIncidentDetailsCall(startCornerLngLat, endCornerLngLat));
            showTrafficIncidentsTier();
        } else {

        }
    }
    drawBoundingBoxButtonPressed = false;
}

function bothLngLatAreDifferent(lngLat1, lngLat2) {
    return lngLat1.lat !== lngLat2.lat && lngLat1.lng !== lngLat2.lng;
}

function updateRectangleData(startCornerLngLat, endCornerLngLat) {
    map.getSource(sourceID).setData(getPolygonSourceData(startCornerLngLat, endCornerLngLat));
}

function getLngLatBoundsForIncidentDetailsCall(startCornerLngLat, endCornerLngLat) {
    var bottomLeftCorner = new tt.LngLat(
        startCornerLngLat.lng < endCornerLngLat.lng ? startCornerLngLat.lng : endCornerLngLat.lng,
        startCornerLngLat.lat < endCornerLngLat.lat ? startCornerLngLat.lat : endCornerLngLat.lat);
    var topRightCorner = new tt.LngLat(
        startCornerLngLat.lng > endCornerLngLat.lng ? startCornerLngLat.lng : endCornerLngLat.lng,
        startCornerLngLat.lat > endCornerLngLat.lat ? startCornerLngLat.lat : endCornerLngLat.lat);
    return tt.LngLatBounds.convert([bottomLeftCorner.toArray(), topRightCorner.toArray()]);
}

function getPolygonSourceData(startCornerLngLat, endCornerLngLat) {
    return {
        type: "Feature",
        geometry: {
            type: "Polygon",
            coordinates: [
                [
                    [startCornerLngLat.lng, startCornerLngLat.lat],
                    [startCornerLngLat.lng, endCornerLngLat.lat],
                    [endCornerLngLat.lng, endCornerLngLat.lat],
                    [endCornerLngLat.lng, startCornerLngLat.lat],
                    [startCornerLngLat.lng, startCornerLngLat.lat]
                ]
            ]
        }
    };
}

function getPolygonSource(startCornerLngLat, endCornerLngLat) {
    return {
        type: "geojson",
        data: getPolygonSourceData(startCornerLngLat, endCornerLngLat)
    };
}

function clearIncidentList() {
    incidentListContainer.innerHTML = "";
}

function isCluster(incident) {
    return incident.id.includes("CLUSTER");
}

function displayTrafficIncidents(boundingBox) {
    var iconsMapping = ["danger", "accident", "fog", "danger", "rain", "ice", "incident", "laneclosed", "roadclosed", "roadworks", "wind", "flooding", "detour", ""];
    var delayMagnitudeMapping = ["unknown", "minor", "moderate", "major", "undefined"];

    tt.services.incidentDetails({
            key: apiKey,
            boundingBox: boundingBox,
            style: styleS1,
            zoomLevel: parseInt(map.getZoom())
        })
        .go()
        .then(function (results) {
            if (results.tm.poi.length === 0) {
                showErrorPopup("There are no traffic incidents in this area.");
                hidePopup(popupHideDelayInMilis);
            } else {
                results.tm.poi.forEach(function (incident) {
                    var buttonListItem = createButtonItem(incident.p);

                    if (isCluster(incident)) {
                        buttonListItem.innerHTML = getButtonClusterContent(incident.id, incident.cs, delayMagnitudeMapping[incident.ty]);
                        incidentListContainer.appendChild(buttonListItem);
                    } else {
                        buttonListItem.innerHTML = getButtonIncidentContent(incident.d.toUpperCase(), iconsMapping[incident.ic], delayMagnitudeMapping[incident.ty], incident.f, incident.t);
                        incidentListContainer.appendChild(buttonListItem);
                    }
                });
            }
        });
}

function createButtonItem(incidentPosition) {
    var incidentBtn = document.createElement("button");
    incidentBtn.setAttribute("type", "button");
    incidentBtn.classList.add("list-group-item", "list-group-item-action", "incidendDetailsListItemButton");
    incidentBtn.addEventListener("click", function () {
        map.flyTo({
            center: incidentPosition
        });
    }, false);

    return incidentBtn;
}

function getButtonIncidentContent(description, iconCategory, delayMagnitude, fromAddress, toAddress) {
    return `<div class="row align-items-center pb-2"> <div class="col-sm-2"> <div class="tt-traffic-icon"> <div class="tt-icon-circle-${delayMagnitude} traffic-icon"> <div class="tt-icon-${iconCategory}"></div></div></div></div><div class="col label pl-0"> ${description} </div></div><div class="row"> <div class="col-sm-2"><label class="label">From: </label></div><div class="col"><label class="incident-details-list-normal-text">${fromAddress}</label> </div></div><div class="row"> <div class="col-sm-2"><label class="label">To: </label></div><div class="col"><label class="incident-details-list-normal-text">${toAddress}</label></div></div>`;
}

function getButtonClusterContent(description, numberOfIncidents, delayMagnitude) {
    return `<div class="row align-items-center pb-2"> <div class="col-sm-2"> <div class="tt-traffic-icon"> <div class="tt-icon-circle-${delayMagnitude} traffic-icon"> <div id="cluster-icon" class="tt-icon-number">${numberOfIncidents}</div></div></div></div><div class="col label pl-0"> ${description} </div></div>`;
}

function initApplication() {
    getWeather('Tunis');
    
    searchBoxInstance = new tt.plugins.SearchBox(tt.services, {
        minNumberOfCharacters: 0,
        labels: {
            placeholder: "Search"
        },
        noResultsMessage: "No results found.",
        searchOptions: commonSearchBoxOptions,
        autocompleteOptions: commonSearchBoxOptions
    });

    searchBoxInstance.on("tomtom.searchbox.resultselected", onSearchBoxResult);

    document.getElementById("search-panel").append(searchBoxInstance.getSearchBoxHTML());
    trafficFlowTilesToggle.addEventListener("change", toggleTrafficFlowTilesTier);
    document.getElementById("incidents-toggle").addEventListener("change", toggleTrafficIncidentsTier);
    document.getElementById("bounding-box-button").addEventListener("click", enableBoundingBoxDraw);

    map.on("mousedown", onMouseDown);
    map.on("mouseup", onMouseUp);
    map.on("mousemove", onMouseMove);
    map.on("moveend", updateSearchBoxOptions);
    flyToCurrentPosition();
    fetchAndMarkIncidents();
}

initApplication();