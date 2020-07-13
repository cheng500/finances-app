/**
 * @flow
 */
'use strict'

import React from 'react'
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native'
import { Chip, DataTable, Text, withTheme } from 'react-native-paper'

import moment from 'moment'

import { filter, find, map, orderBy } from 'lodash'

import { AuthContext } from '../../helpers/contexts'
import { subscribeToRecurringTransaction } from '../../helpers/firebase'
import periods from '../../helpers/periods'

const styles = StyleSheet.create({
  tableHeader: {
    width: '100%',
    paddingHorizontal: 5,
    minHeight: 48,
    flexDirection: 'row',
  },
  tableHeaderText: {
    fontSize: 12
  },
  tableRow: {
    width: '100%',
    paddingHorizontal: 5,
    minHeight: 48,
    flexDirection: 'row',
  },
  smallText: {
    fontSize: 10
  }
})

const RecurringTransaction = (props) => {
  const context = React.useContext(AuthContext)
  const {
    selectedPeriod, selectedUser, setShowMemberPicker, setShowPeriodPicker,
    isExpense, style, theme
  } = props
  const [selectedPeriodName, setSelectedPeriodName] = React.useState(null)
  const [recurringTransaction, setRecurringTransaction] = React.useState(null)
  const [sumTransactions, setSumTransactions] = React.useState(null)
  const [orderedRecurringTransaction, setOrderedRecurringTransaction] = React.useState(null)
  const [order, setOrder] = React.useState(['timestamp', 'asc'])

  React.useEffect(() => {
    setSelectedPeriodName(selectedPeriod.value != null ? find(periods, (item) => item.value == selectedPeriod.value).name : 'All Periods')
  }, [selectedPeriod])

  React.useEffect(() => {
    subscribeToRecurringTransaction(context.userData.householdID, isExpense, (response) => {
      if ( response.success ) {
        setRecurringTransaction(response.data)
      }
    })
  }, [])

  React.useEffect(() => {
    if ( recurringTransaction ) {
      if ( order[0] == 'membersAmount' ) {
        setOrderedRecurringTransaction(recurringTransaction.sort((a, b) => {
          return order[1] == 'asc' ? b[order[0]][selectedUser.id] - a[order[0]][selectedUser.id] : a[order[0]][selectedUser.id] - b[order[0]][selectedUser.id]
        }))
      } else {
        setOrderedRecurringTransaction(orderBy(filter(recurringTransaction, (item) => ! selectedPeriod.value || item.period == selectedPeriod.value), [order[0]], [order[1]]))
      }
    }
  }, [recurringTransaction, selectedPeriod, order, selectedUser])

  React.useEffect(() => {
    const helper = {}
    if ( orderedRecurringTransaction ) {
      for ( let i = 0 ; i < orderedRecurringTransaction.length; i++ ) {
        if ( ! helper[orderedRecurringTransaction[i].period] ) {
          helper[orderedRecurringTransaction[i].period] = orderedRecurringTransaction[i].membersAmount[selectedUser.id]
        } else {
          helper[orderedRecurringTransaction[i].period] += orderedRecurringTransaction[i].membersAmount[selectedUser.id]
        }
      }
    }
    setSumTransactions(helper)
  }, [orderedRecurringTransaction])

  return (
    <View style={style}>
      <View style={{
        height: 32,
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5
      }}>
        <Chip
          icon="account"
          onPress={() => setShowPeriodPicker(true)}
        >
          {selectedPeriodName}
        </Chip>
        <Chip
          icon="account"
          onPress={() => setShowMemberPicker(true)}
        >
          {selectedUser.name}
        </Chip>
      </View>
      <Text style={[styles.smallText, { margin: 5, textAlign: 'center', color: theme.colors.notification }]}>Click on a row to view/edit recurring transaction</Text>
      { orderedRecurringTransaction && orderedRecurringTransaction.length > 0
        ? <DataTable style={{ marginBottom: sumTransactions ? (115 + Object.keys(sumTransactions).length * 50) : 115, backgroundColor: theme.colors.surface, elevation: 2, borderRadius: theme.roundness }}>
            <DataTable.Header style={styles.tableHeader}>
              <DataTable.Title
                style={{ flex: 0.45 }}
                sortDirection={order[0] == 'timestamp' ? order[1] == 'asc' ? 'ascending' : 'descending' : null}
                onPress={() => setOrder(['timestamp', order[0] == 'timestamp' ? order[1] == 'asc' ? 'desc' : 'asc' : 'asc'])}
              >
                Next date
              </DataTable.Title>
              <DataTable.Title
                style={{ flex: 0.5 }}
                sortDirection={order[0] == 'period' ? order[1] == 'asc' ? 'ascending' : 'descending' : null}
                onPress={() => setOrder(['period', order[0] == 'period' ? order[1] == 'asc' ? 'desc' : 'asc' : 'asc'])}
              >
                Period
              </DataTable.Title>
              <DataTable.Title
                style={{ flex: 0.5 }}
                sortDirection={order[0] == 'title' ? order[1] == 'asc' ? 'ascending' : 'descending' : null}
                onPress={() => setOrder(['title', order[0] == 'title' ? order[1] == 'asc' ? 'desc' : 'asc' : 'asc'])}
              >
                Title
              </DataTable.Title>
              <DataTable.Title
                style={{ flex: 0.3 }}
                sortDirection={order[0] == 'membersAmount' ? order[1] == 'asc' ? 'ascending' : 'descending' : null}
                onPress={() => setOrder(['membersAmount', order[0] == 'membersAmount' ? order[1] == 'asc' ? 'desc' : 'asc' : 'asc'])}
                numeric
              >
                { isExpense ? 'Expense' : 'Income' }
              </DataTable.Title>
            </DataTable.Header>
            <FlatList
              data={orderedRecurringTransaction}
              keyExtractor={(item) => item.id}
              renderItem={(row) => {
                return (
                  <TouchableOpacity onPress={() => props.navigation.navigate('Edit', { screen: 'EditTransaction', params: { transaction: row.item, title: isExpense ? 'Edit Expense' : 'Edit Income', isExpense, isRecurring: true }})}>
                    <DataTable.Row style={styles.tableRow}>
                      <DataTable.Cell style={{ flex: 0.45 }}>{moment(row.item.timestamp).format('DD.MM.YYYY')}</DataTable.Cell>
                      <DataTable.Cell style={{ flex: 0.5 }}><Text style={styles.smallText}>{find(periods, (item) => item.value == row.item.period).name}</Text></DataTable.Cell>
                      <DataTable.Cell style={{ flex: 0.5 }}><Text style={styles.smallText}>{row.item.title}</Text></DataTable.Cell>
                      { isExpense
                        ? <DataTable.Cell style={{ flex: 0.3}} numeric><Text style={ row.item.membersAmount[selectedUser.id] > 0 ? { color: theme.colors.error } : null }>{context.householdData.currency + ' ' + (-row.item.membersAmount[selectedUser.id]).toString().replace('.', ',')}</Text></DataTable.Cell>
                        : <DataTable.Cell style={{ flex: 0.3}} numeric><Text style={ row.item.membersAmount[selectedUser.id] > 0 ? { color: theme.colors.accent } : null }>{context.householdData.currency + ' ' + row.item.membersAmount[selectedUser.id].toString().replace('.', ',')}</Text></DataTable.Cell>
                      }
                    </DataTable.Row>
                  </TouchableOpacity>
                )
              }}
            />
            { map(sumTransactions, (item, key) => {
              return (
                <TouchableOpacity key={key} onPress={() => setSelectedPeriod(key)}>
                  <DataTable.Row style={styles.tableRow}>
                    <DataTable.Cell>{"Total (" + find(periods, (item) => item.value == key).name + ")"}</DataTable.Cell>
                    { isExpense
                      ? <DataTable.Cell numeric><Text style={ item > 0 ? { color: theme.colors.error } : null }>{context.householdData.currency + ' -' + (Math.round(item * 100) / 100).toString().replace('.', ',')}</Text></DataTable.Cell>
                      : <DataTable.Cell numeric><Text style={ item > 0 ? { color: theme.colors.accent } : null }>{context.householdData.currency + ' ' + (Math.round(item * 100) / 100).toString().replace('.', ',')}</Text></DataTable.Cell>
                    }
                  </DataTable.Row>
                </TouchableOpacity>
              )
            }) }
          </DataTable>
        : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center'}}>
            <Text style={{ color: theme.colors.accent }}>There are no transactions for the selected filters</Text>
          </View>
      }
    </View>
  )
}

export default withTheme(RecurringTransaction)
