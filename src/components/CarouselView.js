/**
 * @flow
 */
'use strict'

import React from 'react'
import { Dimensions, FlatList, StyleSheet, View } from 'react-native'

import { TouchableRipple, Text, withTheme } from 'react-native-paper'

import { map } from 'lodash'


const styles = StyleSheet.create({
  style: {
    flex: 1
  },
  tabsRowStyle: {
    flexDirection: 'row',
    height: 45
  },
  tabsButtonStyle: {
    flex: 1,
  }
})

const CarouselView = (props) => {
  const { items, style, tabsRowStyle, tabsButtonStyle, scrollViewStyle, theme, ...oriProps } = props
  const scrollView = React.useRef(null)
  const [selectedTab, setSelectedTab] = React.useState(0)
  const [width, setWidth] = React.useState(Dimensions.get('window').width)

  const navigateToTab = (index) => {
    scrollView.current && scrollView.current.scrollToOffset({ offset: width * index, animated: true })
  }

  return (
    <View style={[styles.style, style]}>
      <View style={[styles.tabsRowStyle, { backgroundColor: theme.colors.surface }, tabsRowStyle]}>
        { map(items, (item, key) => {
          return (
            <View key={key} style={styles.tabsButtonStyle}>
              <TouchableRipple
                style={tabsButtonStyle}
                onPress={() => navigateToTab(key)}
              >
                <Text style={{
                  paddingTop: 12,
                  height: 45,
                  fontSize: 16,
                  borderBottomWidth: selectedTab == key ? 2 : 1,
                  borderColor: selectedTab == key ? theme.colors.primary: theme.colors.border,
                  color: selectedTab == key ? theme.colors.primary : theme.colors.notification,
                  textAlign: 'center'
                }}>{item.label}</Text>
              </TouchableRipple>
            </View>
          )
        }) }
      </View>
      <View style={scrollViewStyle}>
        <FlatList
          ref={scrollView}
          data={items}
          renderItem={(row) => React.cloneElement(row.item.element, { key: row.index, navigateToTab, style: { width: width - 20, marginHorizontal: 10 } })}
          keyExtractor={(row, index) => index.toString()}
          horizontal={true}
          getItemLayout={(data, index) => ({ length: items.length, offset: width * index, index })}
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          onScroll={(event) => setSelectedTab(Number((event.nativeEvent.contentOffset.x / width).toFixed(0)))}
          scrollEventThrottle={200}
          pagingEnabled
          {...oriProps}
        />
      </View>
    </View>
  )
}

export default withTheme(CarouselView)
