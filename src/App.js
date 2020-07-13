/**
 * @flow
 */
'use strict'

import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createMaterialBottomTabNavigator  } from '@react-navigation/material-bottom-tabs'

import {
  ActivityIndicator, KeyboardAvoidingView, Linking, StatusBar, StyleSheet, View
} from 'react-native'

import {
  Banner, Button, configureFonts, DefaultTheme, IconButton,
  Provider as PaperProvider, Text, TextInput
} from 'react-native-paper'

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'

import { filter, find, map, sortBy, orderBy } from 'lodash'

import moment from 'moment'

import {
  createNewHousehold, createNewUser, onDynamicLinks, signOut, startEmailVerification,
  subscribeToAuthChanges, subscribeToHousehold, subscribeToUser
} from './helpers/firebase'

import { AuthContext } from './helpers/contexts'

import { EditTab, RecurringTab, SettingsTab, TransactionsTab } from './containers/Tabs/index'
import { Login } from './containers/index'

import { ErrorText } from './components/index'

const Tab = createMaterialBottomTabNavigator()

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#007aff',
    notification: '#aaaaaa',
    border: '#dfdfdf'
  },
  fonts: configureFonts({
    default: {
      regular: {
        fontFamily: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
        fontWeight: '400',
      },
      medium: {
        fontFamily: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
        fontWeight: '500',
      },
      light: {
        fontFamily: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
        fontWeight: '300',
      },
      thin: {
        fontFamily: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
        fontWeight: '100',
      }
    }
  })
}

const styles = StyleSheet.create({
  startButtonStyle: {
    width: 250,
    marginTop: 20
  },
  startTextStyle: {
    fontSize: 14,
    width: 250,
    marginBottom: 10,
    textAlign: 'justify'
  }
})

