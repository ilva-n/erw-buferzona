import './style.css';
import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat, toLonLat } from 'ol/proj.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import Style from 'ol/style/Style';
import CircleStyle from 'ol/style/Circle';
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';
import Text from 'ol/style/Text';
import { Circle, Point } from 'ol/geom';
import Feature from 'ol/Feature.js';
import Translate from 'ol/interaction/Translate.js'
import Overlay from 'ol/Overlay.js'
import Collection from 'ol/Collection.js';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, collection, addDoc, getDocs, setDoc, deleteDoc } from 'firebase/firestore/lite';
import { novadiFillObj, novadiStrokeObj, largeFont } from './utils/consts.js'
import { mazciemiFillObj, mazciemiStrokeObj, smallFont, pointFillObj0, pointFillObj2, pointStrokeObj, oldPointFill } from './utils/consts.js'
import { circleFillObj, circleStrokeObj, centerFillObj, centerStrokeObj } from './utils/consts.js'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const rigaLonLat = [24.19299413, 56.959581153];
const rigaWebMercator = fromLonLat(rigaLonLat);

const baseLayer =  new TileLayer({
  source: new OSM()
})


// Vector source and layer for Buferzona
const buferzonaVectorSource = new VectorSource();
const buferzonaVectorLayer = new VectorLayer({
  source: buferzonaVectorSource,
});

// Vector Layer and Source for Points
const apsekojumiVectorSource = new VectorSource();
const apsekojumiVectorLayer = new VectorLayer({
  source: apsekojumiVectorSource,
});


// map
const map = new Map({
  target: 'map',
  layers: [baseLayer, buferzonaVectorLayer, apsekojumiVectorLayer],
  view: new View({
    //center: [0, 0],
    center: rigaWebMercator,
    zoom: 8
  })
});

// Kartes slāņi novadiem, adresēm.
let novadiVectorLayer = null;
let mazciemiVectorLayer = null;

// GeoJSON vector sources
const novadiGeojsonSource = new VectorSource({
    url: '/adreses/novadi.geojson', // Provide the URL to your GeoJSON
    format: new GeoJSON()
  }) 
  
//mazciemi
const mazciemiGeojsonSource = new VectorSource({
  url: '/adreses/mazciemi.geojson', // Provide the URL to your GeoJSON
  format: new GeoJSON()
})

// Stili novadu, ēku un mazciemu lāņiem
const novadiGeojsonStyle = new Style({
  fill: new Fill(novadiFillObj),
  stroke: new Stroke(novadiStrokeObj),
  text: new Text({
    font: largeFont,
    fill: new Fill({ color: '#000' }),
    stroke: new Stroke({ color: '#fff', width: 2 })
  })
});

//mazciemi
const mazciemiPointVisibleStyle = new Style({
  image: new CircleStyle({
    radius: 6,
    fill: new Fill(mazciemiFillObj),
    stroke: new Stroke(mazciemiStrokeObj)
  })
});

const mazciemiLabeltVisibleStyle = new Style({
  image: new CircleStyle({
    radius: 6,
    fill: new Fill(mazciemiFillObj),
    stroke: new Stroke(mazciemiStrokeObj)
  }),
  text: new Text({
    font: smallFont,
    fill: new Fill({ color: 'black'}),
    text: ''
  })
});
  
//Layer visibility
const novadiCheckbox = document.getElementById('novadi-checkbox');
const buferzonasCheckbox = document.getElementById('buferzonas-checkbox');
const apsekojumiCheckbox = document.getElementById('apsekojumi-checkbox');
const mazciemiCheckbox = document.getElementById('mazciemi-checkbox');

// Toggle layer visibility checking checkbox
novadiCheckbox.addEventListener('change', function(){
  if (this.checked) {
    if (!novadiVectorLayer){
      novadiVectorLayer = new VectorLayer({
        source: novadiGeojsonSource,
        style: function (feature) {
          // Optionally label features by an attribute (e.g., 'name')
          novadiGeojsonStyle.getText().setText(feature.get('NOSAUKUMS') || ''); // Replace 'name' with your GeoJSON's property
          return novadiGeojsonStyle;
        },
      });
      map.addLayer(novadiVectorLayer);
    }
    novadiVectorLayer.setVisible(true);
  } else {
    if (novadiVectorLayer) {
      novadiVectorLayer.setVisible(false);
    }
  }
});

