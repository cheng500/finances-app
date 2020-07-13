/**
 * @flow
 */
'use strict'

import React from 'react'

export const AuthContext = React.createContext({
  user: null,
  userData: null,
  householdData: null
})
