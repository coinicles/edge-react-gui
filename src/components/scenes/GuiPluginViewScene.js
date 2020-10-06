// @flow

import Bugsnag from '@bugsnag/react-native'
import * as React from 'react'
import { Platform } from 'react-native'
import { WebView } from 'react-native-webview'
import { connect } from 'react-redux'
import { Bridge, onMethod } from 'yaob'

import { EdgeProvider } from '../../modules/UI/scenes/Plugins/EdgeProvider.js'
import { type GuiPlugin, type GuiPluginQuery, makePluginUri } from '../../types/GuiPluginTypes.js'
import type { Dispatch, State as ReduxState } from '../../types/reduxTypes.js'
import { javascript } from '../../util/bridge/injectThisInWebView.js'
import { bestOfPlugins } from '../../util/ReferralHelpers.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { setPluginScene } from '../navigation/GuiPluginBackButton.js'
import { showError, showToast } from '../services/AirshipInstance.js'
import { requestPermission } from '../services/PermissionsManager.js'

// WebView bridge managemer --------------------------------------------

type WebViewCallbacks = {
  onMessage: Function,
  setRef: Function
}

/**
 * Sets up a YAOB bridge for use with a React Native WebView.
 * The returned callbacks should be passed to the `onMessage` and `ref`
 * properties of the WebView. Handles WebView reloads and related
 * race conditions.
 * @param {*} onRoot Called when the inner HTML sends a root object.
 * May be called multiple times if the inner HTML reloads.
 * @param {*} debug Set to true to enable logging.
 */
function makeOuterWebViewBridge<Root>(onRoot: (root: Root) => mixed, debug: boolean = false): WebViewCallbacks {
  let bridge: Bridge | void
  let gatedRoot: Root | void
  let webview: WebView | void

  // Gate the root object on the webview being ready:
  const tryReleasingRoot = () => {
    if (gatedRoot != null && webview != null) {
      onRoot(gatedRoot)
      gatedRoot = undefined
    }
  }

  // Feed incoming messages into the YAOB bridge (if any):
  const onMessage = event => {
    const message = JSON.parse(event.nativeEvent.data)
    if (debug) console.info('plugin →', message)

    // This was crashing us, so send to bugsnag:
    if (bridge != null && message.events != null && typeof message.events.find !== 'function') {
      Bugsnag.notify(new Error('Corrupted yaob events'), report => {
        report.metadata.rawData = event.nativeEvent.data
        report.metadata.eventType = typeof message.events
      })
    }

    // This is a terrible hack. We are using our inside knowledge
    // of YAOB's message format to determine when the client has restarted.
    if (bridge != null && Array.isArray(message.events) && message.events.find(event => event.localId === 0)) {
      bridge.close(new Error('plugin: The WebView has been unmounted.'))
      bridge = undefined
    }

    // If we have no bridge, start one:
    if (bridge == null) {
      let firstMessage = true
      bridge = new Bridge({
        sendMessage: message => {
          if (debug) console.info('plugin ←', message)
          if (webview == null) return

          const js = `if (window.bridge != null) {${
            firstMessage ? 'window.gotFirstMessage = true;' : 'window.gotFirstMessage && '
          } window.bridge.handleMessage(${JSON.stringify(message)})}`
          firstMessage = false
          webview.injectJavaScript(js)
        }
      })

      // Use our inside knowledge of YAOB to directly
      // subscribe to the root object appearing:
      onMethod.call(bridge._state, 'root', root => {
        gatedRoot = root
        tryReleasingRoot()
      })
    }

    // Finally, pass the message to the bridge:
    try {
      bridge.handleMessage(message)
    } catch (e) {
      console.warn('plugin bridge error: ' + String(e))
    }
  }

  // Listen for the webview component to mount:
  const setRef = element => {
    webview = element
    tryReleasingRoot()
  }

  return { onMessage, setRef }
}

// Plugin scene --------------------------------------------------------

type OwnProps = {
  // The GUI plugin we are showing the user:
  plugin: GuiPlugin,

  // Set these to add stuff to the plugin URI:
  deepPath?: string,
  deepQuery?: GuiPluginQuery
}

type DispatchProps = { dispatch: Dispatch }
type StateProps = { state: ReduxState }
type Props = OwnProps & DispatchProps & StateProps

type State = {
  webViewKey: number
}