mazciemiCheckbox.addEventListener('change', function(){
  if (this.checked) {
    if (! mazciemiVectorLayer){
      mazciemiVectorLayer = new VectorLayer({
        source: mazciemiGeojsonSource,
        style: function (feature, resolution) {
          // Set zoom thresholds: adjust the resolution for your needs
          const maxLabelResolution = 70; // Labels visible when zoomed in (lower resolution = closer zoom)
          const maxPointResolution = 200; // Points visible until this resolution
          
          // Determine which style to apply based on resolution
          if (resolution > maxPointResolution) {
            // Too far out: no points or labels
            return null;
          } else if (resolution > maxLabelResolution) {
            // Zoomed in enough for points, but not for labels
            return mazciemiPointVisibleStyle;
          } else {
            // Zoomed in enough for both points and labels
            mazciemiLabeltVisibleStyle.getText().setText(feature.get('NOSAUKUMS') || ''); // Replace 'name' with your GeoJSON's property 
            return mazciemiLabeltVisibleStyle;
          }
        },
      });
      map.addLayer(mazciemiVectorLayer);
    }
    mazciemiVectorLayer.setVisible(true);
  } else {
    if (mazciemiVectorLayer){
      mazciemiVectorLayer.setVisible(false);
    }
  }
});

apsekojumiCheckbox.addEventListener('change', function(){
  apsekojumiVectorLayer.setVisible(this.checked);
});

buferzonasCheckbox.addEventListener('change', function(){
  buferzonaVectorLayer.setVisible(this.checked);
});

// parauga numura ierakstīšanas kastīte
document.getElementById('sampleCheckbox').addEventListener('change', function () {
  const sampleInputContainer = document.getElementById('sampleInputContainer');
  const pozitivsCheckbox = document.getElementById('pozitivsCheckbox');
  if (this.checked) {
      sampleInputContainer.style.visibility = 'visible';
      pozitivsCheckbox.style.visibility = 'visible';
      sampleInputContainer.style.opacity = '1';
      pozitivsCheckbox.style.opacity = '1';
      sampleInputContainer.style.height = 'auto';
      pozitivsCheckbox.style.height = 'auto';
  } else {
      sampleInputContainer.style.visibility = 'hidden';
      pozitivsCheckbox.style.visibility = 'hidden';
      sampleInputContainer.style.opacity = '0';
      pozitivsCheckbox.style.opacity = '0'; 
      sampleInputContainer.style.height = '0';
      pozitivsCheckbox.style.height = '0';
  }
});

 // Function to create and add a circle with center
function createMovableCircle(longitude, latitude, apraksts, firestoreId) {
    // zīmēt apļus (buferzonas)
    // Circle geometry with a fixed radius of 3 km (in meters)
    const radiusInMeters = 3000; // 3 km
    //const initialCenter = [2774380, 8438290]; // Replace with your initial coordinates (EPSG:3857)
    const initialCenter = fromLonLat([longitude, latitude]);
    // Create a circle feature and a center marker feature
    const circleFeature = new Feature({
      geometry: new Circle(initialCenter, radiusInMeters),
      Apraksts: apraksts
    });

    const centerFeature = new Feature({
      geometry: new Point(initialCenter),
    });

    // Attach Firestore document ID to features
    centerFeature.setId(firestoreId);

    // Style for the circle
    const circleStyle = new Style({
      stroke: new Stroke(circleStrokeObj),
      fill: new Fill(circleFillObj)
    });

    // Style for the center point
    const centerStyle = new Style({
      image: new CircleStyle({
        radius: 4,
        fill: new Fill(centerFillObj),
        stroke: new Stroke(centerStrokeObj)
      })
    });

    // Apply styles to features
    circleFeature.setStyle(circleStyle);
    centerFeature.setStyle(centerStyle);

    // Add to vector source
    buferzonaVectorSource.addFeature(circleFeature);
    buferzonaVectorSource.addFeature(centerFeature);
  
    // Interaction to translate/move the features
    const translateInteraction = new Translate({
      features: new Collection([circleFeature, centerFeature])
    });

  // Update Firestore on move
  translateInteraction.on('translateend', async function (event) {
    const newCenter = centerFeature.getGeometry().getCoordinates();
    const [newLon, newLat] = toLonLat(newCenter);
    const featureId = centerFeature.getId(); // Get Firestore ID
  
    // Ensure center point stays inside circle
    circleFeature.getGeometry().setCenter(newCenter);
    if (featureId) {
      try {
        const docRef = doc(db, "Buferzonas", featureId);
        await setDoc(docRef, { centrelon: newLon, centrelat: newLat }, { merge: true });
        console.log(`Updated Firestore: ${featureId} -> [${newLon}, ${newLat}]`);
      } catch (error) {
        console.error("Error updating Firestore:", error);
      }
    }
  });
  // Add the translate interaction to the map
  map.addInteraction(translateInteraction);
}


