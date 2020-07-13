/**
 * @flow
 */
'use strict'

import React from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Avatar, Button, TextInput, Text, withTheme } from 'react-native-paper'

import validator from 'validator'

import { createNewUser, login, signUp } from '../helpers/firebase'

import { ErrorText } from '../components/index'

const Login = (props) => {
  const { name, setName, theme } = props
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [errors, setErrors] = React.useState({})
  const [isLoading, setIsLoading] = React.useState(false)
  const [isLogin, setIsLogin] = React.useState(true)

  const onSubmit = () => {
    const passwordRegex = new RegExp("^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})")
    const emailTrimed = email.trim()
    const nameTrimed = name.trim()
    const errorsHelper = {}
    setErrors({})
    setIsLoading(true)

    if ( isLogin ) {
      if ( ! emailTrimed || ! password ) {
        errorsHelper.general = 'Login failed, please try again'
      }
    } else {
      if ( ! validator.isEmail(emailTrimed) ) {
        errorsHelper.email = 'Must be a valid email address'
      }
      if ( ! password.match(passwordRegex) ) {
        errorsHelper.password = 'Minimum eight characters, at least one letter, one number and one special character'
      }
      if ( ! nameTrimed ) {
        errorsHelper.name = 'Cannot be empty'
      }
    }

    const promise = new Promise((resolve, reject) => {
      if ( Object.keys(errorsHelper).length <= 0 ) {
        if ( isLogin ) {
          login(emailTrimed, password, (response) => {
            if ( response.success ) {
              resolve()
            } else {
              errorsHelper.general = response.error
              reject()
            }
          })
        } else {
          signUp(emailTrimed, password, nameTrimed, (response) => {
            if ( response.success ) {
              createNewUser(response.data.uid, { householdID: null, name: response.data.displayName ? response.data.displayName : name })
              resolve()
            } else {
              errorsHelper.general = response.error
              reject()
            }
          })
        }
      } else {
        reject()
      }
    })

    promise.catch(() => {
      setErrors(errorsHelper)
      setIsLoading(false)
    })
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: '80%' }}>
        <Avatar.Icon
          size={200}
          icon="home"
          style={{ alignSelf: 'center', marginBottom: 20 }}
        />
        { ! isLogin && (
          <TextInput
            label="Name"
            mode="outlined"
            value={name}
            error={errors.name}
            onChangeText={setName}
          />
        ) }
        { ! isLogin && (
          <ErrorText style={{ paddingHorizontal: 5, height: 12 }}>{errors.name ? errors.name : null}</ErrorText>
        ) }
        <TextInput
          label="E-Mail"
          mode="outlined"
          value={email}
          error={errors.email}
          onChangeText={setEmail}
        />
        <ErrorText style={{ paddingHorizontal: 5, height: 12 }}>{errors.email ? errors.email : null}</ErrorText>
        <TextInput
          secureTextEntry={true}
          label="Password"
          mode="outlined"
          value={password}
          error={errors.password}
          onChangeText={setPassword}
        />
        <ErrorText style={{ paddingHorizontal: 5, height: 24 }}>{errors.password ? errors.password : null}</ErrorText>
        { isLoading
          ? <ActivityIndicator size="large" color={theme.colors.primary} style={{ height: 120 }} />
          : <View style={{ height: 120 }}>
              <ErrorText style={{ alignSelf: 'center', marginBottom: 10 }}>{errors.general}</ErrorText>
              <Button
                mode="contained"
                style={{ alignSelf: 'center', width: 150, paddingVertical: 5 }}
                onPress={onSubmit}
              >
                { isLogin ? "Login" : "Register" }
              </Button>
              <Button
                color={theme.colors.accent}
                uppercase={false}
                style={{ alignSelf: 'center', marginTop: 10 }}
                onPress={() => {
                  setIsLogin(!isLogin)
                  setErrors({})
                } }
              >
                { isLogin ? "No account?" : "Have an account?" }
              </Button>
            </View>
        }
      </View>
    </View>
  )
}

export default withTheme(Login)
