import path from 'path'
import { ADNLClient } from 'adnl'
import { Command } from 'commander'

import { ipIntegerToString, loadLiteServersConfig } from './utils'
import { handleAnyError, handleBlockHeader, handleCurrentTime, handleMasterchainInfo, handleUnknownRespCode } from './handlers'
import { ADNLUtil, ADNLDecoder } from './uadnl'
import { Logger } from './logger'

const adnlUtil = new ADNLUtil()

const pargs: { config: string } = new Command()
    .name('kblock-finder')
    .description('helps to get the last key block in the TON Blockchain')
    .requiredOption('-C, --config <string>', 'path to blockchain net config')
    .parse(process.argv)
    .opts()

function main () {
    Logger.info(`loading "${path.basename(pargs.config)}"`)

    const servers = loadLiteServersConfig(pargs.config)
    Logger.info(`total liteservers count: ${servers.length}`)

    const host = servers[Math.floor(Math.random() * servers.length)]
    const stringIP = ipIntegerToString(host.ip)

    Logger.info(`random server: ${stringIP}:${host.port} "${host.id.key}"`)

    const adnlClient = new ADNLClient(stringIP, host.port, host.id.key)
        .on('connect', () => Logger.ok('connection successful'))
        .on('close', () => Logger.info('connection closed'))
        .on('error', (error: Error) => Logger.error(`connection error: ${error}`))
        .on('ready', () => {
            adnlUtil.timePing()
        })
        .on('data', (data: Buffer) => {
            const answer = ADNLDecoder.decodeAdnlMessage(data)
            if (answer.kind !== 'adnl.message.answer') {
                Logger.error(`answer.kind !== "adnl.message.answer" ("${answer.kind}")`)
                adnlClient.end()
                return
            }

            const respCode = answer.answer.readInt32LE(0)

            switch (respCode) {
                case ADNLDecoder.RESP_CODE.currentTime:
                    handleCurrentTime(adnlUtil, answer.answer)
                    break

                case ADNLDecoder.RESP_CODE.anyError:
                    handleAnyError(answer.answer)
                    break

                case ADNLDecoder.RESP_CODE.masterchainInfo:
                    handleMasterchainInfo(adnlUtil, answer.answer)
                    break

                case ADNLDecoder.RESP_CODE.blockHeader:
                    handleBlockHeader(adnlUtil, answer.answer)
                    break

                default:
                    handleUnknownRespCode(respCode)
                    break
            }
        })

    adnlClient.connect()
    adnlUtil.setClient(adnlClient)
}

if (require.main === module) { main(); console.log() }
