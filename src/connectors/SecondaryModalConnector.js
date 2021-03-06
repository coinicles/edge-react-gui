// @flow

import { connect } from 'react-redux'

import { SecondaryModal } from '../components/modals/SecondaryModal.js'
import type { Dispatch, State } from '../types/reduxTypes.js'

export const mapStateToProps = (state: State) => ({
  error: state.ui.scenes.scan.privateKeyModal.error,
  isSweeping: state.ui.scenes.scan.privateKeyModal.isSweeping,
  isActive: state.ui.scenes.scan.privateKeyModal.secondaryModal.isActive
})
export const mapDispatchToProps = (dispatch: Dispatch) => ({
  onBackButtonPress: () => {
    dispatch({ type: 'PRIVATE_KEY_MODAL/SECONDARY_MODAL/DEACTIVATED' })
  },
  onBackdropPress: () => {
    dispatch({ type: 'PRIVATE_KEY_MODAL/SECONDARY_MODAL/DEACTIVATED' })
  }
})

export const SecondaryModalConnector = connect(mapStateToProps, mapDispatchToProps)(SecondaryModal)
export default SecondaryModalConnector
