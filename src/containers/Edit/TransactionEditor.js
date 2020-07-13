/**
 * @flow
 */
'use strict'

import React from 'react'
import { ActivityIndicator, StyleSheet, ScrollView, TouchableOpacity, View } from 'react-native'
import {
  Button, Chip, Dialog, Paragraph, Portal, Subheading, Text, TextInput,
  withTheme
} from 'react-native-paper'
import DateTimePicker from '@react-native-community/datetimepicker'
import moment from 'moment'
import { each, find, map } from 'lodash'

import { AuthContext } from '../../helpers/contexts'

import {
  deleteRecurringTransaction, deleteTransaction, editRecurringTransaction, editTransaction
} from '../../helpers/firebase'
import categories from '../../helpers/categories'
import periods from '../../helpers/periods'

import { ErrorText, ModalPicker, SuccessText } from '../../components/index'

const styles = StyleSheet.create({
  chipStyle: {
    marginBottom: 5,
    marginRight: 10
  },
  chipRowStyle: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    flexWrap: 'wrap'
  },
  errorText: {
    marginLeft: 14,
  },
  rowStyle: {
    marginTop: 5
  },
  subheadingStyle: {
    marginTop: 5,
    marginLeft: 14,
  }
})

const TransactionEditor = (props) => {
  const defaultTitles = ['Expense', 'Income', 'Recurring Expense', 'Recurring Income']
  const context = React.useContext(AuthContext)
  const { formattedAccess, navigation, theme } = props
  const dateInput = React.useRef(null)
  const [amount, setAmount] = React.useState(null)
  const [category, setCategory] = React.useState(null)
  const [date, setDate] = React.useState(null)
  const [period, setPeriod] = React.useState(null)
  const [membersAmount, setMembersAmount] = React.useState(null)
  const [title, setTitle] = React.useState(null)
  const [transaction, setTransaction] = React.useState(null)
  const [errors, setErrors] = React.useState({})
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isExpense, setIsExpense] = React.useState(true)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRecurring, setIsRecurring] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isSuccessful, setIsSuccessful] = React.useState(false)
  const [showCategoryPicker, setShowCategoryPicker] = React.useState(false)
  const [showDatePicker, setShowDatePicker] = React.useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const [showPaidDialog, setShowPaidDialog] = React.useState(false)
  const [showPeriodPicker, setShowPeriodPicker] = React.useState(false)
  const [showMemberPicker, setShowMemberPicker] = React.useState(false)

  React.useEffect(() => {
    if ( props.route.params && props.route.params.transaction ) {
      const transaction = props.route.params.transaction
      setAmount(transaction.amount.toString().replace('.', ','))
      setCategory(transaction.category)
      setDate(transaction.timestamp)
      setPeriod(transaction.period)
      setIsExpense(props.route.params.isExpense)
      setIsRecurring(props.route.params.isRecurring)
      const helper = {}
      each(formattedAccess, (item) => {
        helper[item.id] = transaction.membersAmount[item.id] ? transaction.membersAmount[item.id].toString().replace('.', ',') : '0'
      })
      setMembersAmount(helper)
      setTitle(transaction.title)
      setTransaction(transaction)
    } else {
      setAmount('0')
      setCategory('Others')
      setDate(moment().startOf('day').valueOf())
      setPeriod(2)
      setIsExpense(true)
      setIsRecurring(false)
      const helper = {}
      each(formattedAccess, (item) => {
        helper[item.id] = '0'
      })
      setMembersAmount(helper)
      setDefaultTitle(true)
      setTransaction(null)
    }
    setIsLoading(false)
  }, [props.route.params && props.route.params.transaction])

  React.useEffect(() => {
    if ( membersAmount && formattedAccess ) {
      const obj = {}
      for ( let i = 0; i < formattedAccess.length; i++ ) {
        obj[formattedAccess[i].id] = membersAmount[formattedAccess[i].id] ? membersAmount[formattedAccess[i].id] : '0'
      }
      setMembersAmount(obj)
    }
  }, [formattedAccess])

  React.useEffect(() => {
    if ( amount && membersAmount ) {
      let sum = 0
      each(membersAmount, (item) => sum += Number(item.replace(',', '.')))
      if ( amount && ! isNaN(sum) && sum != Number(amount) ) {
        const difference = amount ? Number(amount.replace(',', '.')) - sum : -sum
        const calc = membersAmount[context.user.uid] ? Number(membersAmount[context.user.uid].replace(',', '.')) + difference : difference
        if ( calc >= 0 ) {
          setMembersAmount({ ...membersAmount, [context.user.uid]: (Math.round(calc * 100) / 100).toString().replace('.', ',') })
        } else {
          selectMembersAmount(context.user.uid, amount)
        }
      }
    }
  }, [amount])

  React.useEffect(() => {
    if ( amount && membersAmount ) {
      let sum = 0
      each(membersAmount, (member, key) => sum += member ? Number(member.replace(',', '.')) : 0)
      if ( ! isNaN(sum) ) {
        const helper = (Math.round(sum * 100) / 100)
        if ( helper != Number(amount.toString().replace(',', '.')) ) {
          setAmount(helper.toString().replace('.', ','))
        }
      } else {
        setAmount('')
      }
    }
  }, [membersAmount])

  React.useEffect(() => setDefaultTitle(false), [isRecurring, isExpense])

  const resetTitle = () => {
    if ( defaultTitles.indexOf(title) >= 0 ) {
      setTitle('')
    }
  }

  const setDefaultTitle = (force) => {
    if ( force || ! title || defaultTitles.indexOf(title) >= 0 ) {
      setTitle(
        isExpense
        ? isRecurring
          ? 'Recurring Expense'
          : 'Expense'
        : isRecurring
          ? 'Recurring Income'
          : 'Income'
      )
    }
  }

  const onSubmitTransaction = () => {
    if ( ! isSubmitting ) {
      setIsSubmitting(true)
      setErrors({})
      setIsSuccessful(false)

      const helper = {}
      const errs = {}
      const amountNumber = Number(amount.replace(',', '.'))
      let sum = 0

      const promise = new Promise((resolve, reject) => {
        if ( ! title ) {
          errs.title = "Title cannot be empty"
        }
        each(membersAmount, (item, key) => {
          const num = Number(item.replace(',', '.'))
          if ( ! isNaN(num) ) {
            helper[key] = num
            sum += num
          } else {
            if ( ! errs.membersAmount ) {
              errs.membersAmount = {}
            }
            errs.membersAmount[key] = "Must be a number"
          }
        })
        if ( ! isNaN(sum) ) {
          sum = Math.round(sum * 100) / 100
        }

        if ( isNaN(amountNumber) ) {
          errs.amount = "Must be a number"
        } else if ( amountNumber <= 0 ) {
          errs.amount = "Must be greater than 0"
        } else {
          if ( sum.toString().replace('.', ',') != amount ) {
            errs.amount = "Must be equal to the total of all members"
          }
        }

        if ( isNaN(date) ) {
          errs.date = "Must be a valid date"
        }

        if ( Object.keys(errs).length > 0 ) {
          reject()
        } else {
          if ( isRecurring ) {
            editRecurringTransaction(
              context.householdData.months,
              context.userData.householdID,
              transaction,
              {
                title,
                amount: amountNumber,
                membersAmount: helper,
                timestamp: Number(date),
                category,
                period
              },
              isExpense,
              (response) => {
                if ( response.success ) {
                  resolve()
                } else {
                  errs.general = transaction
                  ? isExpense
                    ? "Recurring Expense could not be added. Contact admin if problem persists."
                    : "Recurring Income could not be added. Contact admin if problem persists."
                  : isExpense
                    ? "Recurring Expense could not be edited. Contact admin if problem persists."
                    : "Recurring Income could not be edited. Contact admin if problem persists."
                  reject()
                }
              }
            )
          } else {
            const month = context.householdData.months[moment(Number(date)).startOf('month').format('x')]
            if (
              ! month
              || isExpense && month.eCounter < 350
              || ! isExpense && month.iCounter < 350
            ) {
              editTransaction(
                context.householdData.months,
                context.userData.householdID,
                transaction,
                {
                  title,
                  amount: amountNumber,
                  membersAmount: helper,
                  timestamp: Number(date),
                  category
                },
                isExpense,
                (response) => {
                  if ( response.success ) {
                    resolve()
                  } else {
                    errs.general = transaction
                    ? isExpense
                      ? "Expense could not be added. Contact admin if problem persists."
                      : "Income could not be added. Contact admin if problem persists."
                    : isExpense
                      ? "Expense could not be edited. Contact admin if problem persists."
                      : "Income could not be edited. Contact admin if problem persists."
                    reject()
                  }
                }
              )
            } else {
              errs.general = 'Premium account needed'
              reject()
            }
          }
        }
      })

      promise.then(() => {
        setAmount('0')
        setCategory('Others')
        setDate(moment().startOf('day').valueOf())
        setPeriod(2)
        setDefaultTitle(true)
        selectMembersAmount()
        setIsSubmitting(false)
        setIsSuccessful(true)
        setTimeout(() => {
          setIsSuccessful(false)
        }, 2000)
        if ( transaction ) {
          setTransaction(null)
          navigation.goBack()
        }
      }).catch(() => {
        setIsSubmitting(false)
        setErrors(errs)
      })
    }
  }

  const onResetTransaction = () => {
    setAmount(transaction.amount.toString().replace('.', ','))
    setCategory(transaction.category)
    setDate(transaction.timestamp)
    const helper = {}
    if ( transaction ) {
      each(transaction.membersAmount, (item, key) => {
        helper[key] = item.toString().replace('.', ',')
      })
    }
    setMembersAmount(helper)
    setTitle(transaction.title)
  }

  const selectMembersAmount = (id: string = null, selectedValue: string = null, otherValue: string = null) => {
    const obj = {}
    for ( let i = 0; i < formattedAccess.length; i++ ) {
      if ( id === null && selectedValue === null && otherValue === null ) {
        obj[formattedAccess[i].id] = obj[formattedAccess[i].id] ? obj[formattedAccess[i].id] : '0'
      } else {
        obj[formattedAccess[i].id] = formattedAccess[i].id == id ? selectedValue.replace('.', ',') : otherValue !== null ? otherValue.replace('.', ',') : '0'
      }
    }
    setMembersAmount(obj)
  }

  const onDeleteTransaction = () => {
    if ( ! isDeleting ) {
      setIsDeleting(true)
      if ( ! isRecurring ) {
        deleteTransaction(
          context.householdData.months,
          context.userData.householdID,
          transaction,
          isExpense,
          (response) => {
            if ( response.success ) {
              setIsDeleting(false)
              setShowDeleteDialog(false)
              navigation.goBack()
            } else {
              setErrors({ ...errors, general: isExpense ? 'Expense could not be deleted' : 'Income could not be deleted'})
            }
          }
        )
      } else {
        deleteRecurringTransaction(
          context.userData.householdID,
          transaction,
          isExpense,
          (response) => {
            if ( response.success ) {
              setIsDeleting(false)
              setShowDeleteDialog(false)
              navigation.goBack()
            } else {
              setErrors({ ...errors, general: isExpense ? 'Recurring expense could not be deleted' : 'Recurring income could not be deleted'})
            }
          }
        )
      }
    }
  }

  if ( isLoading ) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} />
  }

  return (
    <ScrollView style={{ paddingHorizontal: 10, paddingTop: 10 }}>
      { ! transaction
        ? <View>
            <View style={[styles.rowStyle, { flexDirection: 'row', justifyContent: 'space-between' }]}>
              <Chip
                selected={isExpense}
                onPress={() => setIsExpense(true)}
              >
                Expense
              </Chip>
              <Chip
                selected={! isExpense}
                onPress={() => setIsExpense(false)}
              >
                Income
              </Chip>
            </View>
            <View style={[styles.rowStyle, { flexDirection: 'row', justifyContent: 'space-between' }]}>
              <Chip
                selected={! isRecurring}
                onPress={() => setIsRecurring(false)}
              >
                Single
              </Chip>
              <Chip
                selected={isRecurring}
                onPress={() => {
                  if ( context.householdData.isPaid ) {
                    setIsRecurring(true)
                    setDate(date < moment().startOf('day').valueOf() ? moment().startOf('day').valueOf() : date)
                  } else {
                    setShowPaidDialog(true)
                  }
                }}
              >
                Recurring
              </Chip>
            </View>
          </View>
        : <Subheading style={[styles.rowStyle, styles.subheadingStyle]}>
          {
            isExpense
            ? isRecurring
              ? 'Recurring Expense'
              : 'Expense'
            : isRecurring
              ? 'Recurring Income'
              : 'Income'
          }
          </Subheading>
      }
      { isRecurring && (
        <Text style={{ margin: 5, textAlign: 'center', color: theme.colors.notification, fontSize: 10 }}>Recurring transactions will create an expense/income every period</Text>
      ) }
      <TextInput
        error={errors.title}
        label="Title"
        mode="outlined"
        value={title}
        style={styles.rowStyle}
        onBlur={() => setDefaultTitle(false)}
        onChangeText={(text) => setTitle(text)}
        onFocus={resetTitle}
      />
      { errors.title && (
        <ErrorText style={styles.errorText}>{errors.title}</ErrorText>
      )}
      <TextInput
        error={errors.amount}
        keyboardType="numeric"
        label="Amount"
        mode="outlined"
        style={styles.rowStyle}
        value={amount}
        onBlur={() => {
          if ( ! amount ) {
            setAmount('0')
          }
        }}
        onChangeText={(text) => {
          if ( ! isNaN(text.replace(',', '.')) ) {
            setAmount(text.replace('.', ','))
          }
        }}
        onFocus={() => {
          if ( amount == '0' ) {
            setAmount(null)
          }
        }}
      />
      { errors.amount && (
        <ErrorText style={styles.errorText}>{errors.amount}</ErrorText>
      )}
      <TouchableOpacity onPress={() => setShowDatePicker(true)}>
        <TextInput
          ref={dateInput}
          editable={false}
          error={errors.date}
          label={isRecurring ? 'Next due date' : 'Date'}
          mode="outlined"
          style={styles.rowStyle}
          value={moment(date).format('DD.MM.YYYY')}
        />
      </TouchableOpacity>
      { errors.date && (
        <ErrorText style={styles.errorText}>{errors.date}</ErrorText>
      )}
      { isRecurring && (
        <TouchableOpacity onPress={() => setShowPeriodPicker(true)}>
          <TextInput
            editable={false}
            label="Period"
            mode="outlined"
            style={styles.rowStyle}
            value={find(periods, (item) => item.value == period).name}
          />
        </TouchableOpacity>
      ) }
      <TouchableOpacity onPress={() => setShowCategoryPicker(true)}>
        <TextInput
          editable={false}
          label="Category"
          mode="outlined"
          style={styles.rowStyle}
          value={category}
        />
      </TouchableOpacity>
      <Subheading style={[styles.rowStyle, styles.subheadingStyle]}>Members</Subheading>
      <View style={styles.chipRowStyle}>
        <Chip
          style={styles.chipStyle}
          onPress={() => {
            const amountNumber = amount.replace(',', '.')
            if ( ! isNaN(amountNumber) ) {
              const part = Math.round(Number(amountNumber) / formattedAccess.length * 100) / 100
              selectMembersAmount(formattedAccess[formattedAccess.length - 1].id, part.toString(), (Math.round((amountNumber - part * (formattedAccess.length - 1)) * 100) / 100).toString())
            }
          }}
        >
          Divide Evenly
        </Chip>
        <Chip
          style={styles.chipStyle}
          onPress={() => setShowMemberPicker(true)}
        >
          Select Member
        </Chip>
      </View>
      { map(formattedAccess, (item) => {
          return (
            <View key={item.id}>
              <TextInput
                dense={true}
                error={errors.membersAmount && errors.membersAmount[item.id]}
                keyboardType="numeric"
                label={item.active ? item.name : item.name + ' (inactive)'}
                mode="outlined"
                value={membersAmount[item.id]}
                style={{ marginVertical: 3 }}
                onBlur={() => {
                  if ( ! membersAmount[item.id] ) {
                    setMembersAmount({ ...membersAmount, [item.id]: '0' })
                  }
                }}
                onChangeText={(text) => {
                  if ( ! isNaN(text.replace(',', '.')) ) {
                    setMembersAmount({ ...membersAmount, [item.id]: text.replace('.', ',') })
                  }
                }}
                onFocus={() => {
                  if ( membersAmount[item.id] == '0' ) {
                    setMembersAmount({ ...membersAmount, [item.id]: null })
                  }
                }}
              />
              { errors.membersAmount && errors.membersAmount[item.id] && (
                <ErrorText style={styles.errorText}>{errors.membersAmount[item.id]}</ErrorText>
              )}
            </View>
          )
        })
      }
      <View style={{ flexDirection: 'row', marginTop: 10 }}>
        { transaction && (
          <Button
            mode="contained"
            style={[styles.rowStyle, { flex: 1, marginRight: 5 }]}
            onPress={onResetTransaction}
          >
            Reset
          </Button>
        )}
        { transaction && (
          <Button
            mode="contained"
            style={[styles.rowStyle, { flex: 1 }]}
            onPress={() => setShowDeleteDialog(true)}
          >
            Delete
          </Button>
        )}
        <Button
          loading={isSubmitting}
          mode="contained"
          style={[styles.rowStyle, { flex: 1, marginLeft: transaction ? 5 : 0 }]}
          onPress={onSubmitTransaction}
        >
          { ! isSubmitting ? transaction ? 'Edit' : 'Add' : null }
        </Button>
      </View>

      { errors.general && (
        <ErrorText style={{ textAlign: 'center', marginTop: 10 }}>{errors.general}</ErrorText>
      )}
      <SuccessText style={{ textAlign: 'center', marginTop: 10, marginBottom: isSuccessful ? 20 : 0 }}>{ isSuccessful ? isExpense ? 'Expense has been successfully added' : 'Income has been successfully added' : null }</SuccessText>
      { showDatePicker && (
        <DateTimePicker
          display="spinner"
          value={moment(date).toDate()}
          is24Hour={true}
          minimumDate={isRecurring ? moment().startOf('day').toDate() : null}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false)
            if ( selectedDate ) {
              setDate(moment(selectedDate).startOf('day').valueOf())
            }
            dateInput.current && dateInput.current.blur()
          } }
        />
      )}
      <ModalPicker
        items={categories}
        labelSelector="name"
        title="Select Category"
        type="grid"
        gridPerRow={4}
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        onSelectItem={(item) => setCategory(item.name)}
      />
      <ModalPicker
        items={formattedAccess}
        labelSelector="name"
        title="Select Member"
        visible={showMemberPicker}
        onClose={() => setShowMemberPicker(false)}
        onSelectItem={(item) => selectMembersAmount(item.id, amount)}
      />
      <ModalPicker
        items={periods}
        labelSelector="name"
        title="Select Period"
        visible={showPeriodPicker}
        onClose={() => setShowPeriodPicker(false)}
        onSelectItem={(item) => setPeriod(item.value)}
      />
      <Portal>
        <Dialog
          visible={showPaidDialog}
          onDismiss={() => setShowPaidDialog(false)}
        >
          <Dialog.Title>Recurring Transactions</Dialog.Title>
          <Dialog.Content>
            <Paragraph>Recurring Transactions is a paid function</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowPaidDialog(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <Portal>
        <Dialog
          visible={showDeleteDialog}
          onDismiss={() => setShowDeleteDialog(false)}
        >
          <Dialog.Title>Delete Transaction</Dialog.Title>
          <Dialog.Content>
            <Paragraph>Are you sure you want to proceed? Deleted { isExpense ? 'expenses' : 'incomes' } cannot be recovered. </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button loading={isDeleting} color={theme.colors.error} onPress={onDeleteTransaction}>{ ! isDeleting ? 'Delete' : null}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  )
}

export default withTheme(TransactionEditor)
