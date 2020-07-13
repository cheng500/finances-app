/**
 * @flow
 */
'use strict'

import firebase from '@react-native-firebase/app'
import '@react-native-firebase/auth'
import '@react-native-firebase/dynamic-links'
import '@react-native-firebase/firestore'
import '@react-native-firebase/functions'

import { each, filter, map, orderBy } from 'lodash'

import moment from 'moment'

const PROD = false

export const changeCurrency = (
  householdID: string,
  currency: string,
  callback?: (data?: Object) => void
): void => {
  firebase.firestore().doc('Household/' + householdID).set({
    currency
  }, { merge: true })
  .then(() => typeof callback == 'function' && callback({ success: true }))
  .catch((error) => {
    console.log('changeCurrency: ' + error)
    typeof callback == 'function' && callback({ success: false })
  })
}

export const changeName = (
  userID: string,
  householdID: string,
  access: Object,
  name: string,
  callback?: (data?: Object) => void
): void => {
  firebase.firestore().doc('Household/' + householdID).set({
    access: {
      ...access,
      [userID]: {
        ...access[userID],
        name
      }
    }
  }, { merge: true })
  .then(() => typeof callback == 'function' && callback({ success: true }))
  .catch((error) => {
    console.log('changeName: ' + error)
    typeof callback == 'function' && callback({ success: false })
  })
}

export const createNewHousehold = (
  userID: string,
  name: string,
  currency: string,
  callback?: (data?: Object) => void
): void => {
  const ref = firebase.firestore().collection('Household').doc()
  ref.set({
    access: {
      [userID]: {
        name,
        active: true
      }
    },
    currency,
    isPaid: false,
    categories: [],
    months: {}
  }).then(() => {
    firebase.firestore().collection('Users').doc(userID).set({
      householdID: ref.id
    }, { merge: true })
    .then(() => typeof callback == 'function' && callback({ success: true, householdID: ref.id }))
    .catch((error) => {
      console.log("createNewHousehold: " + error)
      typeof callback == 'function' && callback({ success: false })
    })
  }).catch((error) => {
    console.log("createNewHousehold: " + error)
    typeof callback == 'function' && callback({ success: false })
  })
}

export const createNewUser = (userID: string, data: Object, callback?: (data: Object) => void): void => {
  firebase.firestore().collection('Users').doc(userID).set(data).then(() => typeof callback == 'function' && callback({ success: true })).catch((error) => {
    console.log('createNewUser: ' + error)
    typeof callback == 'function' && callback({ success: false })
  })
}

export const deleteRecurringTransaction = (
  householdID: string,
  transaction: Object,
  isExpense: boolean,
  callback?: (data?: Object) => void
): void => {
  firebase.firestore().collection(
    isExpense
    ? 'Household/' + householdID + '/RecurringExpenses'
    : 'Household/' + householdID + '/RecurringIncomes'
  ).doc(transaction.id).delete()
  .then(() => typeof callback == 'function' && callback({ success: true }))
  .catch((error) => {
    console.log('deleteRecurringTransaction: ' + error)
    typeof callback == 'function' && callback({ success: false })
  })
}

