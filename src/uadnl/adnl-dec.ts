import { TLReadBuffer } from 'ton-tl'
import { adnl_Message, Codecs, Functions, liteServer_error, liteServer_masterchainInfo } from '../auto/schema-tl'

class ADNLDecoder {
    public static RESP_CODE = {
        currentTime: -380436467,
        masterchainInfo: -2055001983,
        blockHeader: 1965916697,

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
}

export { ADNLDecoder }
