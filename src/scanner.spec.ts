import { Scanner } from "./scanner"
import { Literal, PseudoToken, Token, nameOfToken, nameOfPseudoToken } from "./tokens"

describe("Scanner", () => {
    describe("basics", () => {
        it("can create a scanner from text", () => {
            let scanner = new Scanner("some text")
            expect(scanner).not.toBeNull()
        })
        it("can create a scanner from a buffer", () => {
            const buffer = new Uint8Array(1)
            const scanner = new Scanner(buffer)
            expect(scanner).not.toBeNull()
        })
        it("can scan a line comment", () => {
            scanSource("ident // line comment", Token.Identifier)
        })
        it("should count lines correctly", () => {
            const line = scanSource(" \n  \r\n \n ident", Token.Identifier)
            expect(line).toBe(4)
        })
        it("can report an unknown character", () => {
            scanError("\u0001", "Unknown character")
        })
        it("can clone a scanner", () => {
            const scanner = new Scanner("1 2 3 4 5 6 7 8 9 10 11 12")
            for (let i = 1; i < 7; i++) {
                const token = scanner.next()
                expect(token).toBe(Token.Literal)
                expect(scanner.value).toBe(BigInt(i))
            }
            const clonedScanner = scanner.clone()
            for (let i = 7; i <= 12; i++) {
                const token = scanner.next()
                expect(token).toBe(Token.Literal)
                expect(scanner.value).toBe(BigInt(i))
            }
            for (let i = 7; i <= 12; i++) {
                const token = clonedScanner.next()
                expect(token).toBe(Token.Literal)
                expect(clonedScanner.value).toBe(BigInt(i))
            }
            expect(scanner.next()).toBe(Token.EOF)
            expect(clonedScanner.next()).toBe(Token.EOF)
        })
    })
    describe("identifiers", () => {
        it("can scan an identifer", () => {
            let scanner = new Scanner("identifier")
            let t = scanner.next()
            expect(t).toBe(Token.Identifier)
            expect(scanner.value).toBe("identifier")
            expect(scanner.start).toBe(0)
            expect(scanner.offset).toBe(10)
        })
        it("can scan multiple identifiers", () => {
            scanSource("ident _ident _ _12", Token.Identifier, Token.Identifier, Token.Identifier, Token.Identifier)
        })
        it("can scan an escaped literal", () => {
            const scanner = new Scanner("`abc`")
            const token = scanner.next()
            expect(token).toBe(Token.Identifier)
            expect(scanner.psuedo).toBe(PseudoToken.Escaped)
            expect(scanner.value).toBe("abc")
        })
        it("can parse reserved words", () => {
            scanSource("false true return let val var", Token.False, Token.True, Token.Return, Token.Let, Token.Val,
                Token.Var)
        })
        it("can parse pseudo reserved words", () => {
            scanPseudo("after before break continue else identifiers if infix", Token.Identifier, 
                PseudoToken.After, PseudoToken.Before, PseudoToken.Break, PseudoToken.Continue, PseudoToken.Else,
                PseudoToken.Identifiers, PseudoToken.If, PseudoToken.Infix)
            scanPseudo("left loop operator postfix prefix right where when while", Token.Identifier,
                PseudoToken.Left, PseudoToken.Loop, PseudoToken.Operator, PseudoToken.Postfix, PseudoToken.Prefix,
                PseudoToken.Right, PseudoToken.Where, PseudoToken.When, PseudoToken.While)
        })
        it("can embed a reserved word in a token", () => {
            for (let token = Token.False; token <= Token.Var; token++) {
                const tokenName = nameOfToken(token)
                scanSource(`${tokenName} _${tokenName} ${tokenName}x`, token, Token.Identifier, Token.Identifier)
            }
        })
        it("can embed a pseudo reserved word in a token", () => {
            for (let pseudo = PseudoToken.After; pseudo <= PseudoToken.While; pseudo++) {
                const pseudoName = nameOfPseudoToken(pseudo)
                scanPseudo(`${pseudoName} _${pseudoName} ${pseudoName}x`, Token.Identifier, 
                    pseudo, PseudoToken.None, PseudoToken.None)
            }
        })
    })
    describe("symbols", () => {
        it("can report an escaped symbol error", () => {
            scanError("`a", "Invalid character in quoted literal")
        })
        it("can scan a symbol", () => {
            scanSource("#-#", Token.Symbol)
            scanSource("#-# ## ++", Token.Symbol, Token.Symbol, Token.Symbol)
        })
        it("can parse reserved symbols", () => {
            scanSource("{}()[];: ,.::<||>[!!]{!!}", Token.LBrace, Token.RBrace, Token.LParen,
                Token.RParen, Token.LBrack, Token.RBrack, Token.Semi, Token.Colon,
                Token.Comma, Token.Dot, Token.Scope, Token.VocabStart, Token.VocabEnd,
                Token.LBrackBang, Token.BangRBrack, Token.LBraceBang, Token.BangRBrace)
        })
        it("can parse pseudo symbols", () => {
            scanPseudo("+ & | - * / % ! && || > >= = == != < <= ? -> .. ...", Token.Symbol,
                PseudoToken.Add, PseudoToken.And, PseudoToken.Bar, PseudoToken.Sub, PseudoToken.Mult, PseudoToken.Div, 
                PseudoToken.Rem, PseudoToken.Not, PseudoToken.LogicalAnd, PseudoToken.LogicalOr, PseudoToken.GreaterThan, 
                PseudoToken.GreaterThanEqual, PseudoToken.Equal, PseudoToken.DoubleEqual, PseudoToken.NotEqual, 
                PseudoToken.LessThan, PseudoToken.LessThanEqual, PseudoToken.Question, PseudoToken.Arrow, PseudoToken.Range, 
                PseudoToken.Spread)
        })
    })
    describe("literals", () => {
        describe("integers", () => {
            it("can scan int8 literals", () => {
                scanLiteral("1t 12t 127t", Literal.Int8, 1n, 12n, 127n)
            })
            it("can scan int16 literals", () => {
                scanLiteral("1s 23s 1024s 32767s", Literal.Int16, 1n, 23n, 1024n, 32767n)
            })
            it("can scan int32 literals", () => {
                scanLiteral("0 1 2 23 1111111", Literal.Int32, 0n, 1n, 2n, 23n, 1111111n)
            })
            it("can scan int64 literals", () => {
                scanLiteral("0l 23l 11111l", Literal.Int64, 0n, 23n, 11111n)
            })
            it("can scan uint8 literals", () => {
                scanLiteral("1ut 12ut 127ut", Literal.UInt8, 1n, 12n, 127n)
            })
            it("can scan uint16 literals", () => {
                scanLiteral("1us 23us 1024us 32767us", Literal.UInt16, 1n, 23n, 1024n, 32767n)
            })
            it("can scan uint32 literals", () => {
                scanLiteral("0u 1u 2u 23u 1111111u", Literal.UInt32, 0n, 1n, 2n, 23n, 1111111n)
            })
            it("can scan uint64 literals", () => {
                scanLiteral("0ul 23ul 11111ul", Literal.UInt64, 0n, 23n, 11111n)
            })
            it("can scan float32 literals", () => {
                scanLiteral("1f 1.0f 3.14f", Literal.Flaot32, 1.0, 1.0, 3.14)
            })
            it("can scan float64 literals", () => {
                scanLiteral("1d 1.0 3.14", Literal.Float64, 1.0, 1.0, 3.14)
            })
            it("can report an invalid number", () => {
                scanError("1g", "Extra character after numeric literal")
                scanError("256t", "Integer value out of range")
                scanError("1.0g", "Unexpected character after floating point literal")
            })
            it("can scan a hex int8 literal", () => {
                scanLiteral("0x1t", Literal.Int8, 0x1n)
            })
            it("can scan a hex int16 literal", () => {
                scanLiteral("0x1s", Literal.Int16, 0x1n)
            })
            it("can scan a hex int32 literal", () => {
                scanLiteral(" 0x1 0xaaa 0xAAA 0x1f", Literal.Int32, 1n, 0xaaan, 0xAAAn, 0x1fn)
            })
            it("can scan a hex int64 literal", () => {
                scanLiteral("0x1l", Literal.Int64, 0x1n)
            })
            it("can scan a hex uint8 literal", () => {
                scanLiteral("0x1ut", Literal.UInt8, 0x1n)
            })
            it("can scan a hex uint16 literal", () => {
                scanLiteral("0x1us", Literal.UInt16, 0x1n)
            })
            it("can scan a hex uint32 literal", () => {
                scanLiteral(" 0x1u 0xaaau 0xAAAu 0x1fu", Literal.UInt32, 1n, 0xaaan, 0xAAAn, 0x1fn)
            })
            it("can scan a hex uint64 literal", () => {
                scanLiteral("0x1ul", Literal.UInt64, 0x1n)
            })
            it("can report an invalid hex digit", () => {
                scanError("0x", "Invalid hex format")
                scanError("0x12eg", "Extra character after hex literal")
                scanError("0xFFFt", "Hex value out of range")
            })
            it("can parse an integer range", () => {
                const scanner = new Scanner("1..20")
                expect(scanner.next()).toBe(Token.Literal)
                expect(scanner.next()).toBe(Token.Symbol)
                expect(scanner.psuedo).toBe(PseudoToken.Range)
                expect(scanner.next()).toBe(Token.Literal)
                expect(scanner.next()).toBe(Token.EOF)
            })
        })
        describe("strings", () => {
            it("can scan a string literal", () => {
                scanLiteral(' "a" "abc" "adfasdf"', Literal.String, "a", "abc", "adfasdf")
            })
            it("can scan a stirng wtih escapes", () => {
                scanLiteral(' "\\r \\n \\b \\t \\\\ \\0 \\""', Literal.String, "\r \n \b \t \\ \0 \"")
            })
            it("can report an escape error", () => {
                scanError('"\\c"', "Invalid escape character")
            })
            it("can report an unterminated string", () => {
                scanError('"abc', "Unterminated string")
            })
        })
        describe("characters", () => {
            it("can scan a character literal", () => {
                scanLiteral(" 'a' '\\r' '\\n' '\\b' '\\t' '\\\\' '\\0' '\\''", Literal.Character, 
                    97, 13, 10, 8, 9, 92, 0, 39)
            })
            it("can report a character literal escape error", () => {
                scanError("'\\c'", "Invalid escape character")
            })
            it("can report a character literal form error", () => {
                scanError("'cc'", "Invalid character literal")
            })
        })
    })
})

