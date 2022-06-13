import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Alert,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import {setBoutique, setOrder} from '../redux/actions';
import {useDispatch, useSelector} from 'react-redux';
import {DATABASE_URL} from '../constants';
import {firebase} from '@react-native-firebase/database';

import {COLORS, SIZES, FONTS, icons} from '../constants';

const OrderList = ({navigation, orders, hasActiveOrder}) => {
  const dispatch = useDispatch();
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const currentUser = firebase.auth().currentUser;
    if (currentUser) {
      const userReference = firebase
        .app()
        .database(DATABASE_URL)
        .ref('/Users/' + currentUser.uid);
      userReference.on('value', snapshot => {
        setUserInfo(snapshot.val());
      });
    }
  }, [navigation]);

  function displayOrderItems(item) {
    console.log('Delivered : ', item.delivered);
    var items = '\n';
    for (let i = 1; i <= item.totalItems; i++) {
      items = items + item[`item${i}`] + '\n';
    }

    return items;
  }

  function acceptOrder(item) {
    console.log('hasActiveOrder: ', hasActiveOrder);
    if (hasActiveOrder) {
      Alert.alert(
        'Info!',
        "Veuillez livrer votre commande active avant d'accepter une autre.",
      );
    } else {
      dispatch(setBoutique(item.boutique));
      dispatch(setOrder(item));

      if (userInfo) {
        // Update order status
        const orderReference = firebase
          .app()
          .database(DATABASE_URL)
          .ref('/Order/' + item.oid);

        // Chage order's status and add deliver person's name
        orderReference
          .update({accepted: true, deliver_by: userInfo})
          .then(() => console.log('Deliver accepted order!'));

        navigation.navigate('Home');
      } else {
        const currentUser = firebase.auth().currentUser;
        console.log('currentUser: ', currentUser);
      }
    }
  }

  const renderItem = ({item, index}) => {
    return (
      <View style={styles.container}>
        {/* Order No */}
        <View style={{padding: SIZES.padding * 2}}>
          {/* Order No */}
          <View style={styles.row}>
            <Text style={styles.order_no_text}>Commande : {index + 1}</Text>

            {/* Time */}
            <View style={{flexDirection: 'row'}}>
              <Image
                source={icons.time}
                style={{height: 20, width: 20, tintColor: COLORS.primary}}
              />
              <Text style={{...FONTS.body4, color: COLORS.black}}>
                {' '}
                {item.time} mins
              </Text>
            </View>
          </View>

          {/* Boutique */}
          <View style={styles.total}>
            <Text style={{...FONTS.body3, color: COLORS.black}}>
              {item?.boutique?.name}
            </Text>
            <Text style={{...FONTS.body3, color: COLORS.black}}>
              {item?.boutique?.address}
            </Text>
          </View>

          {/* Order Items */}
          <Text style={styles.order_items_text}>{displayOrderItems(item)}</Text>

          {/* Total */}
          <View style={styles.total}>
            <Text style={{...FONTS.body3, color: COLORS.black}}>Total: </Text>
            <Text style={{...FONTS.body2, color: COLORS.black}}>
              {item.total} DH
            </Text>
          </View>

          {/* Track & Cancel buttons */}
          <View style={styles.buttons_container}>
            <TouchableOpacity
              disabled={item.delivered}
              style={[styles.buttons, styles.button_enabled]}
              onPress={() => acceptOrder(item)}>
              <Text style={styles.buttons_text}>
                {!item.delivered ? 'Accepter' : 'Livrée'}
              </Text>
            </TouchableOpacity>

            {/* <TouchableOpacity
              style={{...styles.buttons, backgroundColor: 'red'}}
              onPress={() => deleteOrder(item.oid)}>
              <Text style={styles.buttons_text}>Cancel Order</Text>
            </TouchableOpacity> */}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={{flex: 1}}>
      <FlatList
        data={orders}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
        contentContainerStyle={{
          padding: 16,
        }}
      />
    </View>
  );
};

export default OrderList;

const styles = StyleSheet.create({
  container: {
    margin: 8,
    elevation: 3,
    width: SIZES.width - 45,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.white,
  },
  order_no_text: {
    ...FONTS.h4,
    color: COLORS.black,
  },
  order_items_text: {
    ...FONTS.body4,
    color: COLORS.black,
  },
  total: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray3,
    paddingVertical: 8,
    borderBottomColor: COLORS.lightGray3,
    borderBottomWidth: 1,
  },
  buttons_container: {
    padding: SIZES.padding * 2,
    paddingBottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  buttons: {
    backgroundColor: COLORS.primary,
    width: SIZES.width * 0.35,
    padding: SIZES.padding,
    alignItems: 'center',
    borderRadius: SIZES.radius,
  },
  buttons_text: {
    ...FONTS.body4,
    color: COLORS.white,
  },
  button_disabled: {
    opacity: 0.3,
  },
  button_enabled: {
    opacity: 1,
  },
  row: {
    paddingBottom: 8,
    borderBottomColor: COLORS.lightGray3,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
