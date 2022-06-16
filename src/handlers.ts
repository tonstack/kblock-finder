import { TimeOptions } from './utils'
import { Logger } from './logger'
import { ADNLDecoder, ADNLUtil } from './uadnl'

function handleUnknownRespCode (respCode: number): void {
    Logger.warn(`unknown resp code: "${respCode}"`)
}

function handleAnyError (msg: Buffer): void {
    const error = ADNLDecoder.decodeError(msg)
    Logger.error(JSON.stringify(error))
}

function handleCurrentTime (adnlUtil: ADNLUtil, msg: Buffer): void {
    const unix = ADNLDecoder.decodeCurrentTime(msg) * 1000

    const strTime = new Date(unix).toLocaleString('en-US', TimeOptions)
    const strunix = `(unix ts: ${(unix / 1000).toString()})`

    Logger.info(`liteserver time: ${strTime} ${strunix}`)

    adnlUtil.getMasterchainInfo()
}

function handleMasterchainInfo (adnlUtil: ADNLUtil, msg: Buffer): void {
    const masterInfo = ADNLDecoder.decodeMasterchainInfo(msg)
    const { last } = masterInfo

    Logger.info(`current masterchain seqno: ${last.seqno}`)

    adnlUtil.getBlockHeader(
        last.workchain,
        last.shard,
        last.seqno,
        last.rootHash,
        last.fileHash
    )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handleBlockHeader (adnlUtil: ADNLUtil, msg: Buffer): void {
    Logger.info('function: handleBlockHeader')
    // TODO: implement
}

export {
    handleUnknownRespCode,
    handleAnyError,
    handleCurrentTime,
    handleMasterchainInfo,
    handleBlockHeader
}