type PluginWorkerApi = {
  setEdgeProvider(provider: EdgeProvider): Promise<mixed>
}

class GuiPluginView extends React.Component<Props, State> {
  _callbacks: WebViewCallbacks
  _canGoBack: boolean
  _edgeProvider: EdgeProvider
  _promoCode: string | void
  _promoMessage: string | void
  _webview: WebView | void

  constructor(props) {
    const { deepPath, deepQuery, dispatch, plugin, state } = props
    super(props)
    setPluginScene(this)

    // Mechanism to re-boot the webview:
    this.state = { webViewKey: 0 }
    const restartPlugin = () => {
      this.setState({ webViewKey: this.state.webViewKey + 1 })
    }

    // Set up the EdgeProvider:
    this.updatePromoCode(plugin, state)
    this._edgeProvider = new EdgeProvider(plugin, state, dispatch, restartPlugin, deepPath, deepQuery, this._promoCode)

    // Set up the WebView bridge:
    this._canGoBack = false
    this._callbacks = makeOuterWebViewBridge((root: PluginWorkerApi) => {
      root.setEdgeProvider(this._edgeProvider).catch(e => {
        console.warn('plugin setEdgeProvider error: ' + String(e))
      })
    }, true)

    // Capture the WebView ref:
    const { setRef } = this._callbacks
    this._callbacks.setRef = (element: WebView | void) => {
      if (element == null) this._canGoBack = false
      this._webview = element
      setRef(element)
    }
  }

  componentDidMount() {
    this.checkPermissions()
      .then(() => {
        const message = this._promoMessage
        if (message != null) showToast(message)
      })
      .catch(showError)
  }

  componentDidUpdate() {
    const { deepPath, deepQuery, plugin, state } = this.props
    this.updatePromoCode(plugin, state)
    this._edgeProvider._updateState(state, deepPath, deepQuery, this._promoCode)
  }

  updatePromoCode(plugin: GuiPlugin, state: ReduxState) {
    const accountPlugins = state.account.referralCache.accountPlugins
    const accountReferral = state.account.accountReferral
    const activePlugins = bestOfPlugins(accountPlugins, accountReferral, undefined)
    this._promoCode = activePlugins.promoCodes[plugin.pluginId]
    this._promoMessage = activePlugins.promoMessages[plugin.pluginId]
  }

  async checkPermissions() {
    const { plugin } = this.props
    const { permissions = [] } = plugin
    for (const name of permissions) await requestPermission(name)
  }

  goBack(): boolean {
    if (this._webview == null || !this._canGoBack) {
      return false
    }
    this._webview.goBack()
    return true
  }

  onLoadProgress = event => {
    console.log('Plugin navigation: ', event.nativeEvent)
    this._canGoBack = event.nativeEvent.canGoBack
  }

  onNavigationStateChange = event => {
    console.log('Plugin navigation: ', event)
    this._canGoBack = event.canGoBack
  }

  render() {
    const { plugin, deepPath, deepQuery } = this.props
    const { originWhitelist = ['file://*', 'https://*', 'http://*', 'edge://*'] } = plugin
    const uri = makePluginUri(plugin, {
      deepPath,
      deepQuery,
      promoCode: this._promoCode
    })

    const userAgent =
      Platform.OS === 'android'
        ? 'Mozilla/5.0 (Linux; U; Android 4.4.2; en-us; SCH-I535 Build/KOT49H) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30'
        : 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1'

    return (
      <SceneWrapper background="body" hasTabs={false}>
        <WebView
          allowFileAccess
          allowUniversalAccessFromFileURLs
          geolocationEnabled
          injectedJavaScript={javascript}
          javaScriptEnabled
          onLoadProgress={this.onLoadProgress}
          onNavigationStateChange={this.onNavigationStateChange}
          onMessage={this._callbacks.onMessage}
          originWhitelist={originWhitelist}
          key={`webView${this.state.webViewKey}`}
          ref={this._callbacks.setRef}
          setWebContentsDebuggingEnabled
          source={{ uri }}
          userAgent={userAgent + ' hasEdgeProvider edge/app.edge.'}
          useWebKit
        />
      </SceneWrapper>
    )
  }
}

// Connector -----------------------------------------------------------

export const GuiPluginViewScene = connect(
  (state: ReduxState): StateProps => ({ state }),
  (dispatch: Dispatch): DispatchProps => ({ dispatch })
)(GuiPluginView)