function scanSource(source: string, ...tokens: Token[]): number {
    const scanner = new Scanner(source)
    for (const token of tokens) {
        expect(nameOfToken(scanner.next())).toBe(nameOfToken(token))
    }
    expect(nameOfToken(scanner.next())).toBe(nameOfToken(Token.EOF))
    return scanner.line
}

function scanPseudo(source: string, token: Token, ...pseudos: PseudoToken[]) {
    const scanner = new Scanner(source)
    for (const psuedo of pseudos) {
        expect(nameOfToken(scanner.next())).toBe(nameOfToken(token))
        const received = scanner.psuedo
        expect(nameOfPseudoToken(received)).toBe(nameOfPseudoToken(psuedo))
    }
}

function scanLiteral(source: string, literal: Literal, ...values: any[]) {
    const scanner = new Scanner(source)
    for (const value of values) {
        const token = scanner.next()
        expect(token).toBe(Token.Literal)
        expect(scanner.literal).toBe(literal)
        expect(scanner.value === value).toBeTrue()
    }
    expect(scanner.next()).toBe(Token.EOF)
}

function scanError(source: string, msg: string) {
    const scanner = new Scanner(source)
    const token = scanner.next()
    expect(token).toBe(Token.Invalid)
    expect(scanner.msg).toBe(msg)
}
