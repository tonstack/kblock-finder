import { BOC, Slice } from 'ton3'
import { printBlock, TimeOptions } from './utils'
import { Logger } from './logger'
import { ADNLDecoder, ADNLUtil } from './uadnl'
import { adnl_message_answer, tonNode_blockIdExt } from './auto/schema-tl'

let lastMasterChainBlock: tonNode_blockIdExt | undefined

type MaybeBuffer = Buffer | undefined

const queryState: {
    masterchainBlockHeader: MaybeBuffer
    keyBlockHeader: MaybeBuffer
} = {
    masterchainBlockHeader: undefined,
    keyBlockHeader: undefined
}

function handleUnknownRespCode (respCode: number): void {
    Logger.warn(`unknown resp code: "${respCode}"`)
}

function handleAnyError (msg: adnl_message_answer): void {
    const error = ADNLDecoder.decodeError(msg.answer)
    Logger.error(JSON.stringify(error))
}

function handleCurrentTime (adnlUtil: ADNLUtil, msg: adnl_message_answer): void {
    const unix = ADNLDecoder.decodeCurrentTime(msg.answer) * 1000

    const strTime = new Date(unix).toLocaleString('en-US', TimeOptions)
    const strunix = `(unix ts: ${(unix / 1000).toString()})`

    Logger.info(`liteserver time: ${strTime} ${strunix}`)

    adnlUtil.getMasterchainInfo()
}

function handleMasterchainInfo (adnlUtil: ADNLUtil, msg: adnl_message_answer): void {
    const masterInfo = ADNLDecoder.decodeMasterchainInfo(msg.answer)
    lastMasterChainBlock = masterInfo.last

    Logger.info(`current masterchain seqno: ${lastMasterChainBlock.seqno}`)

    queryState.masterchainBlockHeader = adnlUtil.getBlockHeader(lastMasterChainBlock)
}

function handleMasterchaBlockHeader (adnlUtil: ADNLUtil, msg: adnl_message_answer): void {
    const decoded = ADNLDecoder.decodeBlockHeader(msg.answer)

    // block_proof#c3 proof_for:BlockIdExt
    //  root:^Cell signatures:(Maybe ^BlockSignatures) = BlockProof;

    const blockProofCell = BOC.fromStandard(decoded.headerProof)
    const blockProofSlice = Slice.parse(blockProofCell)
    const blockRecordSlice = Slice.parse(blockProofSlice.loadRef()) // load root:^Cell

    /*
        crypto/block/block-auto.h

        Ref<Cell> info;         // info : ^BlockInfo
        Ref<Cell> value_flow;   // value_flow : ^ValueFlow
        Ref<Cell> state_update; // state_update : ^(MERKLE_UPDATE ShardState)
        Ref<Cell> extra;
    */

    // -- BlockInfo                    |  load Ref<Cell> info   |
    const BlockInfoSlice = Slice.parse(blockRecordSlice.loadRef())

    BlockInfoSlice.skip(
        32      // block_info#9bc7a987
        + 32    // version:uint32
        + 1     // not_master:(## 1)
        + 1     // after_merge:(## 1)
        + 1     // before_split:(## 1)
        + 1     // after_split:(## 1)
        + 1     // want_split:Bool
        + 1     // want_merge:Bool
    )

    const keyBlockBool = Boolean(BlockInfoSlice.loadBit()).valueOf()
    if (keyBlockBool) {
        Logger.info('last key block is current block:')

        printBlock(lastMasterChainBlock)
        adnlUtil.client.end()

        return
    }

    BlockInfoSlice.skip(
        1       // vert_seqno_incr:(## 1)
        + 8     // flags:(## 8)
        + 32    // seq_no:#
        + 32    // vert_seq_no:#

        // ShardIdent
        + 2     // shard_ident$00
        + 6     // shard_pfx_bits:(#<= 60) (Math.ceil(Math.log2(60 + 1)) === 6)
        + 32    // workchain_id:int32
        + 64    // shard_prefix:uint64
        // ;

        + 32    // gen_utime:uint32
        + 64    // start_lt:uint64
        + 64    // end_lt:uint64
        + 32    // gen_validator_list_hash_short:uint32
        + 32    // gen_catchain_seqno:uint32
        + 32    // min_ref_mc_seqno:uint32
    )

    //    prev_key_block_seqno:uint32
    const prevKeyBlockSeqno = BlockInfoSlice.loadUint(32)
    Logger.info(`prev_key_block_seqno: ${prevKeyBlockSeqno}`)

    queryState.keyBlockHeader = adnlUtil.lookupBlock({
        kind: 'tonNode.blockId',
        workchain: lastMasterChainBlock.workchain,
        shard: lastMasterChainBlock.shard,
        seqno: prevKeyBlockSeqno
    })
}

function handleKeyBlockHeader (adnlUtil: ADNLUtil, msg: adnl_message_answer): void {
    const decoded = ADNLDecoder.decodeBlockHeader(msg.answer)

    Logger.ok('last key block found:')
    printBlock(decoded.id)

    adnlUtil.client.end()
}

function handleBlockHeader (adnlUtil: ADNLUtil, msg: adnl_message_answer): void {
    /*
        0 if buf1 and buf2 are equal
        1 if buf1 < buf2
        -1 if buf1 > buf2
    */

    const id = msg.queryId

    if (
        queryState.masterchainBlockHeader
        && Buffer.compare(id, queryState.masterchainBlockHeader) === 0
    ) {
        handleMasterchaBlockHeader(adnlUtil, msg)
    } else if (
        queryState.keyBlockHeader
        && Buffer.compare(id, queryState.keyBlockHeader) === 0
    ) {
        handleKeyBlockHeader(adnlUtil, msg)
    } else {
        Logger.warn('unexpected handleBlockHeader queryId')
    }
}

function handleBlockData (msg: adnl_message_answer): void {
    const blockData = ADNLDecoder.decodeBlockData(msg.answer)
    console.log(blockData)
}

export {
    handleUnknownRespCode,
    handleAnyError,
    handleCurrentTime,
    handleMasterchainInfo,
    handleBlockHeader,
    handleBlockData
}
