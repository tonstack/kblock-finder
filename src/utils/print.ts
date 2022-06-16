import { tonNode_blockIdExt } from '../auto/schema-tl'

function printBlock (block: tonNode_blockIdExt): void {
    console.log('\n------------------------------------')
    console.log(`workchain: ${block.workchain}`)
    console.log(`shard:     ${block.shard}`)
    console.log(`seqno:     ${block.seqno}`)
    console.log(`rootHash:  ${block.rootHash.toString('base64')}`)
    console.log(`fileHash:  ${block.fileHash.toString('base64')}`)
    console.log('------------------------------------\n')
}

export { printBlock }
