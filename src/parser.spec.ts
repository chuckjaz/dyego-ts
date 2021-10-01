import { parse } from "./parser"
import { Scanner } from "./scanner"

describe("Parser", () => {
    describe("basics", () => {
        it("can parse an empty string", () => {
            expect(p("")).toEqual([])
        })    
    })
    describe("import", () => {
        it("can spread a module reference", () => {
            p("...module")
        })
        it("can spread a scoped module reference", () => {
            p("...namespace::module")
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
            v("<| infix operator `+` before `-` left |>")
            v("<| infix operator `+=` after `-=` right |>")
            v("<| infix operator `-` before infix `+` |>")
            v("<| infix operator `-` before prefix `+` |>")
            v("<| infix operator `-` before postfix`+` |>")
        })
        it("can specify multiple operators", () => {
            v("<| infix operator (`+`, `-`) |>")
        })
        it("can specify where identifiers are in prcedence", () => {
            v("<| infix operator identifiers |>")
        })
        it("can spread a vocabulary reference", () => {
            v("<| ...b.c |>")
        })
        it("can detect a incorrect operator declaration", () => {
            ve("<| operator `+` |>", "Expected an operator placement (prefix, infix or postfix) on 1")
        })
        it("can detect using a symbol instead of an identifier", () => {
            ve("<| prefix operator + |>", "Expected name or names of the operator on 1")
        })

        function v(source: string) {
            p(`let a = ${source}`)
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
        function t(source: string) {
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
                p("if (a) else b")
            })
        })
        it("can parse a parenthised expression", () => {
            p("(b + c)")
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

    function p(source: string) {
        const scanner = new Scanner(source)
        return parse(scanner)
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