// Function to create and add "Apsekojums" point feature
function createPointApsek(pointobj){
  const coordinates = fromLonLat([pointobj.longitude, pointobj.latitude]);
  const paraugs = pointobj.paraugu_nr && pointobj.paraugu_nr.trim() !== "" ? pointobj.paraugu_nr : "empty";
  const numericYear = Number(pointobj.year);
  let pointColorObj = pointFillObj2;
  let pointStroke = pointStrokeObj
  if (pointobj.paraugu_nr && pointobj.paraugu_nr.trim() !== ""){
    if (pointobj.pozitivs && pointobj.pozitivs == 1){
      pointColorObj = centerFillObj;
      pointStroke = centerStrokeObj;
    } else {
      pointColorObj = pointFillObj0
    }
  }
  if (!isNaN(numericYear) && numericYear < (new Date().getFullYear() - 2)){
    pointColorObj = oldPointFill;
  }
  const apsekpointFeature = new Feature({
    geometry: new Point(coordinates),
    year: pointobj.year,
    paraugu_nr: paraugs,
  });

  //set ID of the point from Firestore
  apsekpointFeature.setId(pointobj.id)

  // Style for the point
  const pointStyle = new Style({
    image: new CircleStyle({
      radius: 4,
      fill: new Fill(pointColorObj),
      stroke: new Stroke(pointStroke)
    })
  });
  apsekpointFeature.setStyle(pointStyle);
  apsekojumiVectorSource.addFeature(apsekpointFeature);
}

 // Load Apsekojumi Features from Firestore
 async function loadApsekojumi() {
  try {
    const apsekojumiCollectionRef = collection(db, "Apsekojumi");
    const querySnapshot = await getDocs(apsekojumiCollectionRef);

    if (querySnapshot.empty) {
        console.warn("No documents found in 'Apsekojumi' collection.");
        return; // Exit early if no data is available
    }
    querySnapshot.forEach(doc => {
      try {
        // Ensure data is valid before using it
        const data = doc.data();
        if (!data || !data.longitude || !data.latitude || !data.year) {
            console.warn(`Skipping document ${doc.id} due to missing fields.`);
            return;
        }
        const obj = {
          longitude: data.longitude,
          latitude: data.latitude,
          year: data.year,
          id: doc.id
        };
        if(data.paraugu_nr){
          obj.paraugu_nr = data.paraugu_nr;
          if (data.pozitivs){
            obj.pozitivs = 1
          } else {
            obj.pozitivs = 0
          }
        }
          createPointApsek(obj);
      } catch (docError) {
          console.error(`Error processing document ${doc.id}:`, docError);
      }
    });

  } catch (error) {
    console.error("Error loading 'Apsekojumi' data:", error);
  }
}


// Load Buferzonas Features from Firestore
async function loadBuferzonas() {
  try {
    const buferzonasCollectionRef = collection(db, "Buferzonas");
    const querySnapshot = await getDocs(buferzonasCollectionRef);

    if (querySnapshot.empty) {
      console.warn("No documents found in 'Buferzonas' collection.");
      return; // Exit early if no data is available
    }
    querySnapshot.forEach(doc => {
        try {
          // Extract document data and validate
          const data = doc.data();
          if (!data || !data.centrelon || !data.centrelat) {
            console.warn(`Skipping document ${doc.id} due to missing required fields.`);
            return;
          }

          const longitude = data.centrelon;
          const latitude = data.centrelat;
          const apraksts = data.Apraksts || "No description"; // Provide a default if missing
          const firestoreId = doc.id;

          // Create circle and center
          createMovableCircle(longitude, latitude, apraksts, firestoreId);
        } catch (docError) {
            console.error(`Error processing document ${doc.id}:`, docError);
        }
    });

  } catch (error) {
      console.error("Error loading 'Buferzonas' data:", error);
  }
}

