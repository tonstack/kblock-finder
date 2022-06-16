import { ADNLClient } from 'adnl'
import { randomBytes } from 'crypto'
import { TLWriteBuffer } from 'ton-tl'
import { Codecs, Functions } from '../auto/schema-tl'

class ADNLUtil {
    private _client: ADNLClient | undefined

    constructor (client?: ADNLClient) {
        this._client = client || undefined
    }

    private static wrapQuery (data: Buffer): Buffer {
        const lsQuery = new TLWriteBuffer()
        Functions.liteServer_query.encodeRequest({ kind: 'liteServer.query', data }, lsQuery)

        const adnlWriter = new TLWriteBuffer()
        Codecs.adnl_Message.encode({
            kind: 'adnl.message.query',
            queryId: randomBytes(32),
            query: lsQuery.build()
        }, adnlWriter)

        return adnlWriter.build()
    }

    private wrapAndWrite (data: Buffer) {
        this.client.write(ADNLUtil.wrapQuery(data))
    }

    public timePing (): void {
        const writer = new TLWriteBuffer()
        Functions.liteServer_getTime.encodeRequest(null, writer)

        this.wrapAndWrite(writer.build())
    }

    public getMasterchainInfo (): void {
        const writer = new TLWriteBuffer()
        Functions.liteServer_getMasterchainInfo.encodeRequest(null, writer)

        this.wrapAndWrite(writer.build())
    }

    public getBlockHeader (
        workchain: number,
        shard: string,
        seqno: number,
        rootHash: Buffer,
        fileHash: Buffer
    ): void {
        const writer = new TLWriteBuffer()
        Functions.liteServer_getBlockHeader.encodeRequest({
            kind: 'liteServer.getBlockHeader',
            id: {
                kind: 'tonNode.blockIdExt',
                workchain,
                shard,
                seqno,
                rootHash,
                fileHash
            },
            mode: 88
        }, writer)

        this.wrapAndWrite(writer.build())
    }

    public get client (): ADNLClient {
        return this._client
    }

    public setClient (client: ADNLClient): void {
        this._client = client
    }
}

export { ADNLUtil }
