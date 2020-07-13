/**
 * @flow
 */
'use strict'

import React from 'react'
import { StyleSheet } from 'react-native'

import { Text, withTheme } from 'react-native-paper'


const styles = StyleSheet.create({
  style: {
    fontSize: 10
  }
})

const ErrorText = (props) => {
  const { style, theme, ...oriProps } = props
  
  return <Text style={[styles.style, { color: theme.colors.error }, style]} {...oriProps}>{props.children}</Text>
}

export default withTheme(ErrorText)
