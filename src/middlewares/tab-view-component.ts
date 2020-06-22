/*
  * Copyright 2020 ZUP IT SERVICOS EM TECNOLOGIA E INOVACAO SA
  *
  * Licensed under the Apache License, Version 2.0 (the "License");
  * you may not use this file except in compliance with the License.
  * You may obtain a copy of the License at
  *
  *  http://www.apache.org/licenses/LICENSE-2.0
  *
  * Unless required by applicable law or agreed to in writing, software
  * distributed under the License is distributed on an "AS IS" BASIS,
  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  * See the License for the specific language governing permissions and
  * limitations under the License.
*/

import { BeagleUIElement } from '../types'
import beagleConvertToChildrenMiddleware from './beagle-convert-to-children'

interface TabItem extends BeagleUIElement {
    title?: string,
    icon?: string,
    child: BeagleUIElement,
}

const beagleTabViewMiddleware = (uiTree: BeagleUIElement<any>) => {
    const toLowerCaseName = uiTree._beagleComponent_.toString().toLowerCase()
    if (toLowerCaseName === 'beagle:tabview' && uiTree.children) {
        const tabItens = uiTree.children as TabItem[]
        const parsedItems = tabItens.map((tab: TabItem) => {
            tab._beagleComponent_ = 'beagle:tabitem'
            if (tab.child)
                tab.children = [tab.child]
            tab.children && tab.children.forEach(beagleConvertToChildrenMiddleware)

            delete tab.child
            return tab
        })
        uiTree.children = parsedItems
        delete uiTree.tabItems
    }
    
    if (uiTree.children) uiTree.children.forEach(beagleTabViewMiddleware)

    return uiTree
}

export default beagleTabViewMiddleware