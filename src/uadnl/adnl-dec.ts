import { TLReadBuffer } from 'ton-tl'
import { adnl_Message, Codecs, Functions, liteServer_BlockData, liteServer_blockHeader, liteServer_error, liteServer_masterchainInfo } from '../auto/schema-tl'

class ADNLDecoder {
    public static RESP_CODE = {
        currentTime: -380436467,
        masterchainInfo: -2055001983,
        blockHeader: 1965916697,
        blockData: -1519063700,

        anyError: -1146494648
    }

    public static decodeAdnlMessage (data: Buffer): adnl_Message {
        const msg = Codecs.adnl_Message.decode(new TLReadBuffer(data))
        return msg
    }

    public static decodeError (data: Buffer): liteServer_error {
        return Codecs.liteServer_Error.decode(new TLReadBuffer(data))
    }

    public static decodeCurrentTime (data: Buffer): number {
        const time = Functions
            .liteServer_getTime
            .decodeResponse(new TLReadBuffer(data))

        return time.now
    }

    public static decodeMasterchainInfo (data: Buffer): liteServer_masterchainInfo {
        const decoded = Functions
            .liteServer_getMasterchainInfo
            .decodeResponse(new TLReadBuffer(data))

        return decoded
    }

    public static decodeBlockHeader (data: Buffer): liteServer_blockHeader {
        const decoded = Functions
            .liteServer_getBlockHeader
            .decodeResponse(new TLReadBuffer(data))

        return decoded
    }

    public static decodeBlockData (data: Buffer): liteServer_BlockData {
        const decoded = Functions
            .liteServer_getBlock
            .decodeResponse(new TLReadBuffer(data))

        return decoded
    }
}

export { ADNLDecoder }
