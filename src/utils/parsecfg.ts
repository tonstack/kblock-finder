import * as fs from 'fs'

interface ILiteServer {
    ip: number,
    port: number,
    id: { '@type': string, key: string }
}

const TimeOptions: Intl.DateTimeFormatOptions = {
    hour12: true,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',

    year: '2-digit',
    month: '2-digit',
    day: '2-digit'
}

function loadLiteServersConfig (configFileName: string): ILiteServer[] {
    const configString = fs.readFileSync(configFileName, 'utf8')
    const config: { liteservers: ILiteServer[] } = JSON.parse(configString)

    return config.liteservers
}

export { loadLiteServersConfig, TimeOptions, ILiteServer }
