import React, {useState, useEffect} from 'react';
import {StatusBar, Platform} from 'react-native';
import {COLORS} from './constants';
import {createStackNavigator} from '@react-navigation/stack';
import {NavigationContainer} from '@react-navigation/native';
import Tabs from './navigation/tabs';
import RNBootSplash from 'react-native-bootsplash';
import {Provider} from 'react-redux';
import {store, persistor} from './redux/store';
import {Home, LoginScreen, SignUp, UpdateProfile, Account} from './screens';
import auth from '@react-native-firebase/auth';
import firebase from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import {FirebaseMessagingTypes} from '@react-native-firebase/messaging';
import {PersistGate} from 'redux-persist/integration/react';
import PubNub from 'pubnub';
import {PubNubProvider} from 'pubnub-react';
navigator.geolocation = require('@react-native-community/geolocation');

const Stack = createStackNavigator();

// Your secondary Firebase project credentials...
const credentials = {
  clientId: '',
  appId: '1:570616527377:web:fbdb1f3b7cbb0e624d8fb0',
  apiKey: 'AIzaSyDRThURWQTcE9HVIMR98iYMiYkdIIuJpuA',
  databaseURL:
    'https://africanbasket-341203-default-rtdb.europe-west1.firebasedatabase.app',
  storageBucket: 'africanbasket-341203.appspot.com',
  messagingSenderId: '570616527377',
  projectId: 'africanbasket-341203',
};

// PubNub initialization
const pubnub = new PubNub({
  publishKey: 'pub-c-cd4c4028-7c56-41d7-9edf-8a703167f51d',
  subscribeKey: 'sub-c-0912fec1-a7bc-427d-b6d6-16e3b6de8e6b',
  uuid: 'TheAfricanBasket',
});

if (firebase.apps.length === 0) {
  firebase.initializeApp(credentials);
}

const App = () => {
  // Set an initializing state whilst Firebase connects
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState();
  const channelId = 'some_channel_id';

  // Handle user state changes
  function onAuthStateChanged(user) {
    setUser(user);
    if (initializing) {
      setInitializing(false);
    }
  }

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    const defaultAppMessaging = firebase.messaging();

    defaultAppMessaging.onMessage(response => {
      console.log(JSON.stringify(response));
      if (Platform.OS !== 'ios') {
        showNotification(response.notification);
        return;
      }
      PushNotificationIOS.requestPermissions().then(() =>
        showNotification(response.notification),
      );
    });

    return subscriber; // unsubscribe on unmount
  });

  const showNotification = notification => {
    PushNotification.createChannel(
      {
        channelId: 'commands',
        channelName: 'New command',
        channelDescription: 'Notify of creation of a new command',
      },
      () => {},
    );
    PushNotification.localNotification({
      channelId: 'commands',
      title: notification.title,
      message: notification.body,
    });
  };

  return (
    <>
      <StatusBar backgroundColor={COLORS.lightGray} barStyle="dark-content" />
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <NavigationContainer onReady={() => RNBootSplash.hide()}>
            <PubNubProvider client={pubnub}>
              <Stack.Navigator>
                {user ? (
                  <>
                    <Stack.Screen
                      name="Home"
                      component={Tabs}
                      options={{headerShown: false}}
                    />
                    <Stack.Screen name="Account" component={Account} />
                    <Stack.Screen
                      name="UpdateProfile"
                      component={UpdateProfile}
                    />
                  </>
                ) : (
                  <>
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="SignUp" component={SignUp} />
                  </>
                )}
              </Stack.Navigator>
            </PubNubProvider>
          </NavigationContainer>
        </PersistGate>
      </Provider>
    </>
  );
};

export default App;
