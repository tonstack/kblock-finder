import { ADNLClient } from 'adnl'
import { randomBytes } from 'crypto'
import { TLWriteBuffer } from 'ton-tl'
import { Codecs, Functions, tonNode_blockId, tonNode_blockIdExt } from '../auto/schema-tl'

class ADNLUtil {
    private _client: ADNLClient | undefined

    constructor (client?: ADNLClient) {
        this._client = client || undefined
    }

    private static wrapQuery (data: Buffer): { data: Buffer, queryId: Buffer } {
        const queryId = randomBytes(32)
        const lsQuery = new TLWriteBuffer()
        Functions.liteServer_query.encodeRequest({ kind: 'liteServer.query', data }, lsQuery)

        const adnlWriter = new TLWriteBuffer()
        Codecs.adnl_Message.encode({
            kind: 'adnl.message.query',
            queryId,
            query: lsQuery.build()
        }, adnlWriter)

        return { data: adnlWriter.build(), queryId }
    }

    private wrapAndWrite (data: Buffer): Buffer {
        const wrap = ADNLUtil.wrapQuery(data)
        this.client.write(wrap.data)

        return wrap.queryId
    }

    public timePing (): Buffer {
        const writer = new TLWriteBuffer()
        Functions.liteServer_getTime.encodeRequest(null, writer)

        return this.wrapAndWrite(writer.build())
    }

    public getMasterchainInfo (): Buffer {
        const writer = new TLWriteBuffer()
        Functions.liteServer_getMasterchainInfo.encodeRequest(null, writer)

        return this.wrapAndWrite(writer.build())
    }

    public getBlockHeader (block: tonNode_blockIdExt): Buffer {
        const writer = new TLWriteBuffer()
        Functions.liteServer_getBlockHeader.encodeRequest({
            kind: 'liteServer.getBlockHeader',
            id: { kind: 'tonNode.blockIdExt', ...block },
            mode: 88
        }, writer)

        return this.wrapAndWrite(writer.build())
    }

    public lookupBlock (block: tonNode_blockId): Buffer {
        const writer = new TLWriteBuffer()
        Functions.liteServer_lookupBlock.encodeRequest({
            mode: 1,
            kind: 'liteServer.lookupBlock',
            id: { kind: 'tonNode.blockId', ...block },
            lt: null,
            utime: null
        }, writer)

        return this.wrapAndWrite(writer.build())
    }

    public get client (): ADNLClient {
        return this._client
    }

    public setClient (client: ADNLClient): void {
        this._client = client
    }
}

export { ADNLUtil }
