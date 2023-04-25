import { Theme } from 'vitepress'
import { Component, computed, inject, InjectionKey, reactive } from 'vue'
import { MaybeComputedRef, resolveRef, useLocalStorage } from '@vueuse/core'
import ElScrollbar from 'el-scrollbar'
import VPDoc from '@theme-default/components/VPDoc.vue'
import Badge from './components/badge.vue'
import ChatMessage from './components/chat-message.vue'
import PanelView from './components/chat-panel.vue'
import TabSelect from './components/tab-select.vue'
import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'

import './styles/aside.scss'
import './styles/code.scss'
import './styles/doc.scss'
import './styles/vars.scss'

export const ThemeConfig: InjectionKey<ThemeConfig> = Symbol.for('theme-config')
export const ClientConfig: InjectionKey<ClientConfig> = Symbol.for('client-config')

export function useActiveTab(keys: MaybeComputedRef<string[]>) {
  const config = inject(ClientConfig)
  const _keys = resolveRef(keys)
  return computed({
    get: () => config.tabs.find(name => _keys.value.includes(name)) || _keys.value[0],
    set: (value) => {
      const index = config.tabs.indexOf(value)
      if (index >= 0) config.tabs.splice(index, 1)
      config.tabs.unshift(value)
    },
  })
}

export interface ThemeConfig {
  Layout?: Component
  NotFount?: Component
  layouts?: Record<string, Component>
  enhanceApp?: Function
}

export interface ClientConfig {
  version?: number
  tabs?: string[]
}

const version = 1

function createStorage(initial: ClientConfig) {
  const storage = useLocalStorage('koishi.docs.config', {} as ClientConfig)
  if (storage.value.version !== version) {
    storage.value = { ...initial, version }
  } else {
    storage.value = { ...initial, ...storage.value }
  }
  return reactive(storage.value)
}

export { Layout }

export const defineTheme = (config: ThemeConfig = {}): Theme => ({
  ...DefaultTheme,
  Layout,
  ...config,
  enhanceApp(ctx) {
    ctx.app.component('ElScrollbar', ElScrollbar)
    ctx.app.component('Badge', Badge)
    ctx.app.component('ChatMessage', ChatMessage)
    ctx.app.component('ChatPanel', PanelView)
    ctx.app.component('TabSelect', TabSelect)

    const layouts = { default: VPDoc }
    for (const key in config.layouts) {
      layouts[key.toLowerCase()] = config.layouts[key]
    }

    ctx.app.provide(ThemeConfig, { layouts })
    ctx.app.provide(ClientConfig, createStorage({
      tabs: [],
    }))

    config.enhanceApp?.(ctx)
  },
})
