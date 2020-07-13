/**
 * @flow
 */
'use strict'

import React from 'react'
import { withTheme } from 'react-native-paper'
import { createStackNavigator } from '@react-navigation/stack'

import { TransactionEditor } from '../Edit/index'

const Stack = createStackNavigator()

const EditTab = (props) => {
  const { formattedAccess, formattedMonths, navigation, theme } = props


  React.useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', (event) => {
      event.preventDefault()
      navigation.navigate('EditTransaction', { title: 'Add Transaction', transaction: null })
    })

    return unsubscribe
  }, [navigation])

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="EditTransaction"
        options={(screenProps) => ({
          title: screenProps.route.params ? screenProps.route.params.title : 'Add Transaction',
          headerStyle: {
            elevation: 0,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          }
        })}
      >
        {(screenProps) => <TransactionEditor {...screenProps} formattedAccess={formattedAccess} formattedMonths={formattedMonths} />}
      </Stack.Screen>
    </Stack.Navigator>
  )
}

export default withTheme(EditTab)
