// @flow

import * as React from 'react'
import { Platform, StyleSheet, Text } from 'react-native'

import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'

type OwnProps = {
  children: React.Node,
  ellipsizeMode?: string,
  numberOfLines?: number,
  style?: StyleSheet.Styles
}

class EdgeTextComponent extends React.PureComponent<OwnProps & ThemeProps> {
  render() {
    const { children, style, theme, ...props } = this.props
    const { text } = getStyles(theme)
    return Platform.OS === 'ios' ? (
      <Text style={[text, style]} numberOfLines={this.props.numberOfLines || 1} adjustsFontSizeToFit {...props}>
        {children}
      </Text>
    ) : (
      <Text style={[text, style]} numberOfLines={this.props.numberOfLines || 1} ellipsizeMode={this.props.ellipsizeMode || 'middle'} {...props}>
        {children}
      </Text>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  text: {
    color: theme.primaryText,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1)
  }
}))

export const EdgeText = withTheme(EdgeTextComponent)