export const deleteTransaction = (
  householdMonths: Object,
  householdID: string,
  transaction: Object,
  isExpense: boolean,
  callback?: (data?: Object) => void
): void => {
  const duplicateMonths = {...householdMonths}
  const startOfMonth = moment(transaction.timestamp).startOf('month').valueOf().toString()
  const batch = firebase.firestore().batch()
  each(transaction.membersAmount, (item, key) => {
    if ( ! duplicateMonths[startOfMonth] ) {
      duplicateMonths[startOfMonth] = { eCounter: 0, iCounter: 0 }
    }
    if ( ! duplicateMonths[startOfMonth][key] ) {
      duplicateMonths[startOfMonth][key] = {}
    }
    if ( ! duplicateMonths[startOfMonth][key][transaction.category] ) {
      duplicateMonths[startOfMonth][key][transaction.category] = { expense: 0, income: 0 }
    }
    duplicateMonths[startOfMonth] = {
      ...duplicateMonths[startOfMonth],
      [key]: {
        ...duplicateMonths[startOfMonth][key],
        [transaction.category]: isExpense
        ? {
            ...duplicateMonths[startOfMonth][key][transaction.category],
            expense: Math.round((duplicateMonths[startOfMonth][key][transaction.category].expense - item) * 100) / 100
          }
        : {
            ...duplicateMonths[startOfMonth][key][transaction.category],
            income: Math.round((duplicateMonths[startOfMonth][key][transaction.category].income - item) * 100 ) / 100
          }
      }
    }
  })
  duplicateMonths[startOfMonth] = {
    ...duplicateMonths[startOfMonth],
    eCounter: isExpense ? duplicateMonths[startOfMonth].eCounter - 1 : duplicateMonths[startOfMonth].eCounter,
    iCounter: ! isExpense ? duplicateMonths[startOfMonth].iCounter - 1 : duplicateMonths[startOfMonth].iCounter
  }
  batch.delete(
    firebase.firestore().doc(
      isExpense
      ? 'Household/' + householdID + '/Expenses/' + transaction.id
      : 'Household/' + householdID + '/Incomes/' + transaction.id
    )
  )
  batch.set(
    firebase.firestore().doc('Household/' + householdID),
    { months: duplicateMonths },
    { merge: true }
  )
  batch.commit().then(() => {
    typeof callback == 'function' && callback({ success: true })
  }).catch((error) => {
    console.log('deleteTransaction: ' + error)
    typeof callback == 'function' && callback({ success: false })
  })
}

export const editRecurringTransaction = (
  householdMonths: Object,
  householdID: string,
  oldTransaction?: Object,
  newTransaction: Object,
  isExpense: boolean,
  callback?: (data?: Object) => void
): void => {
  const duplicateMonths = {...householdMonths}
  const batch = firebase.firestore().batch()
  const today = moment().startOf('day').valueOf()
  let timestamp = newTransaction.timestamp
  const newStartOfMonth = moment(timestamp).startOf('month').valueOf().toString()
  if (
    timestamp <= today
    && ( ! oldTransaction
    || oldTransaction.timestamp != timestamp
    )
  ) {
    if ( ! duplicateMonths[newStartOfMonth] ) {
      duplicateMonths[newStartOfMonth] = { eCounter: 0, iCounter: 0 }
    }
    each(newTransaction.membersAmount, (item, key) => {
      if ( ! duplicateMonths[newStartOfMonth][key] ) {
        duplicateMonths[newStartOfMonth][key] = {}
      }
      if ( ! duplicateMonths[newStartOfMonth][key][newTransaction.category] ) {
        duplicateMonths[newStartOfMonth][key][newTransaction.category] = { expense: 0, income: 0 }
      }
      duplicateMonths[newStartOfMonth] = {
        ...duplicateMonths[newStartOfMonth],
        [key]: {
          ...duplicateMonths[newStartOfMonth][key],
          [newTransaction.category]: isExpense
          ? {
              ...duplicateMonths[newStartOfMonth][key][newTransaction.category],
              expense: Math.round((duplicateMonths[newStartOfMonth][key][newTransaction.category].expense + item) * 100) / 100
            }
          : {
              ...duplicateMonths[newStartOfMonth][key][newTransaction.category],
              income: Math.round((duplicateMonths[newStartOfMonth][key][newTransaction.category].income + item) * 100) / 100
            }
        }
      }
    })
    duplicateMonths[newStartOfMonth] = {
      ...duplicateMonths[newStartOfMonth],
      eCounter: isExpense ? duplicateMonths[newStartOfMonth].eCounter + 1 : duplicateMonths[newStartOfMonth].eCounter,
      iCounter: ! isExpense ? duplicateMonths[newStartOfMonth].iCounter + 1 : duplicateMonths[newStartOfMonth].iCounter
    }

    batch.set(
      firebase.firestore().doc('Household/' + householdID),
      { months: duplicateMonths },
      { merge: true }
    )

    batch.set(
      firebase.firestore().collection(
        isExpense
        ? 'Household/' + householdID + '/Expenses'
        : 'Household/' + householdID + '/Incomes'
      ).doc(),
      {
        amount: newTransaction.amount,
        category: newTransaction.category,
        membersAmount: newTransaction.membersAmount,
        timestamp,
        title: newTransaction.title
      }
    )
    console.log(newTransaction)
    switch (newTransaction.period) {
      case 0:
        timestamp = moment(timestamp).add(1, 'days').valueOf()
        break
      case 1:
        timestamp = moment(timestamp).add(7, 'days').valueOf()
        break
      case 2:
        timestamp = moment(timestamp).add(1, 'month').valueOf()
        break
      case 3:
        timestamp = moment(timestamp).add(3, 'month').valueOf()
        break
      case 4:
        timestamp = moment(timestamp).add(6, 'month').valueOf()
        break
      case 5:
        timestamp = moment(timestamp).add(1, 'year').valueOf()
        break
      default:
        break
    }
  }

  batch.set(
    firebase.firestore().collection(
      isExpense
      ? 'Household/' + householdID + '/RecurringExpenses'
      : 'Household/' + householdID + '/RecurringIncomes'
    ).doc(oldTransaction ? oldTransaction.id : null),
    {
      ...newTransaction,
      timestamp,
    },
    { merge: true }
  )

  batch.commit().then(() => typeof callback == 'function' && callback({ success: true }))
  .catch((error) => {
    console.log('editRecurringTransaction: ' + error)
    typeof callback == 'function' && callback({ success: false })
  })
}

