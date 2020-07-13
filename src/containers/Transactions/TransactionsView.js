/**
 * @flow
 */
'use strict'

import React from 'react'
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native'
import { Chip, DataTable, Text, withTheme } from 'react-native-paper'

import moment from 'moment'

import { filter, orderBy, sumBy } from 'lodash'

import { AuthContext } from '../../helpers/contexts'
import { subscribeToTransactionDate } from '../../helpers/firebase'

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

const TransactionsView = (props) => {
  const context = React.useContext(AuthContext)
  const {
    selectedCategory, selectedDate, selectedUser, formattedMonths, onlyActiveAccess,
    setShowCategoryPicker, setShowDatePicker, setShowMemberPicker, isExpense, style, theme
  } = props
  const [selectedTransactions, setSelectedTransactions] = React.useState(null)
  const [sortedTransactions, setSortedTransactions] = React.useState(null)
  const [sumTransactions, setSumTransactions] = React.useState(0)
  const [order, setOrder] = React.useState(['timestamp', 'desc'])

  React.useEffect(() => {
    let unsubscribe = null
    subscribeToTransactionDate(context.userData.householdID, selectedDate, moment(selectedDate).endOf('month').valueOf(), isExpense, (response) => {
      if ( response.success ) {
        unsubscribe = response.unsubscribe
        setSelectedTransactions(response.data)
      }
    })

    return () => typeof unsubscribe == 'function' && unsubscribe()
  }, [selectedDate])

  React.useEffect(() => {
    if ( order[0] == 'membersAmount' ) {
      setSortedTransactions(filter(selectedTransactions, (item) => ! selectedCategory || selectedCategory == item.category).sort((a, b) => {
        return order[1] == 'asc' ? b[order[0]][selectedUser.id] - a[order[0]][selectedUser.id] : a[order[0]][selectedUser.id] - b[order[0]][selectedUser.id]
      }))
    } else {
      setSortedTransactions(orderBy(filter(selectedTransactions, (item) => item.membersAmount[selectedUser.id] > 0 && ( ! selectedCategory || selectedCategory == item.category )), [order[0]], [order[1]]))
    }
  }, [selectedTransactions, order, selectedUser, selectedCategory])

  React.useEffect(() => {
    setSumTransactions(Math.round(sumBy(sortedTransactions, (item) => item.membersAmount[selectedUser.id]) * 100) / 100)
  }, [sortedTransactions])

  return (
    <View style={style}>
      <View style={{
        height: 32,
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5
      }}>
        <Chip
          icon="calendar"
          onPress={() => setShowDatePicker('Month')}
        >
          {moment(selectedDate).format('MMMM YYYY')}
        </Chip>
        <Chip
          icon="credit-card"
          onPress={() => setShowCategoryPicker(true)}
        >
          {!! selectedCategory ? selectedCategory : 'All Categories'}
        </Chip>
        <Chip
          icon="account"
          onPress={() => setShowMemberPicker(true)}
        >
          {selectedUser.name}
        </Chip>
      </View>
      <Text style={[styles.smallText, { margin: 5, textAlign: 'center', color: theme.colors.notification }]}>Click on a row to view/edit transaction</Text>
      { sortedTransactions && sortedTransactions.length > 0
        ? <DataTable style={{ marginBottom: 165, backgroundColor: theme.colors.surface, elevation: 2, borderRadius: theme.roundness }}>
            <DataTable.Header style={styles.tableHeader}>
              <DataTable.Title
                style={{ flex: 0.45 }}
                sortDirection={order[0] == 'timestamp' ? order[1] == 'asc' ? 'ascending' : 'descending' : null}
                onPress={() => setOrder(['timestamp', order[0] == 'timestamp' ? order[1] == 'asc' ? 'desc' : 'asc' : 'asc'])}
              >
                Date
              </DataTable.Title>
              <DataTable.Title
                style={{ flex: 0.5 }}
                sortDirection={order[0] == 'category' ? order[1] == 'asc' ? 'ascending' : 'descending' : null}
                onPress={() => setOrder(['category', order[0] == 'category' ? order[1] == 'asc' ? 'desc' : 'asc' : 'asc'])}
              >
                Category
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
              data={sortedTransactions}
              keyExtractor={(item) => item.id}
              renderItem={(row) => {
                return (
                  <TouchableOpacity onPress={() => props.navigation.navigate('Edit', { screen: 'EditTransaction', params: { transaction: row.item, title: isExpense ? 'Edit Expense' : 'Edit Income', isExpense, isRecurring: false }})}>
                    <DataTable.Row
                      style={styles.tableRow}
                    >
                      <DataTable.Cell style={{ flex: 0.45 }}>{moment(row.item.timestamp).format('DD.MM.YYYY')}</DataTable.Cell>
                      <DataTable.Cell style={{ flex: 0.5 }}><Text style={styles.smallText}>{row.item.category}</Text></DataTable.Cell>
                      <DataTable.Cell style={{ flex: 0.5 }}><Text style={styles.smallText}>{row.item.title}</Text></DataTable.Cell>
                      { isExpense
                        ? <DataTable.Cell style={{ flex: 0.3 }} numeric><Text style={ row.item.membersAmount[selectedUser.id] > 0 ? { color: theme.colors.error } : null }>{context.householdData.currency + ' ' + (-row.item.membersAmount[selectedUser.id]).toString().replace('.', ',')}</Text></DataTable.Cell>
                        : <DataTable.Cell style={{ flex: 0.3 }} numeric><Text style={ row.item.membersAmount[selectedUser.id] > 0 ? { color: theme.colors.accent } : null }>{context.householdData.currency + ' ' + row.item.membersAmount[selectedUser.id].toString().replace('.', ',')}</Text></DataTable.Cell>
                      }
                    </DataTable.Row>
                  </TouchableOpacity>
                )
              }}
            />
            <DataTable.Row style={[styles.tableRow, { borderTopWidth: 0.5, borderColor: theme.colors.border }]}>
              <DataTable.Cell style={{ flex: 0.5 }}>Total</DataTable.Cell>
              { isExpense
                ? <DataTable.Cell style={{ flex: 0.5 }} numeric><Text style={ sumTransactions > 0 ? { color: theme.colors.error } : null }>{sumTransactions > 0 ? context.householdData.currency + ' -' + sumTransactions.toString().replace('.', ',') : context.householdData.currency + ' ' + sumTransactions.toString().replace('.', ',')}</Text></DataTable.Cell>
                : <DataTable.Cell style={{ flex: 0.5 }} numeric><Text style={ sumTransactions > 0 ? { color: theme.colors.accent } : null }>{context.householdData.currency + ' ' + sumTransactions.toString().replace('.', ',')}</Text></DataTable.Cell>
              }
            </DataTable.Row>
          </DataTable>
        : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center'}}>
            <Text style={{ color: theme.colors.accent }}>There are no transactions for the selected filters</Text>
          </View>
      }
    </View>
  )
}

export default withTheme(TransactionsView)