const App = () => {
  const context = React.useContext(AuthContext)
  const [currency, setCurrency] = React.useState('€')
  const [errors, setErrors] = React.useState({})
  const [name, setName] = React.useState('')
  const [formattedAccess, setFormattedAccess] = React.useState([])
  const [formattedMonths, setFormattedMonths] = React.useState([])
  const [householdData, setHouseholdData] = React.useState({})
  const [user, setUser] = React.useState({})
  const [userData, setUserData] = React.useState({})
  const [isLoadingHousehold, setIsLoadingHousehold] = React.useState(true)
  const [isLoadingUser, setIsLoadingUser] = React.useState(true)
  const [bannerIsVisible, setBannerIsVisible] = React.useState(true)
  const [hasStartedVerification, setHasStartedVerification] = React.useState(false)

  React.useEffect(() => {
    let unsubscribe = null
    subscribeToAuthChanges((response) => {
      typeof unsubscribe == 'function' && unsubscribe()
      if ( response.success ) {
        setIsLoadingUser(true)
        setUser(response.data)
        if ( response.data ) {
          subscribeToUser(response.data.uid, (response1) => {
            if ( response1.success ) {
              unsubscribe = response1.unsubscribe
              if ( response1.data ) {
                setUserData(response1.data)
                setBannerIsVisible(true)
              }
              setIsLoadingUser(false)
            } else {
              setIsLoadingUser(false)
            }
          })
        } else {
          setUserData({})
          setHouseholdData({})
        }
      }
    })

    Linking.addEventListener('url', (response) => {
      if ( response == 'verifyUser' ) {
        setHasStartedVerification(false)
        setBannerIsVisible(false)
      }
    })

    return () => {
      Linking.removeEventListener('url', onDynamicLinks)
      typeof unsubscribe == 'function' && unsubscribe()
    }
  }, [])

  React.useEffect(() => {
    let unsubscribe = null
    if ( userData.householdID ) {
      setIsLoadingHousehold(true)
      subscribeToHousehold(userData.householdID, (response) => {
        if ( response.success ) {
          unsubscribe = response.unsubscribe
          setHouseholdData(response.data ? response.data : {})
          setIsLoadingHousehold(false)
        }
      })
    } else {
      setIsLoadingHousehold(false)
    }

    return () => typeof unsubscribe == 'function' && unsubscribe()
  }, [userData.householdID])

  React.useEffect(() => {
    if ( householdData.access ) {
      setFormattedAccess(sortBy(map(householdData.access, (item1, key) => { return { ...item1, id: key }}), (item) => item.id != user.uid))
    }
  }, [householdData.access])

  React.useEffect(() => {
    if ( householdData.months ) {
      const startOfCurrentMonth = moment().startOf('month').valueOf()
      const res = filter(map(householdData.months, (item, key) => {
        return {
          users: filter(map(item, (item1, key1) => {
            if ( key1 != 'eCounter' && key1 != 'iCounter' ) {
              return {
                categories: map(item1, (item2, key2) => {
                  return {
                    ...item2,
                    category: key2
                  }
                }),
                id: key1,
                name: householdData.access[key1].name
              }
            } else {
              return null
            }
          }, (help) => help != null)),
          timestamp: Number(key)
        }
      }), (fItem) => {
        for ( let i = 0; i < fItem.users.length; i++ ) {
          for ( let j = 0; j < fItem.users[i].categories.length; j++ ) {
            if ( fItem.users[i].categories[j].expense > 0 || fItem.users[i].categories[j].income > 0 ) {
              return true
            }
          }
        }
        return false
      })
      if ( find(res, (item) => item.timestamp == startOfCurrentMonth ) ) {
        setFormattedMonths(orderBy(res, ['timestamp'], ['desc']))
      } else {
        setFormattedMonths(orderBy([...res, { timestamp: startOfCurrentMonth }], ['timestamp'], ['desc']))
      }
    }
  }, [householdData.months])

  return (
    <NavigationContainer>
      <PaperProvider theme={theme}>
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.colors.surface }}>
          <StatusBar backgroundColor="white" barStyle="dark-content" />
          { ! user
            ? <Login name={name} setName={setName} />
            : ! isLoadingUser && ! isLoadingHousehold
              ? userData && userData.householdID
                ? <AuthContext.Provider value={{ user, userData, householdData }}>
                    <Banner
                      visible={ bannerIsVisible && ! user.emailVerified }
                      actions={
                        ! hasStartedVerification
                        ? [{
                            label: 'Verify',
                            onPress: () => {
                              startEmailVerification()
                              setHasStartedVerification(true)
                            }
                          }, {
                            label: 'Dismiss',
                            onPress: () => setBannerIsVisible(false)
                          }]
                        : [{
                            label: 'Dismiss',
                            onPress: () => setBannerIsVisible(false)
                          }]
                      }
                      icon="information-outline"
                    >
                      { ! hasStartedVerification
                        ? 'Verify your e-mail address to make your account permanent'
                        : 'Check your e-mails for further instructions'
                      }
                    </Banner>
                    <Tab.Navigator
                      shifting={true}
                    >
                      <Tab.Screen
                        name="Transactions"
                        options={{
                          title: "Transactions",
                          tabBarIcon: (data) => <MaterialCommunityIcons name="credit-card" color={data.color} size={26}/>
                        }}
                      >
                        {(screenProps) => <TransactionsTab {...screenProps} formattedMonths={formattedMonths} formattedAccess={formattedAccess} />}
                      </Tab.Screen>
                      { householdData.isPaid && (
                        <Tab.Screen
                          name="Recurring"
                          options={{
                            title: "Recurring",
                            tabBarIcon: (data) => <MaterialCommunityIcons name="reload" color={data.color} size={26}/>
                          }}
                        >
                          {(screenProps) => <RecurringTab {...screenProps} formattedAccess={formattedAccess} />}
                        </Tab.Screen>
                      ) }
                      <Tab.Screen
                        name="Edit"
                        options={{
                          title: "Edit",
                          tabBarIcon: (data) => <MaterialCommunityIcons name="plus" color={data.color} size={26}/>
                        }}
                      >
                        {(screenProps) => <EditTab {...screenProps} formattedMonths={formattedMonths} formattedAccess={formattedAccess} />}
                      </Tab.Screen>
                      <Tab.Screen
                        name="Settings"
                        options={{
                          title: "Settings",
                          tabBarIcon: (data) => <MaterialCommunityIcons name="settings" color={data.color} size={26}/>
                        }}
                        component={SettingsTab}
                      />
                    </Tab.Navigator>
                  </AuthContext.Provider>
                : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <IconButton
                      size={200}
                      icon="information-outline"
                      color={theme.colors.primary}
                      style={{ height: 210 }}
                    />
                    <Text style={styles.startTextStyle}>Before you can record your expenses, you have to belong to a household.</Text>
                    <Text style={styles.startTextStyle}>Simply enter your desired currency symbol and create your own household by clicking the button below.</Text>
                    <Text style={styles.startTextStyle}>Alternatively, if you want to join your friend's household, have your friend invite you to his existing household.</Text>
                    <TextInput
                      error={errors.currency}
                      label="Currency"
                      mode="outlined"
                      value={currency}
                      style={{ width: 250 }}
                      onChangeText={(text) => setCurrency(text)}
                      dense
                    />
                    { errors.currency && (
                      <ErrorText>{errors.currency}</ErrorText>
                    )}
                    <Button
                      icon="plus"
                      mode="outlined"
                      uppercase={false}
                      style={styles.startButtonStyle}
                      onPress={() => {
                        setErrors({})
                        const errorsHelper = {}

                        if ( ! currency.trim() ) {
                          errorsHelper.currency = 'Cannot be empty'
                        }

                        if ( Object.keys(errorsHelper) <= 0 ) {
                          createNewHousehold(user.uid, user.displayName ? user.displayName : name, currency, (response) => {
                            if ( response.success ) {
                              setUserData({...userData, householdID: response.householdID})
                            }
                          })
                        } else {
                          setErrors(errorsHelper)
                        }
                      }}
                    >
                      Create a new household
                    </Button>
                    <Button
                      mode="outlined"
                      uppercase={false}
                      style={styles.startButtonStyle}
                      onPress={() => {
                        setName('')
                        signOut()
                      }}
                    >
                      Sign out
                    </Button>
                  </View>
              : <ActivityIndicator size="large" style={{ flex: 1 }}/>
          }
        </KeyboardAvoidingView>
      </PaperProvider>
    </NavigationContainer>
  )
}

export default App
