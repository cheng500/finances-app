/**
 * @flow
 */
'use strict'

import React from 'react'
import { StyleSheet, View } from 'react-native'

import { withTheme } from 'react-native-paper'


const styles = StyleSheet.create({
  style: {}
})

const _Component = (props) => {
  const { style, theme } = props

  return <View style={styles.style}></View>
}

export default withTheme(_Component)
