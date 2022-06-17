/*
    kblock-finder – cli tool helps to get the last
                    key block in the TON Blockchain

    Copyright (C) 2022 TonStack

    This file is part of kblock-finder.

    kblock-finder is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    kblock-finder is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with kblock-finder.  If not, see <https://www.gnu.org/licenses/>.
*/

import path from 'path'
import { ADNLClient } from 'adnl'
import { Command } from 'commander'

import { ipIntegerToString, loadLiteServersConfig } from './utils'
import { ADNLUtil, ADNLDecoder } from './uadnl'
import { Logger } from './logger'
import {
    handleAnyError,
    handleBlockHeader,
    handleCurrentTime,
    handleMasterchainInfo,
    handleUnknownRespCode,
    handleBlockData
} from './handlers'

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
        .on('connect', () => Logger.ok('connection successful\n'))
        .on('close', () => Logger.info('connection closed\n'))
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
                    handleCurrentTime(adnlUtil, answer)
                    break

                case ADNLDecoder.RESP_CODE.anyError:
                    handleAnyError(answer)
                    break

                case ADNLDecoder.RESP_CODE.masterchainInfo:
                    handleMasterchainInfo(adnlUtil, answer)
                    break

                case ADNLDecoder.RESP_CODE.blockHeader:
                    handleBlockHeader(adnlUtil, answer)
                    break

                case ADNLDecoder.RESP_CODE.blockData:
                    handleBlockData(answer)
                    break

                default:
                    handleUnknownRespCode(respCode)
                    break
            }
        })

    adnlClient.connect()
    adnlUtil.setClient(adnlClient)
}

if (require.main === module) { main() }
