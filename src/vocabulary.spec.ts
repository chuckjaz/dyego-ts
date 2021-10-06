import { ElementKind, OperatorPlacement, VocabularyLiteralElement } from "./ast"
import {
    buildVocabulary, VocabularyScope, Vocabulary, Operator, PrecedenceLevel
} from "./vocabulary"
import { parse } from "./parser"
import { Scanner } from "./scanner"

describe("vocabulary", () => {

    it("can create an empty vocabulary", () => {
        const vocabulary = v("<| |>")
        expect(vocabulary).not.toBeNull()
    })
    it("can specify an operator", () => {
        const vocabulary = v("<| infix operator '+' right |>")
        const operator = vocabulary.get("+")
        expect(operator).not.toBeNull()
    })
    it("can specify related operators", () => {
        const vocabulary = v("<| infix operator '*' right, infix operator '+' right |>")
        const plus = l(o(vocabulary, "+"), OperatorPlacement.Infix)
        const mult = l(o(vocabulary, "*"), OperatorPlacement.Infix)
        expect(mult.isHigherThan(plus)).toBeTrue()
    })
    it("can specify multiple operators", () => {
        const vocabulary = v("<| infix operator ('+', '-') right |>")
        const plus = l(o(vocabulary, "+"), OperatorPlacement.Infix)
        const minus = l(o(vocabulary, '-'), OperatorPlacement.Infix)
        expect(plus === minus).toBeTrue()
    })
    it("can specify prefix and postfix and infix for the same name", () => {
        const vocabular = v(`<|
            postfix operator '+' right,
            prefix operator '+' right,
            infix operator '+' right
        |>`)
        const plus = o(vocabular, "+")
        expect(plus.levels[OperatorPlacement.Prefix]).not.toBeNull()
        expect(plus.levels[OperatorPlacement.Infix]).not.toBeNull()
        expect(plus.levels[OperatorPlacement.Postfix]).not.toBeNull()
    })
    it("can parse a standard vocabulary", () => {
        v(`
            <|
                postfix operator ('++', '--', '?.', '?') right,
                prefix operator ('+', '-', '--', '++') right,
                infix operator ('as', 'as?') left,
                infix operator ('*', '/', '%') left,
                infix operator ('+', '-') left,
                infix operator '..' left,
                infix operator identifiers left,
                infix operator '?:' left,
                infix operator ('in', '!in', 'is', '!is') left,
                infix operator ('<', '>', '>=', '<=') left,
                infix operator ('==', '!=') left,
                infix operator '&&' left,
                infix operator '||' left,
                infix operator ('=', '+=', '*=', '/=', '%=') right
            |>
        `)
    })


    const standardVocabulary = v(`
        <|
            postfix operator ('++', '--', '?.', '?') right,
            prefix operator ('+', '-', '--', '++') right,
            infix operator ('as', 'as?') left,
            infix operator ('*', '/', '%') left,
            infix operator ('+', '-') left,
            infix operator '..' left,
            infix operator identifiers left,
            infix operator '?:' left,
            infix operator ('in', '!in', 'is', '!is') left,
            infix operator ('<', '>', '>=', '<=') left,
            infix operator ('==', '!=') left,
            infix operator '&&' left,
            infix operator '||' left,
            infix operator ('=', '+=', '*=', '/=', '%=') right
        |>
    `)

    const dyegoScope = new VocabularyScope()
    dyegoScope.members.set("Dyego", standardVocabulary)
    dyegoScope.members.set("nested", dyegoScope)

    it("can embed a vocabulary in another vocabular", () => {
        const vocabulary = v(`
            <|
                ...Dyego,
                infix operator '##' right
            |>
        `, dyegoScope)
        const plus = l(o(vocabulary, "+"), OperatorPlacement.Infix)
        const pounds = l(o(vocabulary, "##"), OperatorPlacement.Infix)
        expect(plus.isHigherThan(pounds)).toBeTrue()
    })

    it("can embed a vocabulary using a dotted reference", () => {
        const vocabulary = v(`
            <|
                ...nested.nested.nested.Dyego,
                infix operator '##' right
            |>
        `, dyegoScope)
        const plus = l(o(vocabulary, "+"), OperatorPlacement.Infix)
        const pounds = l(o(vocabulary, "##"), OperatorPlacement.Infix)
        expect(plus.isHigherThan(pounds)).toBeTrue()
    })

    it("can declare a new operator before existing", () => {
        const vocabulary = v(`
            <|
                ...Dyego,
                infix operator '##' before infix '+' right
            |>
        `, dyegoScope)
        const plus = l(o(vocabulary, "+"), OperatorPlacement.Infix)
        const pounds = l(o(vocabulary, "##"), OperatorPlacement.Infix)
        expect(pounds.isHigherThan(plus)).toBeTrue()
    })

    it("can declare a new operator lower than existing", () => {
        const vocabulary = v(`
            <|
                ...Dyego,
                infix operator '##' after infix '+' right
            |>
        `, dyegoScope)
        const plus = l(o(vocabulary, "+"), OperatorPlacement.Infix)
        const pounds = l(o(vocabulary, "##"), OperatorPlacement.Infix)
        const dotdot = l(o(vocabulary, ".."), OperatorPlacement.Infix)
        expect(plus.isHigherThan(pounds)).toBeTrue()
        expect(pounds.isHigherThan(dotdot)).toBeTrue()
    })

    it("can declare a new operator lower with no placement", () => {
        const vocabulary = v(`
            <|
                ...Dyego,
                infix operator '##' after '..' right
            |>
        `, dyegoScope)
        const pounds = l(o(vocabulary, "##"), OperatorPlacement.Infix)
        const dots = l(o(vocabulary, ".."), OperatorPlacement.Infix)
        expect(dots.isHigherThan(pounds))
    })

    function o(v: Vocabulary, name: string): Operator {
        const operator = v.get(name)
        if (!operator) throw Error(`Could not find ${name}`)
        return operator
    }

    function l(o: Operator, placement: OperatorPlacement): PrecedenceLevel {
        const level = o.levels[placement]
        if (!level) throw Error(`Could not find level for ${o.name}`)
        return level
    }

    function ve(source: string, scope: VocabularyScope): VocabularyLiteralElement {
        const scanner = new Scanner(`let a = ${source.replace(/'/g, "`")}`)
        const tree = parse(scanner, scope)
        for (const element of tree) {
            switch(element.kind) {
                case ElementKind.LetDeclaration:
                    const value = element.initializer
                    if (value && value.kind == ElementKind.VocabularyLiteral)
                        return value
            }

        }
        throw Error(`No vocabulary found in "${source}`)
    }

    function v(source: string, scope: VocabularyScope = new VocabularyScope()): Vocabulary {
        const element = ve(source, scope)
        return buildVocabulary(scope, element)
    }
})