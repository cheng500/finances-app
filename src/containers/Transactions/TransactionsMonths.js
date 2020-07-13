/**
 * @flow
 */
'use strict'

import React from 'react'
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native'
import { Chip, DataTable, Text, withTheme } from 'react-native-paper'

import { find, orderBy, sumBy } from 'lodash'

import moment from 'moment'

import { AuthContext } from '../../helpers/contexts'

import { ModalPicker } from '../../components/index'

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

const TransactionsMonths = (props) => {
  const context = React.useContext(AuthContext)
  const {
    selectedDate, selectedUser, onlyActiveAccess, formattedMonths, setSelectedDate,
    setShowDatePicker, setShowMemberPicker, navigateToTab, style, theme
  } = props
  const [order, setOrder] = React.useState(['timestamp', 'desc'])
  const [selectedMonths, setSelectedMonths] = React.useState(null)
  const [sumExpenses, setSumExpenses] = React.useState(0)
  const [sumIncomes, setSumIncomes] = React.useState(0)
  const [sumTotal, setSumTotal] = React.useState(0)

  React.useEffect(() => {
    if ( formattedMonths ) {
      const startYear = moment(selectedDate).startOf('year').valueOf()
      const endYear = moment(selectedDate).endOf('year').valueOf()
      const selectedMonthsHelper = []
      let sumExpensesHelper = 0
      let sumIncomesHelper = 0
      let sumTotalHelper = 0
      for ( let i = 0 ; i < formattedMonths.length; i++ ) {
        if ( formattedMonths[i].timestamp >= startYear && formattedMonths[i].timestamp <= endYear ) {
          const user = find(formattedMonths[i].users, (item) => item.id == selectedUser.id)
          if ( user ) {
            const income = Math.round(sumBy(user.categories, (item) => item.income) * 100) / 100
            const expense = Math.round(sumBy(user.categories, (item) => item.expense) * 100) / 100
            const total = Math.round((income - expense) * 100) / 100
            sumIncomesHelper += income
            sumExpensesHelper += expense
            sumTotalHelper += total
            selectedMonthsHelper.push({
              timestamp: formattedMonths[i].timestamp,
              income,
              expense,
              total
            })
          }
        }
      }
      setSumIncomes(sumIncomesHelper)
      setSumExpenses(sumExpensesHelper)
      setSumTotal(sumTotalHelper)
      setSelectedMonths(orderBy(selectedMonthsHelper, [order[0]], [order[1]]))
    }
  }, [formattedMonths, selectedDate, selectedUser, order])

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
          onPress={() => setShowDatePicker('Year')}
        >
          {moment(selectedDate).format('YYYY')}
        </Chip>
        <Chip
          icon="account"
          onPress={() => setShowMemberPicker(true)}
        >
          {selectedUser.name}
        </Chip>
      </View>
      <Text style={[styles.smallText, { margin: 5, textAlign: 'center', color: theme.colors.notification }]}>Click on a row to view details of that month</Text>
      { selectedMonths && selectedMonths.length > 0
        ? <DataTable style={{ marginBottom: 165, backgroundColor: theme.colors.surface, elevation: 2, borderRadius: theme.roundness }}>
            <DataTable.Header style={styles.tableHeader}>
              <DataTable.Title
                sortDirection={order[0] == 'timestamp' ? order[1] == 'asc' ? 'ascending' : 'descending' : null}
                onPress={() => setOrder(['timestamp', order[0] == 'timestamp' ? order[1] == 'asc' ? 'desc' : 'asc' : 'asc'])}
              >
                Month
              </DataTable.Title>
              <DataTable.Title
                sortDirection={order[0] == 'income' ? order[1] == 'asc' ? 'ascending' : 'descending' : null}
                onPress={() => setOrder(['income', order[0] == 'income' ? order[1] == 'asc' ? 'desc' : 'asc' : 'asc'])}
                numeric
              >
                Income
              </DataTable.Title>
              <DataTable.Title
                sortDirection={order[0] == 'expense' ? order[1] == 'asc' ? 'ascending' : 'descending' : null}
                onPress={() => setOrder(['expense', order[0] == 'expense' ? order[1] == 'asc' ? 'desc' : 'asc' : 'asc'])}
                numeric
              >
                Expense
              </DataTable.Title>
              <DataTable.Title
                sortDirection={order[0] == 'total' ? order[1] == 'asc' ? 'ascending' : 'descending' : null}
                onPress={() => setOrder(['total', order[0] == 'total' ? order[1] == 'asc' ? 'desc' : 'asc' : 'asc'])}
                numeric
              >
                Total
              </DataTable.Title>
            </DataTable.Header>
            <FlatList
              data={selectedMonths}
              keyExtractor={(item) => item.timestamp.toString()}
              renderItem={(row) => {
                return (
                  <TouchableOpacity onPress={() => {
                    navigateToTab(1)
                    setSelectedDate(row.item.timestamp)
                  }}>
                    <DataTable.Row style={styles.tableRow}>
                      <DataTable.Cell>{moment(row.item.timestamp).format('MMMM YYYY')}</DataTable.Cell>
                      <DataTable.Cell numeric>
                        <Text style={ row.item.income > 0 ? { color: theme.colors.accent } : null }>
                          {context.householdData.currency + ' ' + row.item.income.toString().replace('.' , ',')}
                        </Text>
                      </DataTable.Cell>
                      <DataTable.Cell numeric>
                        <Text style={ row.item.expense > 0 ? { color: theme.colors.error } : null }>
                          { row.item.expense > 0 ? context.householdData.currency + ' -' + row.item.expense.toString().replace('.' , ',') : context.householdData.currency + ' ' + row.item.expense.toString().replace('.' , ',')}
                        </Text>
                      </DataTable.Cell>
                      <DataTable.Cell numeric>
                        <Text style={ row.item.total > 0 ? { color: theme.colors.accent } : row.item.total < 0 ? { color: theme.colors.error } : null }>
                          { context.householdData.currency + ' ' + row.item.total.toString().replace('.' , ',') }
                        </Text>
                      </DataTable.Cell>
                    </DataTable.Row>
                  </TouchableOpacity>
                )
              }}
            />
            <DataTable.Row style={[styles.tableRow, { borderTopWidth: 0.5, borderColor: theme.colors.border }]}>
              <DataTable.Cell>Total</DataTable.Cell>
              <DataTable.Cell numeric>
                <Text style={ sumIncomes > 0 ? { color: theme.colors.accent } : null }>
                  {context.householdData.currency + ' ' + sumIncomes.toString().replace('.', ',')}
                </Text>
              </DataTable.Cell>
              <DataTable.Cell numeric>
                <Text style={ sumExpenses > 0 ? { color: theme.colors.error } : null }>
                  { sumExpenses > 0
                    ? context.householdData.currency + ' -' + sumExpenses.toString().replace('.', ',')
                    : context.householdData.currency + ' -' + sumExpenses.toString().replace('.', ',')
                  }
                </Text>
              </DataTable.Cell>
              <DataTable.Cell numeric>
                <Text style={ sumTotal > 0 ? { color: theme.colors.accent } : sumTotal < 0 ? { color: theme.colors.error } : null }>
                  {context.householdData.currency + ' ' + sumTotal.toString().replace('.', ',')}
                </Text>
              </DataTable.Cell>
            </DataTable.Row>
          </DataTable>
        : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: theme.colors.accent }}>There are no transactions for the selected filters</Text>
          </View>
      }
    </View>
  )
}

export default withTheme(TransactionsMonths)
