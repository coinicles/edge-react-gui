// @flow

import type { EdgeCurrencyInfo, EdgeDenomination } from 'edge-core-js'

import { type CurrencySetting } from '../../reducers/scenes/SettingsReducer.js'
import type { State } from '../../types/reduxTypes.js'
import isoFiatDenominations from './ISOFiatDenominations'

const emptyEdgeDenomination: EdgeDenomination = {
  name: '',
  multiplier: '1',
  symbol: ''
}

export const getSettings = (state: State) => {
  const settings = state.ui.settings
  return settings
}

export const getIsTouchIdSupported = (state: State) => {
  const settings = getSettings(state)
  return settings.isTouchSupported
}
export const getIsTouchIdEnabled = (state: State) => {
  const settings = getSettings(state)
  return settings.isTouchEnabled
}

export const getLoginStatus = (state: State): boolean | null => {
  const settings = getSettings(state)
  const loginStatus = settings.loginStatus
  return loginStatus
}

export const getCurrencySettings = (state: State, currencyCode: string): CurrencySetting => {
  const settings = getSettings(state)
  const currencySettings = settings[currencyCode] || isoFiatDenominations[currencyCode]
  return currencySettings
}

export const getCryptocurrencySettings = (state: State, currencyCode: string) => {
  const settings = getSettings(state)
  const currencySettings = settings[currencyCode]
  return currencySettings
}

export const getDenominations = (state: State, currencyCode: string): EdgeDenomination[] => {
  const currencySettings = getCurrencySettings(state, currencyCode)
  if (currencySettings == null || currencySettings.denominations == null) return [emptyEdgeDenomination]
  const denominations = currencySettings.denominations
  return denominations
}

export const getDisplayDenominationKey = (state: State, currencyCode: string) => {
  const settings = getSettings(state)
  const currencySettings = settings[currencyCode]
  const selectedDenominationKey = currencySettings.denomination
  return selectedDenominationKey
}

export const getDisplayDenominationFromSettings = (settings: any, currencyCode: string): EdgeDenomination => {
  const currencySettings = settings[currencyCode] || isoFiatDenominations[currencyCode]
  const selectedDenominationKey = currencySettings.denomination
  const denominations = currencySettings.denominations
  let selectedDenomination: EdgeDenomination = emptyEdgeDenomination
  for (const d of denominations) {
    if (d.multiplier === selectedDenominationKey) {
      selectedDenomination = d
    }
  }
  return selectedDenomination
}

export const getDisplayDenominationFull = (state: State, currencyCode: string): EdgeDenomination => {
  const settings = state.ui.settings
  const currencySettings = settings[currencyCode]
  const selectedDenominationKey = currencySettings.denomination
  const denominations = currencySettings.denominations
  let selectedDenomination: EdgeDenomination = emptyEdgeDenomination
  for (const d of denominations) {
    if (d.multiplier === selectedDenominationKey) {
      selectedDenomination = d
    }
  }
  return selectedDenomination
}

export const getDisplayDenomination = (state: State, currencyCode: string): EdgeDenomination => {
  const selectedDenominationKey = getDisplayDenominationKey(state, currencyCode)
  const denominations = getDenominations(state, currencyCode)
  let selectedDenomination: EdgeDenomination = emptyEdgeDenomination
  for (const d of denominations) {
    if (d.multiplier === selectedDenominationKey) {
      selectedDenomination = d
    }
  }
  return selectedDenomination
}

export const getExchangeDenomination = (state: State, currencyCode: string) => {
  const denominations = getDenominations(state, currencyCode)
  let exchangeDenomination: EdgeDenomination = emptyEdgeDenomination
  for (const d of denominations) {
    if (d.name === currencyCode) {
      exchangeDenomination = d
    }
  }
  return exchangeDenomination
}

export const getCustomTokens = (state: State) => {
  const settings = getSettings(state)
  return settings.customTokens
}

export const getPlugins = (state: State) => {
  const settings = getSettings(state)
  const plugins = settings.plugins
  return plugins
}

export const getPluginInfo = (state: State, type: string): EdgeCurrencyInfo => {
  const plugins = getPlugins(state)
  const currencyInfo: EdgeCurrencyInfo = plugins[type.toLowerCase()]
  return currencyInfo
}

export const getSettingsLock = (state: State) => {
  const settings = getSettings(state)
  return settings.changesLocked
}
export const getAutoLogoutTimeInSeconds = (state: State): number => {
  const settings = getSettings(state)
  return settings.autoLogoutTimeInSeconds
}

export const getDefaultFiat = (state: State) => {
  const settings = getSettings(state)
  const defaultIsoFiat: string = settings.defaultIsoFiat
  const defaultFiat = defaultIsoFiat.replace('iso:', '')
  return defaultFiat
}

export const getDefaultIsoFiat = (state: State) => {
  const settings = getSettings(state)
  const defaultIsoFiat: string = settings.defaultIsoFiat
  return defaultIsoFiat
}

export const getConfirmPasswordErrorMessage = (state: State) => {
  const settings = getSettings(state)
  return settings.confirmPasswordError
}

export const getPinLoginEnabled = (state: State) => {
  const settings = getSettings(state)
  const pinLoginEnabled = settings.pinLoginEnabled
  return pinLoginEnabled
}

export const getIsAccountBalanceVisible = (state: State) => {
  const settings = getSettings(state)
  return settings.isAccountBalanceVisible
}
