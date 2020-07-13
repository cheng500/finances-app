/**
 * @flow
 */
'use strict'

import React from 'react'
import { withTheme } from 'react-native-paper'
import { createStackNavigator } from '@react-navigation/stack'

import { Settings } from '../Settings/index'

const Stack = createStackNavigator()

const SettingsTab = (props) => {
  const theme = props.theme

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Settings"
        component={Settings}
        options={{
          headerStyle: {
            elevation: 0,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          }
        }}
      />
    </Stack.Navigator>
  )
}

export default withTheme(SettingsTab)
