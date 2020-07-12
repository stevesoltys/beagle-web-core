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

import { removeSuffix } from './utils/string'

function createURLBuilder() {
  let baseUrl: string | undefined

  return {
    setBaseUrl: (url: string) => baseUrl = url,
    build: (path: string) => {
      if (typeof baseUrl === 'undefined') {
        throw new Error('The URLBuilder has not been initialized yet.')
      }
      // According to the convention the relative path should start with '/'
      const relativePathRegex = /^\/+(\b|$)/
      const base = removeSuffix(baseUrl, '/')
      const url = path.match(relativePathRegex) ? `${base}${path}` : path
      return encodeURI(url)
    },
  }
}

const urlBuilder = createURLBuilder()

export default urlBuilder