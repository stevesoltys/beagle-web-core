/**
 * @jest-environment jsdom
 */

/*
 * Copyright 2020 ZUP IT SERVICOS EM TECNOLOGIA E INOVACAO SA
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { AnalyticsConfig, BeagleAction, IdentifiableBeagleUIElement, Route } from 'index'
import formatActionRecord from 'service/analytics/actions'
import * as htmlHelpers from 'utils/html'



describe('Actions Analytics Service', () => {

  let analyticsConfigMock: AnalyticsConfig
  let beagleActionMock: BeagleAction
  let componentMock: IdentifiableBeagleUIElement
  let routeMock: Route
  const expectedBase = {
    type: 'action',
    platform: 'WEB Jest',
    event: 'OnPress',
    component: {
      type: 'beagle:button',
      id: 'beagle_mock',
      position: { x: 10, y: 10 },
      xPath: 'BODY/ROOT/DIV[3]/DIV/BUTTON'
    },
    beagleAction: 'beagle:pushView',
    url: "text.action.payload",
  }

  beforeEach(() => {
    //@ts-ignore
    htmlHelpers.getElementPosition = jest.fn().mockReturnValue({ x: 10, y: 10 })
    //@ts-ignore
    htmlHelpers.getElementByBeagleId = jest.fn().mockReturnValue('<div>button</div>')
    //@ts-ignore
    htmlHelpers.getPath = jest.fn().mockReturnValue('BODY/ROOT/DIV[3]/DIV/BUTTON')
  })

  it('should format the Action', () => {

    const eventName = 'OnPress'
    analyticsConfigMock = {
      enableScreenAnalytics: true,
      actions: { 'beagle:pushView': [] }
    }
    beagleActionMock = {
      _beagleAction_: 'beagle:pushView',
      route: { screen: { id: 'screenMock' } }
    }
    componentMock = {
      _beagleComponent_: 'beagle:button',
      id: 'beagle_mock',
      onPress: beagleActionMock
    }
    routeMock = {
      url: 'text.action.payload'
    }

    const expected = {...expectedBase}

    const result = formatActionRecord(beagleActionMock, eventName, analyticsConfigMock, componentMock, 'Jest', routeMock)

    expect(result).toEqual(expected)
  })

  it('should format the Action adding additional attributes from CONFIG', () => {

    const expected = {...expectedBase, 'route.screen': { id: 'screenMock' }}

    const eventName = 'OnPress'
    analyticsConfigMock = {
      enableScreenAnalytics: true,
      actions: { 'beagle:pushView': ['route.screen'] }
    }
    beagleActionMock = {
      _beagleAction_: 'beagle:pushView',
      route: { screen: { id: 'screenMock' } }
    }
    componentMock = {
      _beagleComponent_: 'beagle:button',
      id: 'beagle_mock',
      onPress: beagleActionMock
    }
    routeMock = {
      url: 'text.action.payload'
    }


    const result = formatActionRecord(beagleActionMock, eventName, analyticsConfigMock, componentMock, 'Jest', routeMock)

    expect(result).toEqual(expected)
  })

  it('should format the Action adding additional attributes from ACTION', () => {

    const expected = {...expectedBase, test: 'additionalEntries', 'route.screen': { id: 'screenMock' }}

    const eventName = 'OnPress'
    analyticsConfigMock = {
      enableScreenAnalytics: true,
      actions: { 'beagle:pushView': [] }
    }
    beagleActionMock = {
      _beagleAction_: 'beagle:pushView',
      route: { screen: { id: 'screenMock' } },
      analytics:{
        additionalEntries: {test:'additionalEntries'},
        attributes: ['route.screen']
      }
    }
    componentMock = {
      _beagleComponent_: 'beagle:button',
      id: 'beagle_mock',
      onPress: beagleActionMock
    }
    routeMock = {
      url: 'text.action.payload'
    }


    const result = formatActionRecord(beagleActionMock, eventName, analyticsConfigMock, componentMock, 'Jest', routeMock)

    expect(result).toEqual(expected)
  })
})