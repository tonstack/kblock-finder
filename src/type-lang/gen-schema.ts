import fs from 'fs'
import { generate } from 'ton-tl'

function main (): void {
    const source = fs.readFileSync('./src/type-lang/schema.tl', 'utf-8')

    const generated = generate(source)
    fs.writeFileSync('./src/auto/schema-tl.ts', generated)
}

if (require.main === module) { main() }