export const editTransaction = (
  householdMonths: Object,
  householdID: string,
  oldTransaction?: Object,
  newTransaction: Object,
  isExpense: boolean,
  callback?: (data?: Object) => void
): void => {
  const duplicateMonths = {...householdMonths}
  const batch = firebase.firestore().batch()
  const newStartOfMonth = moment(newTransaction.timestamp).startOf('month').valueOf().toString()
  if ( oldTransaction ) {
    const oldStartOfMonth = moment(oldTransaction.timestamp).startOf('month').valueOf().toString()
    if ( ! duplicateMonths[oldStartOfMonth] ) {
      duplicateMonths[oldStartOfMonth] = { eCounter: 0, iCounter: 0 }
    }
    each(oldTransaction.membersAmount, (item, key) => {
      if ( ! duplicateMonths[oldStartOfMonth][key] ) {
        duplicateMonths[oldStartOfMonth][key] = {}
      }
      if ( ! duplicateMonths[oldStartOfMonth][key][oldTransaction.category] ) {
        duplicateMonths[oldStartOfMonth][key][oldTransaction.category] = { expense: 0, income: 0 }
      }
      duplicateMonths[oldStartOfMonth] = {
        ...duplicateMonths[oldStartOfMonth],
        [key]: {
          ...duplicateMonths[oldStartOfMonth][key],
          [oldTransaction.category]: isExpense
          ? {
              ...duplicateMonths[oldStartOfMonth][key][oldTransaction.category],
              expense: Math.round((duplicateMonths[oldStartOfMonth][key][oldTransaction.category].expense - item) * 100) / 100
            }
          : {
              ...duplicateMonths[oldStartOfMonth][key][oldTransaction.category],
              income: Math.round((duplicateMonths[oldStartOfMonth][key][oldTransaction.category].income - item) * 100) / 100
            }
        }
      }
    })
    duplicateMonths[oldStartOfMonth] = {
      ...duplicateMonths[oldStartOfMonth],
      eCounter: isExpense ? duplicateMonths[oldStartOfMonth].eCounter - 1 : duplicateMonths[oldStartOfMonth].eCounter,
      iCounter: ! isExpense ? duplicateMonths[oldStartOfMonth].iCounter - 1 : duplicateMonths[oldStartOfMonth].iCounter
    }
  }
  if ( ! duplicateMonths[newStartOfMonth] ) {
    duplicateMonths[newStartOfMonth] = { eCounter: 0, iCounter: 0 }
  }
  each(newTransaction.membersAmount, (item, key) => {
    if ( ! duplicateMonths[newStartOfMonth][key] ) {
      duplicateMonths[newStartOfMonth][key] = {}
    }
    if ( ! duplicateMonths[newStartOfMonth][key][newTransaction.category] ) {
      duplicateMonths[newStartOfMonth][key][newTransaction.category] = { expense: 0, income: 0 }
    }
    duplicateMonths[newStartOfMonth] = {
      ...duplicateMonths[newStartOfMonth],
      [key]: {
        ...duplicateMonths[newStartOfMonth][key],
        [newTransaction.category]: isExpense
        ? {
            ...duplicateMonths[newStartOfMonth][key][newTransaction.category],
            expense: Math.round((duplicateMonths[newStartOfMonth][key][newTransaction.category].expense + item) * 100) / 100
          }
        : {
            ...duplicateMonths[newStartOfMonth][key][newTransaction.category],
            income: Math.round((duplicateMonths[newStartOfMonth][key][newTransaction.category].income + item) * 100) / 100
          }
      }
    }
  })
  duplicateMonths[newStartOfMonth] = {
    ...duplicateMonths[newStartOfMonth],
    eCounter: isExpense ? duplicateMonths[newStartOfMonth].eCounter + 1 : duplicateMonths[newStartOfMonth].eCounter,
    iCounter: ! isExpense ? duplicateMonths[newStartOfMonth].iCounter + 1 : duplicateMonths[newStartOfMonth].iCounter
  }
  batch.set(
    firebase.firestore().collection(
      isExpense
      ? 'Household/' + householdID + '/Expenses'
      : 'Household/' + householdID + '/Incomes'
    ).doc(oldTransaction ? oldTransaction.id : null),
    newTransaction
  )
  batch.set(
    firebase.firestore().doc('Household/' + householdID),
    { months: duplicateMonths },
    { merge: true }
  )
  batch.commit().then(() => {
    typeof callback == 'function' && callback({ success: true })
  }).catch((error) => {
    console.log('editTransaction: ' + error)
    typeof callback == 'function' && callback({ success: false })
  })
}

