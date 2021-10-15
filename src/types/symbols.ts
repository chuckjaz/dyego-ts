export interface Symbol {
    readonly name: string
}

export interface Scope<S extends Symbol> {
    find(name: string): S | null
    has(name: string): boolean
    symbols(): IterableIterator<S>
    isEmpty(): boolean
}

export interface ScopeBuilder<S extends Symbol> extends Scope<S> {
    enter(symbol: S): boolean
    reenter(symbol: S): S | null
    build(): Scope<S>
}

export function emptyScope<S extends Symbol>(): Scope<S> {
    return emptyScopeImpl
}

export function scopeBuilder<S extends Symbol>(): ScopeBuilder<S> {
    return new ScopeBuidlerImpl()
}

export function mergeScopes<S extends Symbol>(...scopes: Scope<S>[]): Scope<S> {
    const nonEmpty = scopes.filter(scope => !scope.isEmpty())
    switch (nonEmpty.length) {
        case 0: return emptyScope()
        case 1: return nonEmpty[0]
        default: return new MergedScope(nonEmpty)
    }
}

class EmptyScope implements Scope<any> {
    find(name: string) { return null }
    has(name: string): boolean { return false }
    *symbols(): IterableIterator<any> { }
    isEmpty(): boolean { return true }
}

const emptyScopeImpl = new EmptyScope()

class ScopeImpl<S extends Symbol> implements Scope<S> {
    protected map: Map<string, S>

    constructor(map: Map<string, S>) {
        this.map = map
    }

    find(name: string): S | null {
        return this.map.get(name) || null
    }

    has(name: string): boolean {
        return this.map.has(name)
    }

    symbols(): IterableIterator<S> {
        return this.map.values()
    }

    isEmpty(): boolean {
        return this.map.size == 0
    }
}

class ScopeBuidlerImpl<S extends Symbol> extends ScopeImpl<S> implements ScopeBuilder<S> {
    private built: boolean = false

    constructor() {
        super(new Map())
    }

    enter(symbol: S): boolean {
        let map = this.map
        const name = symbol.name
        if (map.has(name)) return false
        this.mutableMap().set(name, symbol)
        return true
    }

    reenter(symbol: S): S | null {
        const map = this.map
        const name = symbol.name
        const previous = this.map.get(name) || null
        this.mutableMap().set(name, symbol)
        return previous
    }

    build(): Scope<S> {
        if (this.map.size == 0) return emptyScope()
        this.built = true
        return new ScopeImpl(this.map)
    }

    private mutableMap(): Map<string, S> {
        const map = this.map
        if (!this.built) return map
        const newMap = new Map()
        for (let entry of map.entries()) {
            newMap.set(entry[0], entry[1])
        }
        this.map = newMap
        this.built = false
        return newMap
    }
}

class MergedScope<S extends Symbol> implements Scope<S> {
    private scopes: Scope<S>[]

    constructor(scopes: Scope<S>[]) {
        this.scopes = scopes.reverse()
    }

    find(name: string): S | null {
        for (let scope of this.scopes) {
            const result = scope.find(name)
            if (result) return result
        }
        return null
    }

    has(name: string): boolean {
        for (let scope of this.scopes) {
            if (scope.find(name)) return true
        }
        return false
    }

    *symbols(): IterableIterator<S> {
        const emitted = new Map<string, S>()
        for (let scope of this.scopes) {
            for (let symbol of scope.symbols()) {
                if (emitted.has(symbol.name)) continue
                emitted.set(symbol.name, symbol)
                yield symbol
            }
        }
    }

    isEmpty(): boolean {
        // This is guaranteed to be false by mergeScope()
        return false
    }
}
