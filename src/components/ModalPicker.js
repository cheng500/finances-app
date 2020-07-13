/**
 * @flow
 */
'use strict'

import React from 'react'
import { FlatList, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'

import { Divider, IconButton, Modal, Portal, Text, withTheme } from 'react-native-paper'

import { map } from 'lodash'

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'


const styles = StyleSheet.create({
  style: {
    flex: 0.75,
    marginHorizontal: '6%',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  modalListStyle: {
    width: '100%',
    paddingVertical: 16,
    paddingLeft: 10,
  },
  gridTileStyle: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
  }
})

const ModalPicker = (props) => {
  const {
    style, theme, items, labelSelector, labelFormatter, title, type, gridPerRow = 4,
    gridTileStyle, onClose, onSelectItem, ...oriProps
  } = props

  return (
    <Portal>
      <Modal
        contentContainerStyle={[
          styles.style,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.roundness
          },
          style
        ]}
        onDismiss={onClose}
        {...oriProps}
      >
        <View style={[
          styles.modalListStyle,
          {
            paddingVertical: 8,
            flexDirection: 'row',
            justifyContent: 'space-between',
            borderBottomWidth: 1,
            borderColor: theme.colors.accent
          }
        ]}>
          <Text style={{ fontSize: 18, paddingVertical: 12 }}>{title}</Text>
          <IconButton
            icon="close"
            onPress={onClose}
          />
        </View>
        { type != 'grid'
          ? <FlatList
              data={items}
              ItemSeparatorComponent={() => <Divider />}
              keyExtractor={(item, index) => index.toString()}
              renderItem={(row) => {
                return (
                  <TouchableOpacity
                    style={styles.modalListStyle}
                    onPress={() => {
                      onSelectItem(row.item)
                      onClose()
                    } }
                  >
                    <Text>
                      { labelSelector
                        ? row.item[labelSelector]
                        : labelFormatter
                          ? typeof labelFormatter == 'function' && labelFormatter(row.item)
                          : row.index
                      }
                    </Text>
                  </TouchableOpacity>
                )
              }}
              style={{ width: '100%' }}
            >
           </FlatList>
          : <ScrollView style={{ width: '100%', height: '100%' }} contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              { map(items, (item, key) => {
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[ styles.gridTileStyle, { width: 100 / gridPerRow + '%', borderColor: theme.colors.border }, gridTileStyle ]}
                      onPress={() => {
                        onSelectItem(item)
                        onClose()
                      }}
                    >
                      <View style={{ width: '100%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <MaterialCommunityIcons name={item.icon} size={26 / gridPerRow * 4}/>
                        <Text>{item.name}</Text>
                      </View>
                    </TouchableOpacity>
                  )
                })
              }
            </ScrollView>
        }
      </Modal>
    </Portal>
  )
}

export default withTheme(ModalPicker)
