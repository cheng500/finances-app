/**
 * @flow
 */
'use strict'

import React from 'react'
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native'
import { Chip, DataTable, Text, withTheme } from 'react-native-paper'

import { filter, find, map, orderBy, sumBy } from 'lodash'
import moment from 'moment'

import { AuthContext } from '../../helpers/contexts'
import categories from '../../helpers/categories'

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

const TransactionsCategory = (props) => {
  const context = React.useContext(AuthContext)
  const {
    selectedDate, selectedUser, formattedMonths, onlyActiveAccess, navigateToTab,
    setSelectedCategory, setShowDatePicker, setShowMemberPicker, style, theme
  } = props
  const [categorizedTransactions, setCategorizedTransactions] = React.useState(null)
  const [expenseSum, setExpenseSum] = React.useState(0)
  const [incomeSum, setIncomeSum] = React.useState(0)
  const [order, setOrder] = React.useState(['name', 'asc'])
  const [selectedSums, setSelectedSums] = React.useState(null)

  React.useEffect(() => {
    if ( formattedMonths ) {
      const selectedMonth = find(formattedMonths, (item) => item.timestamp == selectedDate)
      let selectedSums = {}
      if ( selectedMonth ) {
        selectedSums = find(selectedMonth.users, (item) => item.id == selectedUser.id)
      }
      setSelectedSums(selectedSums)
    }
  }, [formattedMonths, selectedDate, selectedUser])

  React.useEffect(() => {
    if ( selectedSums ) {
      setCategorizedTransactions(orderBy(filter(map(selectedSums.categories, (item) => {
        return {
          ...item,
          expense: item ? item.expense : 0,
          income: item ? item.income : 0,
          total: item ? Math.round((item.income - item.expense) * 100) / 100 : 0
        }
      }), (fItem) => fItem.expense != 0 || fItem.income != 0), [order[0]], [order[1]]))
      setExpenseSum(Math.round(sumBy(selectedSums.categories, (item) => item.expense) * 100) / 100)
      setIncomeSum(Math.round(sumBy(selectedSums.categories, (item) => item.income) * 100) / 100)
    }
  }, [selectedSums, order])

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
          icon="account"
          onPress={() => setShowMemberPicker(true)}
        >
          {selectedUser.name}
        </Chip>
      </View>
      <Text style={[styles.smallText, { margin: 5, textAlign: 'center', color: theme.colors.notification }]}>Click on a cell to view details of that category</Text>
      { categorizedTransactions
        ? <DataTable style={{ marginBottom: 165, backgroundColor: theme.colors.surface, elevation: 2, borderRadius: theme.roundness }}>
            <DataTable.Header style={styles.tableHeader}>
              <DataTable.Title
                sortDirection={order[0] == 'category' ? order[1] == 'asc' ? 'ascending' : 'descending' : null}
                onPress={() => setOrder(['category', order[0] == 'category' ? order[1] == 'asc' ? 'desc' : 'asc' : 'asc'])}
              >
                Category
              </DataTable.Title>
              <DataTable.Title
                sortDirection={order[0] == 'income' ? order[1] == 'asc' ? 'ascending' : 'descending' : null}
                onPress={() => setOrder(['income', order[0] == 'income' ? order[1] == 'asc' ? 'desc' : 'asc' : 'asc'])}
                numeric
              >
                Incomes
              </DataTable.Title>
              <DataTable.Title
                sortDirection={order[0] == 'expense' ? order[1] == 'asc' ? 'ascending' : 'descending' : null}
                onPress={() => setOrder(['expense', order[0] == 'expense' ? order[1] == 'asc' ? 'desc' : 'asc' : 'asc'])}
                numeric
              >
                Expenses
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
              data={categorizedTransactions}
              keyExtractor={(item) => item.category}
              renderItem={(row) => {
                return (
                  <DataTable.Row style={styles.tableRow}>
                    <DataTable.Cell><Text style={styles.smallText}>{row.item.category}</Text></DataTable.Cell>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => {
                      setSelectedCategory(row.item.category)
                      navigateToTab(2)
                    }}>
                      <DataTable.Cell numeric>
                        <Text style={row.item.income > 0 ? {color: theme.colors.accent} : null}>
                          {context.householdData.currency + ' ' + row.item.income.toString().replace('.', ',')}
                        </Text>
                      </DataTable.Cell>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => {
                      setSelectedCategory(row.item.category)
                      navigateToTab(3)
                    }}>
                      <DataTable.Cell numeric>
                        <Text style={row.item.expense > 0 ? {color: theme.colors.error} : null}>
                          { row.item.expense > 0 ? context.householdData.currency + ' -' + row.item.expense.toString().replace('.', ',') : context.householdData.currency + ' ' + row.item.expense.toString().replace('.', ',') }
                        </Text>
                      </DataTable.Cell>
                    </TouchableOpacity>
                    <DataTable.Cell numeric>
                      <Text style={
                        row.item.total > 0
                        ? { color: theme.colors.accent }
                        : row.item.total < 0
                          ? { color: theme.colors.error }
                          : null }
                      >
                        {context.householdData.currency + ' ' + row.item.total.toString().replace('.', ',')}
                      </Text>
                    </DataTable.Cell>
                  </DataTable.Row>
                )
              }}
            />
            <DataTable.Row style={[styles.tableRow, { borderTopWidth: 0.5, borderColor: theme.colors.border }]}>
              <DataTable.Cell>Total</DataTable.Cell>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => {
                setSelectedCategory(null)
                navigateToTab(2)
              }}>
                <DataTable.Cell numeric>
                  <Text style={ incomeSum > 0 ? { color: theme.colors.accent } : null}>
                    {context.householdData.currency + ' ' + incomeSum.toString().replace('.', ',')}
                  </Text>
                </DataTable.Cell>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => {
                setSelectedCategory(null)
                navigateToTab(3)
              }}>
                <DataTable.Cell numeric>
                  <Text style={ expenseSum > 0 ? { color: theme.colors.error } : null}>
                    { expenseSum > 0 ? context.householdData.currency + ' -' + expenseSum.toString().replace('.', ',') : context.householdData.currency + ' ' + expenseSum.toString().replace('.', ',') }
                  </Text>
                </DataTable.Cell>
              </TouchableOpacity>
              <DataTable.Cell numeric>
                <Text style={
                  incomeSum - expenseSum > 0
                  ? { color: theme.colors.accent }
                  : incomeSum - expenseSum < 0
                    ? { color: theme.colors.error }
                    : null
                }>
                  {context.householdData.currency + ' ' + (Math.round((incomeSum - expenseSum) * 100) / 100).toString().replace('.', ',')}
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

export default withTheme(TransactionsCategory)
