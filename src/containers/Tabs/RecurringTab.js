/**
 * @flow
 */
'use strict'

import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'

import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { Button, Chip, withTheme } from 'react-native-paper'

import { filter, find } from 'lodash'

import { AuthContext } from '../../helpers/contexts'
import periods from '../../helpers/periods'

import { RecurringTransaction } from '../Recurring/index'
import { CarouselView, ModalPicker } from '../../components/index'

const Stack = createStackNavigator()

const styles = StyleSheet.create({
})

const RecurringTab = (props) => {
  const context = React.useContext(AuthContext)
  const { formattedAccess, theme } = props
  const [onlyActiveAccess, setOnlyActiveAccess] = React.useState(null)
  const [selectedPeriod, setSelectedPeriod] = React.useState({ name: 'All', value: null })
  const [selectedUser, setSelectedUser] = React.useState(null)
  const [showMemberPicker, setShowMemberPicker] = React.useState(false)
  const [showPeriodPicker, setShowPeriodPicker] = React.useState(false)

  React.useEffect(() => {
    if ( formattedAccess ) {
      setOnlyActiveAccess(filter(formattedAccess, (item) => item.active))
    }
  }, [formattedAccess])

  React.useEffect(() => {
    if ( onlyActiveAccess ) {
      const selected = find(onlyActiveAccess, (item) => selectedUser ? item.id == selectedUser.id : item.id == context.user.uid)
      setSelectedUser(selected ? selected : find(onlyActiveAccess, (item) => item.id == context.user.uid))
    }
  }, [onlyActiveAccess])

  if ( ! selectedUser ) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} />
  }

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Recurring"
        options={{
          headerStyle: {
            elevation: 0,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          }
        }}
      >
        {(props) => {
          return (
            <View style={{ flex: 1 }}>
              <ModalPicker
                items={onlyActiveAccess}
                labelSelector="name"
                title="Select Member"
                visible={showMemberPicker}
                onClose={() => setShowMemberPicker(false)}
                onSelectItem={(item) => setSelectedUser(item)}
              />
              <ModalPicker
                items={[{ name: 'All', value: null }, ...periods]}
                labelSelector="name"
                title="Select Period"
                visible={showPeriodPicker}
                onClose={() => setShowPeriodPicker(false)}
                onSelectItem={(item) => setSelectedPeriod(item)}
              />
              <CarouselView
                items={[{
                  label: 'Incomes',
                  element:
                    <RecurringTransaction
                      {...props}
                      selectedPeriod={selectedPeriod}
                      selectedUser={selectedUser}
                      setShowMemberPicker={setShowMemberPicker}
                      setShowPeriodPicker={setShowPeriodPicker}
                      isExpense={false}
                    />
                }, {
                  label: 'Expenses',
                  element:
                    <RecurringTransaction
                      {...props}
                      selectedPeriod={selectedPeriod}
                      selectedUser={selectedUser}
                      setShowMemberPicker={setShowMemberPicker}
                      setShowPeriodPicker={setShowPeriodPicker}
                      isExpense={true}
                    />
                }]}
                scrollViewStyle={{ flex: 1 }}
              />
            </View>
          )
        }}
      </Stack.Screen>
    </Stack.Navigator>
  )
}

export default withTheme(RecurringTab)
