/**
 * @flow
 */
'use strict'

import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'

import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { Button, Chip, withTheme } from 'react-native-paper'

import { filter, find } from 'lodash'

import moment from 'moment'

import { AuthContext } from '../../helpers/contexts'
import categories from '../../helpers/categories'

import { TransactionsCategory, TransactionsMonths, TransactionsView } from '../Transactions/index'
import { CarouselView, ModalPicker } from '../../components/index'

const Stack = createStackNavigator()

const styles = StyleSheet.create({
})

const TransactionsTab = (props) => {
  const context = React.useContext(AuthContext)
  const { formattedAccess, formattedMonths, theme } = props
  const [onlyActiveAccess, setOnlyActiveAccess] = React.useState(null)
  const [selectedCategory, setSelectedCategory] = React.useState(null)
  const [selectedDate, setSelectedDate] = React.useState(moment().startOf('month').valueOf())
  const [selectedUser, setSelectedUser] = React.useState(null)
  const [yearList, setYearList] = React.useState(null)
  const [showCategoryPicker, setShowCategoryPicker] = React.useState(false)
  const [showDatePicker, setShowDatePicker] = React.useState(false)
  const [showMemberPicker, setShowMemberPicker] = React.useState(false)

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

  React.useEffect(() => {
    if ( formattedMonths ) {
      const years = []
      const hasAdded = []
      for ( let i = 0; i < formattedMonths.length; i++ ) {
        const year = moment(formattedMonths[i].timestamp).format('YYYY')
        if ( hasAdded.indexOf(year) < 0) {
          years.push({ label: year, timestamp: formattedMonths[i].timestamp })
          hasAdded.push(year)
        }
      }
      setYearList(years)
    }
  }, [formattedMonths])

  if ( ! selectedUser ) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} />
  }

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Transactions"
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
                items={showDatePicker == 'Year' ? yearList : formattedMonths}
                labelFormatter={(item) => showDatePicker == 'Year' ? moment(item.timestamp).format('YYYY') : moment(item.timestamp).format('MMMM YYYY')}
                visible={showDatePicker}
                title={"Select " + showDatePicker}
                onClose={() => setShowDatePicker(false)}
                onSelectItem={(item) => setSelectedDate(item.timestamp)}
              />
              <ModalPicker
                items={[{ name: 'All', icon: 'credit-card' }, ...categories]}
                labelSelector="name"
                title="Select Category"
                type="grid"
                visible={showCategoryPicker}
                onClose={() => setShowCategoryPicker(false)}
                onSelectItem={(item) => item.name == 'All' ? setSelectedCategory(null) : setSelectedCategory(item.name)}
              />
              <ModalPicker
                items={onlyActiveAccess}
                labelSelector="name"
                title="Select Member"
                visible={showMemberPicker}
                onClose={() => setShowMemberPicker(false)}
                onSelectItem={(item) => setSelectedUser(item)}
              />
              <CarouselView
                items={[{
                  label: 'Months',
                  element:
                    <TransactionsMonths
                      {...props}
                      formattedMonths={formattedMonths}
                      onlyActiveAccess={onlyActiveAccess}
                      selectedDate={selectedDate}
                      selectedUser={selectedUser}
                      setSelectedDate={setSelectedDate}
                      setShowDatePicker={setShowDatePicker}
                      setShowMemberPicker={setShowMemberPicker}
                    />
                }, {
                  label: 'Categories',
                  element:
                    <TransactionsCategory
                      {...props}
                      formattedMonths={formattedMonths}
                      onlyActiveAccess={onlyActiveAccess}
                      selectedDate={selectedDate}
                      selectedUser={selectedUser}
                      setSelectedCategory={setSelectedCategory}
                      setShowDatePicker={setShowDatePicker}
                      setShowMemberPicker={setShowMemberPicker}
                    />
                }, {
                  label: 'Incomes',
                  element:
                    <TransactionsView
                      {...props}
                      formattedMonths={formattedMonths}
                      onlyActiveAccess={onlyActiveAccess}
                      selectedCategory={selectedCategory}
                      selectedDate={selectedDate}
                      selectedUser={selectedUser}
                      setShowCategoryPicker={setShowCategoryPicker}
                      setShowDatePicker={setShowDatePicker}
                      setShowMemberPicker={setShowMemberPicker}
                      isExpense={false}
                    />
                }, {
                  label: 'Expenses',
                  element:
                    <TransactionsView
                      {...props}
                      formattedMonths={formattedMonths}
                      onlyActiveAccess={onlyActiveAccess}
                      selectedCategory={selectedCategory}
                      selectedDate={selectedDate}
                      selectedUser={selectedUser}
                      setShowCategoryPicker={setShowCategoryPicker}
                      setShowDatePicker={setShowDatePicker}
                      setShowMemberPicker={setShowMemberPicker}
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

export default withTheme(TransactionsTab)
