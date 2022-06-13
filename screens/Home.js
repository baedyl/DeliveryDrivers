import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  Platform,
  SafeAreaView,
  PermissionsAndroid,
} from 'react-native';

import {useSelector} from 'react-redux';
import MapView, {
  ProviderPropType,
  Marker,
  AnimatedRegion,
} from 'react-native-maps';
import {usePubNub} from 'pubnub-react';
import MapViewDirections from 'react-native-maps-directions';
import {GOOGLE_API_KEY} from '@env';

const {width, height} = Dimensions.get('window');

// Rabat, Morocco coordinates
const ASPECT_RATIO = width / height;
let LATITUDE = 34.01325;
let LONGITUDE = -6.83255;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const Home = ({navigation}) => {
  const {boutique} = useSelector(state => state.boutiqueReducer);
  const {order} = useSelector(state => state.orderReducer);
  const [coordinates, setCoordinates] = useState([]);
  const pubnub = usePubNub();

  const thisState = {
    latitude: LATITUDE,
    longitude: LONGITUDE,
    coordinate: new AnimatedRegion({
      latitude: LATITUDE,
      longitude: LONGITUDE,
      latitudeDelta: 0,
      longitudeDelta: 0,
    }),
  };
  let thisMarker = null;
  let thisWatchID = null;
  const mounted = React.useRef();

  useEffect(() => {
    if (!mounted.current) {
      // do componentDidMount logic
      watchLocation();
      mounted.current = true;
    } else {
      // do componentDidUpdate logic
      console.log(order);
      if (boutique.location.latitude) {
        console.log('destination: ', boutique.location);
        thisState.latitude = boutique.location.latitude;
        thisState.longitude = boutique.location.longitude;
        // setCoordinates([
        //   {latitude: 34.01325, longitude: -6.83255},
        //   {
        //     latitude: boutique.location.latitude,
        //     longitude: boutique.location.longitude,
        //   },
        // ]);
        pubnub.publish({
          message: {
            latitude: boutique.location.latitude,
            longitude: boutique.location.longitude,
          },
          channel: 'location',
        });
      }
    }
  });

  function componentWillUnmount() {
    navigator.geolocation.clearWatch(thisWatchID);
  }

  function watchLocation() {
    const {coordinate} = thisState;

    thisWatchID = navigator.geolocation.watchPosition(
      position => {
        const {latitude, longitude} = position.coords;

        const newCoordinate = {
          latitude,
          longitude,
        };

        if (Platform.OS === 'android') {
          if (thisMarker) {
            thisMarker._component.animateMarkerToCoordinate(
              newCoordinate,
              500, // 500 is the duration to animate the marker
            );
          }
        } else {
          coordinate.timing(newCoordinate).start();
        }

        thisState.latitude = latitude;
        thisState.longitude = longitude;
      },
      error => console.log(error),
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 1000,
        distanceFilter: 10,
      },
    );
  }

  const getMapRegion = () => ({
    latitude: thisState.latitude,
    longitude: thisState.longitude,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  });

  const requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Cool Photo App Camera Permission',
          message:
            'African Basket App needs access to your location ' +
            'so you can see changes in real time',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('You can use the location');
      } else {
        console.log('Location permission denied');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  return (
    <SafeAreaView style={{flex: 1}}>
      <View style={styles.container}>
        <MapView
          style={styles.map}
          showUserLocation
          followUserLocation
          loadingEnabled
          region={getMapRegion()}>
          <Marker.Animated
            ref={marker => {
              thisMarker = marker;
            }}
            coordinate={thisState.coordinate}
          />
          <MapViewDirections
            origin={{latitude: 34.01325, longitude: -6.83255}}
            destination={{
              latitude: thisState.latitude,
              longitude: thisState.longitude,
            }}
            apikey={GOOGLE_API_KEY}
          />
        </MapView>
      </View>
    </SafeAreaView>
  );
};

Home.propTypes = {
  provider: ProviderPropType,
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default Home;
