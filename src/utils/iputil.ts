function ipIntegerToString (ipInteger: number): string {
    const parts = [
        ipInteger & 255,
        (ipInteger >> 8) & 255,
        (ipInteger >> 16) & 255,
        (ipInteger >> 24) & 255
    ]

    return `${parts[3]}.${parts[2]}.${parts[1]}.${parts[0]}`
}

export { ipIntegerToString }
