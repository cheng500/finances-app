/**
 * @flow
 */
'use strict'

import React from 'react'
import { StyleSheet, ToastAndroid, View } from 'react-native'

import { Button, List, TextInput, withTheme } from 'react-native-paper'

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'

import { ErrorText } from './index'


const styles = StyleSheet.create({
  style: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  inputStyle: {
    flex: 0.7,
    height: 47,
    marginTop: 13,
    paddingLeft: 4,
  },
  editIcon: {
    flex: 0.15,
    height: 47,
    margin: 0,
    marginTop: 13,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 0,
  }
})

const SettingsEditField = (props) => {
  const {
    required, errorText, title, inputStyle, style, editable, theme, onSubmit, ...oriProps
  } = props
  const [error, setError] = React.useState(false)
  const [showEdit, setShowEdit] = React.useState(false)
  const [value, setValue] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    setValue(title)
  }, [title])

  return (
    showEdit
    ? <View style={[styles.style, style]}>
        <TextInput
          {...oriProps}
          error={error}
          value={value}
          style={[styles.inputStyle, inputStyle]}
          onChangeText={(text) => setValue(text)}
        />
        <Button
          compact
          color={theme.colors.text}
          loading={isLoading}
          style={styles.editIcon}
          onPress={
            ! isLoading
            ? () => {
                const helper = value.trim()
                if ( helper != title ) {
                  setIsLoading(true)
                  if ( required ) {
                    setError(false)
                    if ( helper ) {
                      onSubmit(helper, (response) => {
                        if ( response.success ) {
                          setShowEdit(false)
                        } else {
                          setError(true)
                          ToastAndroid.show(response.error, ToastAndroid.SHORT)
                        }
                        setIsLoading(false)
                      })
                    } else {
                      setIsLoading(false)
                      setError(true)
                      ToastAndroid.show(errorText, ToastAndroid.SHORT)
                    }
                  } else {
                    onSubmit(helper, (response) => {
                      if ( response.success ) {
                        setShowEdit(false)
                      } else {
                        setError(true)
                        ToastAndroid.show(response.error, ToastAndroid.SHORT)
                      }
                      setIsLoading(false)
                    })
                  }
                } else {
                  setShowEdit(false)
                }
              }
            : null
          }
        >
          { ! isLoading && (<MaterialCommunityIcons name="check" size={26}/>)}
        </Button>
        <Button
          compact
          compact
          color={theme.colors.text}
          style={styles.editIcon}
          onPress={
            ! isLoading
            ? () => {
                setValue(title)
                setShowEdit(false)
              }
            : null
          }
        >
          <MaterialCommunityIcons name="close" size={26}/>
        </Button>
      </View>
    : <List.Item
        title={title}
        right={editable ? () => <List.Icon icon="pencil" /> : null}
        style={{ height: 60 }}
        onPress={editable ? () => setShowEdit(true) : null}
      />
  )
}

export default withTheme(SettingsEditField)
