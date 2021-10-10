import { childrenOf, Element, ElementBuilder, ElementKind, Name } from "./ast"
import { parse } from "./parser"
import { Scanner } from "./scanner"
import { buildVocabulary, Vocabulary, VocabularyScope } from "./vocabulary"

describe("Parser", () => {
    describe("basics", () => {
        it("can parse an empty string", () => {
            expect(p("")).toEqual([])
        })
    })
    describe("import", () => {
        it("can spread a module reference", () => {
            p("...simple", simpleScope())
        })
        it("can spread a scoped module reference", () => {
            p("...nested.simple", simpleScope())
        })
        it("can spread a vocabulary literal", () => {
            p("... <| |>")
        })
    })
    describe("declarations", () => {
        describe("let", () => {
            it("can parse with no type", () => {
                p("let a = 1")
            })
            it("can parse with a type", () => {
                p("let a: Int = 1")
            })
        })
        describe("var", () => {
            it("can parse a var with no type or value", () => {
                p("var a")
            })
            it("can parse a var with a value and no type", () => {
                p("var a = 1")
            })
            it("can parse a var with a type and no value", () => {
                p("var a: Int")
            })
            it("can parse a var with a type and value", () => {
                p("var a: Int = 1")
            })
        })
        describe("val", () => {
            it("can parse a var with no type or value", () => {
                p("var a")
            })
            it("can parse a var with a value and no type", () => {
                p("var a = 1")
            })
            it("can parse a var with a type and no value", () => {
                p("var a: Int")
            })
            it("can parse a var with a type and value", () => {
                p("var a: Int = 1")
            })
        })
    })
    describe("statements", () => {
        describe("break", () => {
            it("can parse a break statement no label", () => {
                p("break")
            })
            it("can parse a break statement with label", () => {
                p("break label")
            })
        })
        describe("continue", () => {
            it("can parse a continue statement with no lable", () => {
                p("continue")
            })
            it("can parse a continue statement with a label", () => {
                p("continue label")
            })
        })
        describe("loop", () => {
            it("can parse a loop", () => {
                p("loop { }")
            })
            it("can parse a loop with a label", () => {
                p("loop label { }")
            })
        })
        describe("while", () => {
            it("can parse a while loop", () => {
                p("while (true) { }")
            })
            it("can parse a while loop with a label", () => {
                p("while label (true) { }")
            })
        })
        describe("return", () => {
            it("can parse a simple return", () => {
                p("return")
            })
            it("can parse a return of a value", () => {
                p("return true")
            })
        })
    })
    describe("vocabulary", () => {
        it("can parse an empty vocabulary", () => {
            v("<||>")
        })
        it("can parse a prefix operator", () => {
            v("<| prefix operator `++` |>")
        })
        it('can parse an infix operator', () => {
            v("<| infix operator `+` |>")
        })
        it("can parse a postfix operator", () => {
            v("<| postfix operator `++` |>")
        })
        it("can parse an infix with an associativity", () => {
            v("<| infix operator `+` left |>")
            v("<| infix operator `+=` right |>")
        })
        it("can specify priorty qualifier", () => {
            v("<| ...simple, infix operator `#` before `*` left |>")
            v("<| ...simple, infix operator `#=` after `*` right |>")
            v("<| ...simple, infix operator `#` before infix `+` |>")
            v("<| ...simple, infix operator `#` before prefix `++` |>")
            v("<| ...simple, infix operator `#` before postfix`++` |>")
        })
        it("can specify multiple operators", () => {
            v("<| infix operator (`+`, `-`) |>")
        })
        it("can specify where identifiers are in prcedence", () => {
            v("<| infix operator identifiers |>")
        })
        it("can spread a vocabulary reference", () => {
            v("<| ...nested.empty |>")
        })
        it("can detect a incorrect operator declaration", () => {
            ve("<| operator `+` |>", "Expected an operator placement (prefix, infix or postfix) on 1")
        })
        it("can detect using a symbol instead of an identifier", () => {
            ve("<| prefix operator + |>", "Expected name or names of the operator on 1")
        })

        function v(source: string) {
            p(`...simple, let a = ${source}`, simpleScope())
        }
        function ve(source: string, message: string) {
            e(`let a = ${source}`, message)
        }
    })
    describe("type literal", () => {
        it("can parse an empty type literal", () => {
            t("< >")
        })
        it("can parse a val member", () => {
            t("< val a: Int = 1, >")
        })
        it("can parse a var member", () => {
            t("< var a: Int = 1, >")
        })
        it("can parse a let member", () => {
            t("< let a: Int = 1, >")
        })
        it("can parse a spread a type", () => {
            t("< ...a >")
        })
        it("can use a type literal to export", () => {
            p("< let a = a, let b = b, >")
        })
        it("can have a simple invoke member", () => {
            t("< { } >")
        })
        it("can parse an invoke member with parameters", () => {
            t("< { a: Int, b: Int } >")
        })
        it("can have an invoke member with a result", () => {
            t("< { }: Int >")
            t("< { a: Int, b: Int}: Int >")
        })
        it("can have an invoke member with a type parameter", () => {
            t("< { T -> a: T }: T >")
            t("< { T, V: Int -> a: T }: T >")
        })
        it("can validate a type literal with a constraint", () => {
            t("< let a: Int = 1 > : Constraint")
        })
        function t(source: string) {
            return p(`let a = ${source}`)
        }
    })
    describe("constraints", () => {
        it("can parse an empty literal", () => {
            c("<* *>")
        })
        it("can parse a let constraint", () => {
            c("<* let a: Int *>")
            c("<* let a: Int = 1 *>")
        })
        it("can parse a val cosntraint", () => {
            c("<* val a: Int *>")
        })
        it("can parse a var constraint", () => {
            c("<* var a: Int *>")
        })
        it("can parse a generic constraint", () => {
            c("<* T: Int, A: type -> let a: Int = T, val a: A *>")
        })
        function c(source: string) {
            return p(`let a = ${source}`)
        }
    })
    describe("type reference", () => {
        it("can have a simple type", () => {
            tr("Int")
        })
        it("can have a scopeed reference", () => {
            tr("a.B")
        })
        it("can specify an array", () => {
            tr("Int[]")
        })
        it("can specify an and type", () => {
            tr("A & B")
        })
        it("can specify an or type", () => {
            tr("A | B")
        })
        it("can specify an optional type", () => {
            tr("A?")
        })
        it("can specify a This type", () => {
            tr("This")
        })
        it("can speicfy a generic type", () => {
            tr("A<B>")
        })
        it("can use parens to qualify a type", () => {
            tr("(A)")
        })
        it("can be a type literal", () => {
            tr("< let a: Int = 1 >")
        })
        it("can report a type error", () => {
            tre("+", "Expected a type name on 1")
        })

        function tr(source: string) {
            return p(`var a: ${source}`)
        }
        function tre(source: string, message: string) {
            e(`var a: ${source}`, message)
        }
    })
    describe("expression", () => {
        describe("literals", () => {
            it("can parse true", () => {
                p("true")
            })
            it("can parse false", () => {
                p("false")
            })
            it("can parse a literal", () => {
                p("1")
            })
            it("can parse an array literal", () => {
                p("[1, 2, 3, ...a]")
            })
            it("can parse an object literal", () => {
                p("[a: 23, :b, ...a]")
            })
            it("can parse a mutable array literal", () => {
                p("[! 1, 2, 3 !]")
            })
            it("can parse a mutable object literal", () => {
                p("[! a: 23, b: 32, :c !]")
            })
        })
        it("can select a member", () => {
            p("a.b")
        })
        describe("call", () => {
            it("can parse a simple call", () => {
                p("a()")
            })
            it("can parse a call with a parameter", () => {
                p("a(a: 23)")
            })
            it("can parse a dsl call", () => {
                p("a { 12 }")
            })
            it("can parse a dsl with parameters", () => {
                p("a(b: 23) { 12 }")
            })
            it("can call with generic parameters", () => {
                p("a<valueType: Int>(value: 1)")
            })
            it("can call with a spread", () => {
                p("a(...b)")
            })
        })
        describe("when", () => {
            it("can parse a simple when", () => {
                p("when(a) { true -> true, false -> false }")
            })
            it("can parse a when with an else", () => {
                p("when(a) { true -> true, else -> false }")
            })
        })
        describe("if", () => {
            it("can parse a if expression", () => {
                p("if (a) b")
            })
            it("can parse an if with an else", () => {
                p("if (a) a else b")
            })
        })
        describe("unary expression", () => {
            it("can parse a prefix expression", () => {
                u("+a")
            })
            it("can parse a postfix expression", () => {
                u("a++")
            })
            it("can parse a prefix and postfix exprssion", () => {
                u("++a++")
            })

            function u(source: string) {
                return p(`...simple, ${source}`, simpleScope())
            }
        })
        describe("binary expression", () => {
            const builder = new ElementBuilder({})

            it("can parse a binary expression", () => {
                b("a + b")
            })
            it("can parse and get right precedence", () => {
                const r = b("a + b * c + d")
                validateTree(r,
                    bin("+",
                        bin("+",
                            n("a"),
                            bin("*",
                                n("b"),
                                n("c")
                            )
                        ),
                        n("d")
                    )
                )
            })

            function b(source: string): Element {
                const r = p(`...simple, ${source}`, simpleScope())
                if (r && r[1]) return r[1]
                throw Error("Expected an element")
            }

            function n(text: string): Name {
                return builder.Name(text)
            }

            function bin(text: string, left: Element, right: Element): Element {
                return builder.Call(builder.Selection(left, builder.Name(text)), [right], [])
            }
        })
        it("can parse a parenthised expression", () => {
            p("...simple, (b + c)", simpleScope())
        })
    })
    describe("lambda", () => {
        it("can parse an empty lambda", () => {
            l("{ }")
        })
        it("can parse a lambda with statements", () => {
            l("{ loop { a, break } }")
        })
        it("can parse a lambda with formal parameters (no types)", () => {
            p("{ a, b -> loop { break } }")
        })
        it("it can parse a lambda with formal parameters and types", () => {
            p("{ a: Int, b: String -> loop { break } }")
        })
        function l(source: string) {
            p(`let a = ${source}`)
        }
    })
    describe("intrinsic lambda", () => {
        it("can parse an empty lambda", () => {
            l("{! !}")
        })
        it("can parse an intrinsic lambda with values", () => {
            l("{! a.b, c.d !}")
        })
        function l(source: string) {
            p(`let a = ${source}`)
        }
    })

    describe("seperators", () => {
        it("new lines can imply a seperator", () => {
            expect(ns(s("a \n b"))).toEqual(["a", "b"])
        })

        it("an infix operator before a new line prevents a seperator", () => {
            expect(s("a + \n b").length).toBe(1)
        })

        it("an infix operator after the new line prevents a seperator", () => {
            expect(s("a \n + b").length).toBe(1)
        })

        it("a prefix operator after new line is a seperator", () => {
            expect(s("a \n --b").length).toBe(2)
        })

        function s(source: string): Element[] {
            const scanner = new Scanner(`...simple, ${source}`)
            return parse(scanner, simpleScope()).slice(1)
        }

        function ns(names: Element[]) {
            return names.map(e => {
                return e.kind == ElementKind.Name ? e.text : ""
            })
        }
    })

    function vs(source: string, scope: VocabularyScope = new VocabularyScope()): Vocabulary {
        const vocabularyElements = p(source.replace(/'/g, "`"), scope)
        const vocabularyElement = vocabularyElements[0]
        if (!vocabularyElement || vocabularyElement.kind != ElementKind.VocabularyLiteral)
            throw Error("source is not a vocabulary literal")
        return buildVocabulary(scope, vocabularyElement)
    }

    function simpleScope() {
        const simple = vs(`
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
        |>`)
        const empty = vs(`<| |>`)
        const scope = new VocabularyScope()
        scope.members.set("simple", simple)
        scope.members.set("empty", empty)
        scope.members.set("nested", scope)
        return scope
    }

    function p(source: string, scope: VocabularyScope = new VocabularyScope()): Element[] {
        const scanner = new Scanner(source)
        return parse(scanner, scope)
    }

    function e(source: string, message: string) {
        const scanner = new Scanner(source)
        let reported = false
        try {
            parse(scanner)
        } catch(e) {
            reported = true
            if (e instanceof Error) {
                expect(e.message).toBe(message)
            }
        }
        expect(reported).toBe(true)
    }
})

function validateTree(element: Element, expected: Element) {
    if (element.kind != expected.kind) {
        throw Error(`Expected a ${element.kind} received ${expected.kind}`)
    }

    switch (element.kind) {
        case ElementKind.Name:
            if (expected.kind != ElementKind.Name) throw Error()
            expect(element.text).toBe(expected.text)
            break
        case ElementKind.Literal:
            if (expected.kind != ElementKind.Literal) throw Error()
            expect(element.literal).toBe(expected.literal)
            expect(element.value).toBe(expected.value)
            break
        case ElementKind.VocabularyOperatorDeclaration:
            if (expected.kind !=  ElementKind.VocabularyOperatorDeclaration) throw Error()
            expect(element.associativity).toBe(expected.associativity)
            expect(element.placement).toBe(expected.placement)
            expect(element.precedence).toEqual(element.precedence)
            break
    }

    const receivedChildren: Element[] = []
    for (let child of childrenOf(element)) {
        receivedChildren.push(child)
    }
    const expectedChildren: Element[] = []
    for (let child of childrenOf(expected)) {
        expectedChildren.push(child)
    }
    if (receivedChildren.length != expectedChildren.length) {
        throw Error("Different number of children received")
    }
    for (let i = 0; i < expectedChildren.length; i++) {
        validateTree(receivedChildren[i], expectedChildren[i])
    }
}

