// @flow

import * as React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { connect } from 'react-redux'

import s from '../../locales/strings.js'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { type State } from '../../types/reduxTypes.js'
import { scale } from '../../util/scaling.js'
import { getFiatSymbol } from '../../util/utils.js'

type BalanceBoxState = {}

type BalanceBoxProps = {
  showBalance: boolean,
  fiatAmount: number,
  isoFiatCurrencyCode: string,
  onPress: Function,
  exchangeRates?: { [string]: number }
}

type WiredBalanceBoxOwnProps = {
  showBalance: boolean | Function,
  fiatAmount: number | Function,
  isoFiatCurrencyCode: string | Function,
  onPress: Function,
  exchangeRates?: { [string]: number }
}

class BalanceBox extends React.PureComponent<BalanceBoxProps, BalanceBoxState> {
  render() {
    const { isoFiatCurrencyCode, fiatAmount, showBalance, exchangeRates } = this.props
    const fiatSymbol = isoFiatCurrencyCode ? getFiatSymbol(isoFiatCurrencyCode) : ''
    const fiatCurrencyCode = isoFiatCurrencyCode.replace('iso:', '')
    let fiatBalanceString = ''
    if (fiatSymbol.length !== 1) {
      fiatBalanceString = fiatAmount + ' ' + fiatCurrencyCode
    } else {
      fiatBalanceString = fiatSymbol + ' ' + fiatAmount + ' ' + fiatCurrencyCode
    }

    let displayedBox
    const summation = (total: number, rate: number) => {
      if (isNaN(rate)) rate = 0
      return total + rate
    }
    if (showBalance) {
      // if there is no exchangeRates object, empty object, or object with zero values
      // $FlowFixMe it appears that Object.values may break flow
      if (!exchangeRates || !Object.keys(exchangeRates).length || !Object.values(exchangeRates).reduce(summation)) {
        displayedBox = this.noBalanceBox('noExchangeRates')
      } else {
        displayedBox = this.balanceBox(fiatBalanceString)
      }
    } else {
      displayedBox = this.noBalanceBox('balanceHidden')
    }

    return <TouchableOpacity onPress={this.props.onPress}>{displayedBox}</TouchableOpacity>
  }

  balanceBox(fiatBalanceString: string) {
    return (
      <View style={styles.totalBalanceBox}>
        <View style={styles.totalBalanceWrap}>
          <View style={styles.totalBalanceHeader}>
            <T style={styles.totalBalanceText}>{s.strings.fragment_wallets_balance_text}</T>
          </View>
          <View style={styles.currentBalanceBoxDollarsWrap}>
            <T style={styles.currentBalanceBoxDollars}>{fiatBalanceString}</T>
          </View>
        </View>
      </View>
    )
  }

  noBalanceBox(textType: string) {
    let displayedText
    if (textType === 'noExchangeRates') {
      displayedText = s.strings.exchange_rates_loading
    } else {
      displayedText = s.strings.string_show_balance
    }

    return (
      <View style={styles.totalBalanceBox}>
        <View style={styles.totalBalanceWrap}>
          <View style={styles.hiddenBalanceBoxDollarsWrap}>
            <T numberOfLines={2} style={textType === 'noExchangeRates' ? styles.currentBalanceBoxNoExchangeRates : styles.currentBalanceBoxDollars}>
              {displayedText}
            </T>
          </View>
        </View>
      </View>
    )
  }
}

export const WiredBalanceBox = connect((state: State, ownProps: WiredBalanceBoxOwnProps): BalanceBoxProps => {
  const isoFiatCurrencyCode = typeof ownProps.isoFiatCurrencyCode === 'function' ? ownProps.isoFiatCurrencyCode(state) : ownProps.isoFiatCurrencyCode
  return {
    showBalance: typeof ownProps.showBalance === 'function' ? ownProps.showBalance(state) : ownProps.showBalance,
    fiatAmount: typeof ownProps.fiatAmount === 'function' ? ownProps.fiatAmount(state, isoFiatCurrencyCode) : ownProps.fiatAmount,
    onPress: ownProps.onPress,
    isoFiatCurrencyCode,
    exchangeRates: ownProps.exchangeRates
  }
}, null)(BalanceBox)

const rawStyles = {
  totalBalanceBox: {
    height: scale(111),
    justifyContent: 'center'
  },
  totalBalanceWrap: {
    flex: 3,
    alignItems: 'center',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  totalBalanceHeader: {
    flex: 2,
    justifyContent: 'flex-end',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  totalBalanceText: {
    fontSize: scale(18),
    color: THEME.COLORS.PRIMARY
  },
  currentBalanceBoxDollarsWrap: {
    flex: 3,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  hiddenBalanceBoxDollarsWrap: {
    flex: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  currentBalanceBoxDollars: {
    color: THEME.COLORS.PRIMARY,
    fontSize: scale(44)
  },
  currentBalanceBoxNoExchangeRates: {
    color: THEME.COLORS.PRIMARY,
    fontSize: scale(26),
    textAlign: 'center'
  }
}
export const styles: typeof rawStyles = StyleSheet.create(rawStyles)
