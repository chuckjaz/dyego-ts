import { emptyScope, mergeScopes, Scope, scopeBuilder, Symbol } from './symbols'

describe("scopes", () => {
    it("can create an empty scope", () => {
        const scope = emptyScope()
        expect(scope.find("a")).toBeNull()
        expect(scope.isEmpty()).toBeTrue()
        expect(scope.has("a")).toBeFalse()
        expect([...scope.symbols()]).toEqual([])
    })
    it("can create a scope", () => {
        const builder = scopeBuilder()
        const a = sym("a")
        expect(builder.enter(a)).toBeTrue()
        expect(builder.enter(sym("a"))).toBeFalse()
        const scope = builder.build()
        expect(scope.has("a")).toBeTrue()
        expect(scope.find("a")).toBe(a)
        expect(scope.find("b")).toBeNull()
        expect(scope.isEmpty()).toBeFalse()
        expect([...scope.symbols()]).toEqual([a])
    })
    it("can reenter a symbol", () => {
        const builder = scopeBuilder()
        const a = sym("a")
        const newA = sym("a")
        expect(builder.enter(a)).toBeTrue()
        expect(builder.find("a")).toBe(a)
        expect(builder.reenter(newA)).toBe(a)
        expect(builder.find("a")).toBe(newA)
        expect(builder.reenter(sym("b"))).toBeNull()
    })
    it("can build use a build to incrementally build a scope", () => {
        const builder = scopeBuilder()
        const a = sym("a")
        const b = sym("b")
        const c = sym("c")
        builder.enter(a)
        const scopeWithA = builder.build()
        builder.enter(b)
        const scopeWithAandB = builder.build()
        builder.enter(c)
        const scopeWithAll = builder.build()

        t(scopeWithA, [a], [b, c])
        t(scopeWithAandB, [a, b], [c])
        t(scopeWithAll, [a, b, c], [])
    })
    it("building an empty scope is empty", () => {
        const builder = scopeBuilder()
        const s = builder.build()
        expect(s).toBe(emptyScope())
    })
    describe(" merge scopes", () => {
        it("merging empty scopes is empty", () => {
            const e = emptyScope()
            const scope = mergeScopes(e, e, e, e)
            expect(scope.isEmpty()).toBeTrue()
            expect([...scope.symbols()]).toEqual([])
        })
        it("merging a scope with empty is scope", () => {
            const scope = sn("a", "b", "c", "d")
            const merged = mergeScopes(scope, emptyScope())
            expect(merged).toBe(scope)
        })
        it("can merge two scopes", () => {
            const scope1 = sn("a", "b", "c")
            const scope2 = sn("A", "B", "C")
            const merged = mergeScopes(scope1, scope2)
            const expected = [...scope1.symbols(), ...scope2.symbols()]
            t(merged, expected, [])
        })
        it("later merged values precedence", () => {
            const s1 = ["a", "b", "c"].map(name => sym(name))
            const s2 = ["b", "c", "d"].map(name => sym(name))
            const scope1 = s(...s1)
            const scope2 = s(...s2)
            const merged = mergeScopes(scope1, scope2)
            const expected = [...s2, s1[0]]
            const notExpected = [s1[1], s1[2]]
            t(merged, expected, notExpected)
            expect([...merged.symbols()]).toEqual([...s2, s1[0]])
        })
        it("should return null if nothing found", () => {
            const a = sym("a")
            const b = sym("b")
            const c = sym("c")
            const merged = mergeScopes(s(a), s(b))
            expect(merged.find("a")).toBe(a)
            expect(merged.find("b")).toBe(b)
            expect(merged.find("c")).toBeNull()
            expect(merged.has("a")).toBeTrue()
            expect(merged.has("b")).toBeTrue()
            expect(merged.has("c")).toBeFalse()
            expect(merged.isEmpty()).toBeFalse()
            t(merged, [a, b], [c])
            expect([...merged.symbols()]).toEqual([b, a])
        })
    })
})

function t(scope: Scope<Symbol>, has: Symbol[], hasNot: Symbol[]) {
    for (const symbol of has) {
        expect(scope.find(symbol.name)).toBe(symbol)
    }
    for (const symbol of hasNot) {
        expect(scope.find(symbol.name)).not.toBe(symbol)
    }
}

function sn(...names: string[]): Scope<Symbol> {
    return s(...names.map(name => sym(name)))
}

function s(...symbols: Symbol[]): Scope<Symbol> {
    const builder = scopeBuilder()
    for (let symbol of symbols) {
        builder.enter(symbol)
    }
    return builder
}

function sym(name: string): Symbol {
    return { name, location: { start: -1, end: -1 } }
}
