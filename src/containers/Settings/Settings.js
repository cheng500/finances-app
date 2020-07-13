/**
 * @flow
 */
'use strict'

import React from 'react'
import { StyleSheet, View } from 'react-native'
import {
  Button, Dialog, Divider, IconButton, List, Paragraph, Portal, TextInput,
  withTheme
} from 'react-native-paper'

import validator from 'validator'

import {
  changeCurrency, changeName, inviteToHousehold, leaveHousehold, signOut
} from '../../helpers/firebase'

import { AuthContext } from '../../helpers/contexts'

import { ErrorText, SettingsEditField, SuccessText } from '../../components/index'

const styles = StyleSheet.create({
})

const Settings = (props) => {
  const context = React.useContext(AuthContext)
  const theme = props.theme
  const [email, setEmail] = React.useState('')
  const [errors, setErrors] = React.useState({})
  const [isInviting, setIsInviting] = React.useState(false)
  const [isLeaving, setIsLeaving] = React.useState(false)
  const [isSuccessful, setIsSuccessful] = React.useState(false)
  const [showInviteDialog, setShowInviteDialog] = React.useState(false)
  const [showLeaveDialog, setShowLeaveDialog] = React.useState(false)

  return (
    <View>
      <List.Subheader style={{ paddingBottom: 0 }}>Name</List.Subheader>
      <SettingsEditField
        editable={true}
        errorText="Cannot be empty"
        required={true}
        title={context.householdData.access[context.user.uid].name}
        onSubmit={(text, callback) => changeName(context.user.uid, context.userData.householdID, context.householdData.access, text, (response) => {
          if ( response.success ) {
            typeof callback == 'function' && callback({ success: true })
          } else {
            typeof callback == 'function' && callback({ success: false, error: 'Name could not be changed, please try again later.' })
          }
        })}
      />
      <Divider />
      <List.Subheader style={{ paddingBottom: 0 }}>Currency</List.Subheader>
      <SettingsEditField
        editable={true}
        errorText="Cannot be empty"
        required={true}
        title={context.householdData.currency}
        onSubmit={(text, callback) => changeCurrency(context.userData.householdID, text, (response) => {
          if ( response.success ) {
            typeof callback == 'function' && callback({ success: true })
          } else {
            typeof callback == 'function' && callback({ success: false, error: 'Currency could not be changed, please try again later.' })
          }
        })}
      />
      <Divider />
      <List.Subheader style={{ paddingBottom: 0 }}>Household</List.Subheader>
      <List.Item
        title="Invite to Household"
        style={{ height: 60, justifyContent: 'center' }}
        onPress={() => setShowInviteDialog(true)}
      />
      <List.Item
        title="Leave Household"
        style={{ height: 60, justifyContent: 'center' }}
        onPress={() => setShowLeaveDialog(true)}
      />
      <Divider />
      <List.Item
        title="Sign out"
        style={{ height: 60, justifyContent: 'center' }}
        onPress={signOut}
      />
      <Divider />
        <Portal>
        <Dialog
          visible={showInviteDialog}
          onDismiss={() => {
            setEmail('')
            setErrors({ ...errors, email: null })
            setIsSuccessful(false)
            setShowInviteDialog(false)
          }}
        >
          <Dialog.Title>Invite to household</Dialog.Title>
          <Dialog.Content>
            <Paragraph>Enter the Email of the person you want to invite to Household</Paragraph>
            <TextInput
              label="Email"
              mode="outlined"
              value={email}
              error={errors.email}
              onChangeText={setEmail}
              dense
            />
            { errors.email && (<ErrorText style={{ paddingHorizontal: 5, height: 12 }}>{errors.email}</ErrorText>) }
            { isSuccessful && (<SuccessText style={{ paddingHorizontal: 5, height: 12 }}>User added successfully to household</SuccessText>) }
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => {
              setEmail('')
              setErrors({ ...errors, email: null })
              setIsSuccessful(false)
              setShowInviteDialog(false)
            }}>Cancel</Button>
            <Button loading={isInviting} color={theme.colors.accent} onPress={() => {
              if ( ! isInviting ) {
                const emailTrimed = email.trim()
                setIsSuccessful(false)
                setErrors({ ...errors, email: null })
                if ( ! validator.isEmail(emailTrimed) ) {
                  setErrors({ ...errors, email: 'Email cannot be empty' })
                } else {
                  setIsInviting(true)
                  inviteToHousehold(context.userData.householdID, emailTrimed, (response) => {
                    if ( response.success ) {
                      setEmail('')
                      setIsSuccessful(true)
                    } else {
                      setErrors({ ...errors, email: response.error })
                    }
                    setIsInviting(false)
                  })
                }
              }
            }}>{ ! isInviting ? 'Invite' : null}</Button>
          </Dialog.Actions>
          </Dialog>
        <Dialog
          visible={showLeaveDialog}
          onDismiss={() => setShowLeaveDialog(false)}
        >
          <Dialog.Title>Leave Household</Dialog.Title>
          <Dialog.Content>
            <Paragraph>Are you sure you want to proceed? You can only rejoin the household again through an invite. </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowLeaveDialog(false)}>Cancel</Button>
            <Button loading={isLeaving} color={theme.colors.error} onPress={() => {
              if ( ! isLeaving ) {
                setIsLeaving(true)
                leaveHousehold(context.user.uid, context.userData.householdID, context.householdData.access, (response) => {
                  if ( response.success ) {
                    setIsLeaving(false)
                  }
                })
              }
            }}>{ ! isLeaving ? 'Leave' : null}</Button>
          </Dialog.Actions>
          </Dialog>
        </Portal>
    </View>
  )
}

export default withTheme(Settings)
