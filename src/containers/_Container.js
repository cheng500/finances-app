/**
 * @flow
 */
'use strict'

import React from 'react'
import { StyleSheet, View } from 'react-native'
import { withTheme } from 'react-native-paper'

import { AuthContext } from '../helpers/contexts'

const styles = StyleSheet.create({
  style: {}
})

const _Container = (props) => {
  const context = React.useContext(AuthContext)
  const theme = props.theme

  return <View style={styles.style}></View>
}

export default withTheme(_Container)