// Function for Add Survey Site
async function addSurveySite() {
  const lon = parseFloat(document.getElementById('longitude').value);
  const lat = parseFloat(document.getElementById('latitude').value);
  const year = parseInt(document.getElementById('year').value);
  const paraugs = document.getElementById("sampleNumber").value.trim();

  if (!lon || !lat || !year) return alert("Garums, platums un gads obligāti!");
  const obj = {}
  obj.longitude = lon;
  obj.latitude = lat;
  obj.year = year;
  obj.pievien_datums = Date.now()
  if (paraugs !== ""){
     obj.paraugu_nr = paraugs;
     const pozitivs = document.getElementById("pozitivs");
     if (pozitivs.checked){
      obj.pozitivs = true
     } else {
      obj.pozitivs = false
     } 
  }

  try {
      const docRef = await addDoc(collection(db, "Apsekojumi"), obj);
      console.log("Document written with ID: ", docRef.id);
      obj.id = docRef.id
      delete obj.pievien_datums; // Removes the key
      createPointApsek(obj);

    } catch (error) {
      console.error("Error adding document: ", error);
    }
  
    // Clear input fields
  document.getElementById('longitude').value = '';
  document.getElementById('latitude').value = '';
  document.getElementById('year').value = '';
  document.getElementById('sampleNumber').value = '';
  document.getElementById("pozitivs").checked = false;
  document.getElementById("sampleCheckbox").checked = false;

  document.getElementById("sampleInputContainer").style.visibility = 'hidden';
  document.getElementById("pozitivsCheckbox").style.visibility = 'hidden';
  document.getElementById("sampleInputContainer").style.opacity = '0';
  document.getElementById("pozitivsCheckbox").style.opacity = '0'; 
  document.getElementById("sampleInputContainer").style.height = '0';
  document.getElementById("pozitivsCheckbox").style.height = '0';
}

  
// Function for adding  Buferzona
async function addBufferzona() {
  const longitude = parseFloat(document.getElementById('centrs-lon').value);
  const latitude = parseFloat(document.getElementById('centrs-lat').value);
  const apraksts = document.getElementById('komentars').value;
  if (isNaN(longitude) || isNaN(latitude)) {
    alert('Garums un platums ar cipariem');
    return;
  }

  try {
    // Add new document and get Firestore ID
    const docRef = await addDoc(collection(db, "Buferzonas"), {
      centrelon: longitude,
      centrelat: latitude,
      Apraksts: apraksts
    });

    console.log("Document written with ID: ", docRef.id);

    // Create a movable circle with Firestore ID attached
    createMovableCircle(longitude, latitude, apraksts, docRef.id);

  } catch (error) {
    console.error("Error adding document: ", error);
  }
  // Clear input fields
  document.getElementById('centrs-lon').value = '';
  document.getElementById('centrs-lat').value = '';
  document.getElementById('komentars').value = '';
}

loadApsekojumi();
loadBuferzonas();

// Add Point Functionality Event Listener
const addPointButton = document.getElementById('add-point');
addPointButton.addEventListener('click', addSurveySite);

// Event Listener for the Create Buferzona Button
document.getElementById('add-centre').addEventListener('click', addBufferzona);

// Create overlay for the popup
const popup = document.getElementById('popup');
const popupContent = document.getElementById('popup-content');
const deleteBtn = document.getElementById('delete-btn');
const overlay = new Overlay({
  element: popup,
  positioning: 'bottom-center',
  stopEvent: true
});
map.addOverlay(overlay);

// Detect features on mouse move / click and show attribute info
let selectedFeature = null; // Store selected feature
let popupLocked = false; // Track if popup should stay open
// Show feature info on hover (only if popup is not open)
map.on('pointermove', function (event) {
  if (popupLocked) return; // If a feature is clicked, don't hide popup on hover

  const feature = map.forEachFeatureAtPixel(event.pixel, (feature) => feature);
  if (feature && feature.get('year')) {
    if ((feature.get('paraugu_nr') && feature.get('paraugu_nr') == 'empty') || (! feature.get('paraugu_nr'))){
      popupContent.innerHTML = feature.get('year');
    } else {      
      popupContent.innerHTML = feature.get('year') + ", paraugs: " + feature.get('paraugu_nr');
    }
    
    overlay.setPosition(event.coordinate);
    popup.style.display = 'block';
      
  } else if (feature && feature.get('Apraksts')) {
      popupContent.innerHTML = feature.get('Apraksts');
      overlay.setPosition(event.coordinate);
      popup.style.display = 'block';
      deleteBtn.style.display = 'none';
  } else {
      if (!popupLocked) {
          popup.style.display = 'none'; // Hide only if no feature is clicked
      }
  }
});

