import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, SafeAreaView} from 'react-native';
import {FONTS, DATABASE_URL} from '../constants';
import {OrderList} from '../components';
import {Globalstyles} from '../styles/GlobalStyle';
import {Header} from '../components';
import {firebase} from '@react-native-firebase/database';
import {useSelector} from 'react-redux';

const Order = ({navigation}) => {
  const {user} = useSelector(state => state.userReducer);
  const [orders, setOrders] = useState([]);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const orderReference = firebase.app().database(DATABASE_URL).ref('/Order/');

  useEffect(() => {
    let array = [];
    if (user) {
      orderReference.on(
        'value',
        snapshot => {
          snapshot.forEach(snapshotItem => {
            const item = snapshotItem.val();
            console.log('deliver_by', item.deliver_by);
            if (!item.accepted && item.valid && !item.delivered) {
              array.push(item);
            }
            if (item.deliver_by && item.deliver_by.uid === user.uid) {
              setHasActiveOrder(true);
            }
          });
          setOrders(array);
          array = [];
        },
        err => {
          console.log(err);
        },
      );
    } else {
      setOrders([]);
    }
  }, [user]);

  return (
    <SafeAreaView style={Globalstyles.container_1}>
      <Header title="Commandes" icon={2} navigation={navigation} />
      {orders.length != 0 ? (
        <OrderList
          navigation={navigation}
          orders={orders}
          hasActiveOrder={hasActiveOrder}
        />
      ) : (
        <View style={styles.empty_text}>
          <Text style={{...FONTS.h4}}>Aucune commande pour l'instant!</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default Order;

const styles = StyleSheet.create({
  empty_text: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