export const inviteToHousehold = (
  householdID: string,
  email: string,
  callback?: (data?: Object) => void
): void => {
  firebase.app().functions('europe-west1').httpsCallable('inviteToHousehold')({ householdID, email })
  .then((response) => {
    if ( response.data.status == 'success' ) {
      typeof callback == 'function' && callback({ success: true })
    } else {
      typeof callback == 'function' && callback({ success: false, error: response.data.error })
    }
  })
}

export const leaveHousehold = (
  userID: string,
  householdID: string,
  access: Object,
  callback?: (data?: Object) => void
): void => {
  const batch = firebase.firestore().batch()
  batch.set(
    firebase.firestore().doc('Household/' + householdID),
    {
      access: {
        ...access,
        [userID]: {
          active: false,
          name: access[userID].name
        }
      }
    },
    { merge: true }
  )
  batch.set(
    firebase.firestore().doc('Users/' + userID),
    { householdID: null },
    { merge: true }
  )
  batch.commit()
  .then(() => typeof callback == 'function' && callback({ success: true }))
  .catch((error) => {
    console.log('leaveHousehold: ' + error)
    typeof callback == 'function' && callback({ success: false })
  })
}

export const login = (email: string, password: string, callback?: (data?: Object) => void): void => {
  firebase.auth().signInWithEmailAndPassword(email, password)
  .then((response) => typeof callback == 'function' && callback({ success: true }))
  .catch((error) => {
    console.log("login: " + error)
    typeof callback == 'function' && callback({
      success: false,
      error:
        error.code == 'auth/wrong-password'
        ? 'Login failed, wrong password'
        : error.code == 'auth/user-not-found'
          ? 'Login failed, e-mail not registered'
          : error.code == 'auth/invalid-email'
            ? 'Login failed, e-mail required'
            : 'Login failed, please ensure that internet connection is available'
    })
  })
}

export const onDynamicLinks = (callback?: (data?: Object) => void): void => {
  firebase.dynamicLinks().onLink((response) => {
    const arr = response.url.split('/')
    typeof callback == 'function' && callback(arr[arr.length - 1])
  })
}