// Click to select feature and lock popup
map.on('singleclick', function (event) {
  const feature = map.forEachFeatureAtPixel(event.pixel, (feature) => feature);
  if (feature && feature.get('year')) {
    selectedFeature = feature;
      popupContent.innerHTML = "Year: " + feature.get('year') + "; ID:" + selectedFeature.getId();
      deleteBtn.style.display = 'inline-block'; // Show delete button
      overlay.setPosition(event.coordinate);
      popup.style.display = 'block';
      popupLocked = true; // Lock popup in place
    
  } else {
      // Click on empty space hides popup
      popup.style.display = 'none';
      deleteBtn.style.display = 'none';
      popupLocked = false; // Unlock popup
  }
}); 

// Set the delete button action
deleteBtn.addEventListener("click", async function(event) {
  event.stopPropagation(); // Prevent map click event from firing
  console.log("Delete button clicked"); // Debugging
  if (!selectedFeature) {
        console.warn("No feature selected for deletion.");
        return;
    }
  const featureId = selectedFeature.getId(); // Get feature ID
  if (!featureId) {
      console.warn("Feature has no ID. Cannot delete.");
      return;
  }

  if (confirm("Are you sure you want to delete this feature?")) {
    apsekojumiVectorSource.removeFeature(selectedFeature); // Remove from map
    if (featureId) {
      //console.log(featureId)
      try {
          await deleteDoc(doc(db, "Apsekojumi", featureId)); // Remove from Firestore
          console.log("Deleted feature with ID:", featureId);
      } catch (error) {
          console.error("Error deleting feature:", error);
      }
    }

    popup.style.display = 'none'; // Hide popup after deletion
    popupLocked = false; // Unlock popup
    deleteBtn.style.display = 'none';
    selectedFeature = null;
  }
});

  // Function to Fetch Data from Apsekojumi & Download CSV
async function downloadCSV() {
  const snapshot = await getDocs(collection(db, "Apsekojumi"));
  const data = [];

  // Process Each Document
  snapshot.forEach(doc => {
    const docData = doc.data();
    data.push({
      latitude: docData.latitude || "",
      longitude: docData.longitude || "",
      paraugu_nr: docData.paraugu_nr || "",
      pievien_datums: docData.pievien_datums || "",
      pozitivs: docData.pozitivs !== undefined ? docData.pozitivs : "",
      year: docData.year || "",
      ID: doc.id
    });
  });

  // Convert Data to CSV Format
  const csvContent = [
  //  te latviešu burtu nebūs
  "latitude,longitude,paraugu_nr,pievien_datums,pozitivs,year,ID", // Headers
    ...data.map(row => Object.values(row).join(",")) // Data rows
  ].join("\n");

  // Create Blob & Trigger Download
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Apsekojumi.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Function to Fetch Data from Buferzonas & Download CSV
async function downloadCSVbz() {
  const snapshot = await getDocs(collection(db, "Buferzonas"));
  const data = [];

  // Process Each Document
  snapshot.forEach(doc => {
    const docData = doc.data();
    data.push({
      centrelat: docData.centrelat || "",
      centrelon: docData.centrelon || "",
      Apraksts: docData.Apraksts || "",
      ID: doc.id
    });
  });

  // Convert Data to CSV Format
  const csvContent = [
    "\uFEFFcentrelat,centrelon,Apraksts,ID", // UTF-8 BOM (latviešu burtiem) + Headers 
    ...data.map(row => Object.values(row).join(",")) // Data rows
  ].join("\n");


  // Create Blob & Trigger Download
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Buferzonas.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
  
  document.getElementById("csvButton").addEventListener("click", downloadCSV);
  document.getElementById("csvBuffer").addEventListener("click", downloadCSVbz);
