import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  map: any;
  selectedType: string = '';
  markers: any[] = [];
  userLat = 0;
  userLng = 0;

  iconMap: any = {
    restaurant: 'assets/restaurant.png',
    hospital: 'assets/hospital.png',
    atm: 'assets/atm-machine.png',
    default: 'assets/location-pin.png',
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.getLocation();
  }

  getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this.success, this.error, {
        maximumAge: 10 * 60 * 1000,
        // timeout: 0,
      });
    } else {
      alert('Geolocation is not supported by this browser.');
    }

    const id = navigator.geolocation.watchPosition(this.success, this.error);
    setTimeout(() => {
      navigator.geolocation.clearWatch(id);
      console.log('⏹️ Stopped watching location after 15 seconds');
    }, 15000);
  }

  success = (position: GeolocationPosition) => {
    this.userLat = position.coords.latitude;
    this.userLng = position.coords.longitude;
    // console.log(lat, long);
    // console.log('https://www.google.com/maps/@${long},@${lat}');

    // map options
    let mapOptions = {
      center: [this.userLat, this.userLng] as L.LatLngTuple,
      zoom: 11,
    };
    // create map
    this.map = L.map('map', mapOptions);

    // openstreetmap used to display map
    // create tilelayer
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(
      this.map
    );

    let customIcon = L.icon({
      iconUrl: this.iconMap['default'],
      iconSize: [40, 40],
    });

    // create marker
    let marker = L.marker([this.userLat, this.userLng], {
      title: 'My Location',
      draggable: false,
      icon: customIcon,
    });

    marker.addTo(this.map).bindPopup('📍 You are here').openPopup();
  };

  error = (err: GeolocationPositionError) => {
    alert('Error: ' + err.message);
  };

  onPlaceTypeChange() {
    if (!this.selectedType || !this.map) return;

    // Clear previous markers
    this.markers.forEach((marker) => this.map.removeLayer(marker));
    this.markers = [];

    // Overpass API query
    const overpassQuery = `
  [out:json];
  node["amenity"="${this.selectedType}"](around:3000,${this.userLat},${this.userLng});
  out;
`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
      overpassQuery
    )}`;

    this.http.get<any>(url).subscribe((data) => {
      console.log(data.elements); // Array of nodes/places
      if (!data.elements.length) {
        alert(`No nearby ${this.selectedType}s found.`);
        return;
      }
      for (let element of data.elements) {
        const lat = element.lat;
        const lon = element.lon;
        const name = element.tags?.name || this.selectedType;

        let customIcon = L.icon({
          iconUrl: this.iconMap[this.selectedType] || this.iconMap['default'],
          iconSize: [40, 40],
        });

        const marker = L.marker([lat, lon], { icon: customIcon })
          .addTo(this.map)
          .bindPopup(`<b>${name}</b>`);
        marker.bindTooltip(name);
        this.markers.push(marker);
      }
    });
  }
}
