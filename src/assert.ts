export function error(message: string): never {
    throw Error(`Internal: ${message}`)
}

export function required<T>(value: T | undefined | null): T {
    if (!value) error("Requirement failed")
    return value
}
