declare module '*.frag'
declare module '*.vert'

declare let worker: Worker | wx.Worker
declare const PROJECT_NAME: string
declare const PROD: string
declare const VERSION: string


interface Window {
    font: string
    uiFont: string
    interaction: Promise<wx.IRect>
}
