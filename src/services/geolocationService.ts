export interface GeoLocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number | null;
}

export class GeolocationService {
  private watcherId: number | null = null;
  private watchCallbacks: Set<(pos: GeoLocationResult) => void> = new Set();
  private errorCallbacks: Set<(error: GeolocationPositionError) => void> = new Set();

  /**
   * Get the current position once.
   */
  async getCurrentPosition(options?: PositionOptions): Promise<GeoLocationResult> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
          ...options
        }
      );
    });
  }

  /**
   * Start watching position continuously.
   */
  startWatching(options?: PositionOptions) {
    if (this.watcherId !== null) return;
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported');
      return;
    }

    this.watcherId = navigator.geolocation.watchPosition(
      (position) => {
        const result: GeoLocationResult = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed,
        };
        this.watchCallbacks.forEach(cb => cb(result));
      },
      (error) => {
        this.errorCallbacks.forEach(cb => cb(error));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
        ...options
      }
    );
  }

  stopWatching() {
    if (this.watcherId !== null) {
      navigator.geolocation.clearWatch(this.watcherId);
      this.watcherId = null;
    }
  }

  onUpdate(callback: (pos: GeoLocationResult) => void) {
    this.watchCallbacks.add(callback);
    return () => this.watchCallbacks.delete(callback);
  }

  onError(callback: (error: GeolocationPositionError) => void) {
    this.errorCallbacks.add(callback);
    return () => this.errorCallbacks.delete(callback);
  }
}

export const geolocationService = new GeolocationService();