export const signUp = (
  email: string,
  password: string,
  name: string,
  callback?: (data?: Object) => void
): void => {
  firebase.auth().createUserWithEmailAndPassword(email, password)
  .then((response) => {
    response.user.updateProfile({ displayName: name })
    typeof callback == 'function' && callback({ success: true, data: response.user })
  })
  .catch((error) => {
    console.log("signUp: " + error)
    typeof callback == 'function' && callback({
      success: false,
      error:
        error.code == 'auth/invalid-email'
        ? 'Registration failed, e-mail required'
        : error.code == 'auth/email-already-in-use'
          ? 'Registration failed, e-mail already in use'
          : 'Registration failed, please ensure that internet connection is available'
    })
  })
}

export const signOut = (callback?: () => void): void => {
  firebase.auth().signOut().then(() => typeof callback == 'function' && callback())
}

export const subscribeToAuthChanges = (callback?: (data?: Object) => void): void => {
  const unsubscribe = firebase.auth().onAuthStateChanged((response) => {
    response && response.reload()
    typeof callback == 'function' && callback({
      success: true,
      data: response,
      unsubscribe
    })
  })
}

export const subscribeToHousehold = (householdID: string, callback?: (data?: object) => void): void => {
  const unsubscribe = firebase.firestore().doc('Household/' + householdID).onSnapshot({
    error: (error) => {
      console.log('subscribeToHousehold: ' + error)
      typeof callback == 'function' && callback({ success: false })
    },
    next: (snapshot) => {
      const data = snapshot.data()
      typeof callback == 'function' && callback({ success: true, unsubscribe, data: snapshot.data() })
    }
  })
}

export const subscribeToRecurringTransaction = (
  householdID: string,
  isExpense: boolean,
  callback?: (data?: Object) => void
): void => {
  const unsubscribe = firebase.firestore().collection(
    isExpense
    ? 'Household/' + householdID + '/RecurringExpenses'
    : 'Household/' + householdID + '/RecurringIncomes'
  ).onSnapshot({
    error: (error) => {
      console.log('subscribeToRecurringTransaction: ' + error)
      typeof callback == 'function' && callback({ success: false })
    },
    next: (snapshot) => {
      typeof callback == 'function' && callback({
        success: true,
        unsubscribe,
        data: map(snapshot.docs, (item) => {
          return {
            ...item.data(),
            id: item.id
          }
        })
      })
    }
  })
}

export const subscribeToTransactionDate = (
  householdID: string,
  timestamp: number,
  endTimestamp: number,
  isExpense: boolean,
  callback?: (data?: Object) => void
): void => {
  const unsubscribe = firebase.firestore().collection(
    isExpense
    ? 'Household/' + householdID + '/Expenses'
    : 'Household/' + householdID + '/Incomes'
  )
  .where('timestamp', '>=', timestamp)
  .where('timestamp', '<=', endTimestamp)
  .onSnapshot({
    error: (error) => {
      console.log('subscribeToTransactionDate: ' + error)
      typeof callback == 'function' && callback({ success: false })
    },
    next: (snapshot) => {
      typeof callback == 'function' && callback({
        success: true,
        unsubscribe,
        data: map(snapshot.docs, (item) => {
          return {
            ...item.data(),
            id: item.id
          }
        })
      })
    }
  })
}

export const subscribeToUser = (userID: string, callback?: (data?: object) => void): void => {
  const unsubscribe = firebase.firestore().doc('Users/' + userID).onSnapshot({
    error: (error) => {
      console.log('subscribeToUser: ' + error)
      typeof callback == 'function' && callback({ success: false })
    },
    next: (snapshot) => {
      typeof callback == 'function' && callback({ success: true, unsubscribe, data: snapshot.data() })
    }
  })
}

export const startEmailVerification = (callback?: (data?: Object) => void): void => {
  firebase.auth().currentUser.sendEmailVerification({
    handleCodeInApp: true,
    url: PROD ? 'https://finances.page.link/verifyUser' : 'https://financesdev.page.link/verifyUser'
  }).then(() => typeof callback == 'function' && callback({ success: true })).catch((error) => {
    console.log("startEmailVerification: " + error)
    typeof callback == 'function' && callback({ success: false })
  })
}
