import { Component, ViewEncapsulation, AfterViewInit } from '@angular/core';
import tt from '@tomtom-international/web-sdk-maps';
import { environment } from '../../environments/environment';
import {StaticPointsService} from "../../services/staticPointsService";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  encapsulation: ViewEncapsulation.None,
})

export class HomeComponent implements AfterViewInit {
  map: any;
  userLocation: any = { latitude: 0, longitude: 0 }; // Default values
  private currentMarker: any;


  constructor(
    private staticPointsService: StaticPointsService
  ) {}

  public ngAfterViewInit(): void {
    this.loadMap();

    this.fetchStaticPoints();
    this.addClickListener()
  }
  private getTrafficData(long: any, lat: any): void {
    const zoom = 12;
    const x = this.lon2tile(long, zoom);
    const y = this.lat2tile(lat, zoom);

    const sourceId = 'trafficFlow'; // Unique ID for traffic flow source
    const layerId = 'trafficFlowLayer'; // Unique ID for traffic flow layer

    const trafficFlowURL = `https://api.tomtom.com/traffic/services/4/flowVector/tile/relative/${zoom}/${x}/${y}.pbf?key=${environment.tomtom.key}`;

    // Remove existing traffic flow layer if present
    if (this.map.getLayer(layerId)) {
      this.map.removeLayer(layerId);
    }
    if (this.map.getSource(sourceId)) {
      this.map.removeSource(sourceId);
    }

    // Add traffic flow for the clicked point
    this.map.addSource(sourceId, {
      type: 'vector',
      tiles: [trafficFlowURL],
      minzoom: 1,
      maxzoom: 16,
    });

    this.map.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      'source-layer': 'road',
      paint: {
        'line-width': 1,
        'line-color': {
          property: 'speedKMH',
          type: 'interval',
          stops: [
            [0, 'green'],
            [50, 'yellow'],
            [100, 'red'],
          ],
        },
      },
    });
  }

  private fetchStaticPoints(): void {
    this.staticPointsService.getStaticPoints().subscribe((points: any[]) => {
      if (points && points.length > 0) {
        this.addStaticPoints(points);
      }
    });
  }
  private addClickListener(): void {
    this.map.on('click', (event: any) => {

      const clickedPoint = event.lngLat;
      const longitude = clickedPoint.lng;
      const latitude = clickedPoint.lat;

      // Use the longitude and latitude values as needed
      console.log('Longitude:', this.lon2tile(longitude,12));
      console.log('Latitude:', this.lat2tile(latitude,12));
      this.addMarker(clickedPoint);
      this.getTrafficData(longitude,latitude);

    });
  }

  private addMarker(lngLat: any): void {
    // Check if there's already a marker, remove it if exists
    if (this.currentMarker) {
      this.currentMarker.remove();
    }

    // Add a new marker at the clicked position
    this.currentMarker = new tt.Marker()
      .setLngLat(lngLat)
      .addTo(this.map);
  }

  private addStaticPoints(points: any[]): void {
    points.forEach(point => {
      const marker = new tt.Marker()
        .setLngLat([point.longitude, point.latitude])
        .addTo(this.map);
    });
  }




  private setCurrentPosition(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position: any) => {
        this.userLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        this.updateMap();
      });
    }
  }

  private updateMap(): void {
    if (this.map) {
      this.map.flyTo({
        center: [this.userLocation.longitude, this.userLocation.latitude],
        zoom: 17,
      });
      const marker = new tt.Marker()
        .setLngLat([this.userLocation.longitude, this.userLocation.latitude])
        .addTo(this.map);
    }
  }

  private loadMap(): void {
    this.map = tt.map({
      key: environment.tomtom.key,
      container: 'map',
      style:'../../assets/dark_style.json'



    });

    this.map.addControl(
      new tt.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showAccuracyCircle: true,
      })
    );

    this.map.on('load', () => {
      this.setCurrentPosition();
      this.fetchStaticPoints();
    });
  }

  private lon2tile(lon: number, zoom: number): number {
    return Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
  }

  private lat2tile(lat: number, zoom: number): number {
    return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
  }


}
