import { Optional } from "./ast"
import { FileBuilder } from "./files"
import { Token, PseudoToken, Literal } from "./tokens"

export class Scanner {
    private src: Uint8Array
    private decoder: TextDecoder = new TextDecoder()
    offset: number = 0
    line: number = 1
    start: number = 0
    end: number = 0
    newline: number = -1
    msg: string | undefined
    value: any
    psuedo: PseudoToken = PseudoToken.None
    literal: Literal = Literal.None
    fileBuilder: Optional<FileBuilder>

    constructor(src: Uint8Array | string, fileBuilder?: FileBuilder) {
        if (typeof src == "string") {
            const encoder = new TextEncoder()
            this.src = encoder.encode(src)
        } else {
            this.src = src
        }
        const text = this.src
        if (text.length == 0 || text[text.length - 1] != 0) {
            this.src = new Uint8Array(text.length + 1)
            this.src.set(text, 0)
            this.src[text.length] = 0
        }
        this.fileBuilder = fileBuilder
    }

    startPos(): number {
        const fb = this.fileBuilder
        const start = this.start
        return fb ? fb.pos(start) : start
    }

    endPos(): number {
        const fb = this.fileBuilder
        const end = this.end
        return fb ? fb.pos(end) : end
    }

    clone(): Scanner {
        const result = new Scanner(this.src)
        result.offset = this.offset
        result.line = this.line
        result.start = this.start
        result.end = this.end
        result.msg = this.msg
        result.psuedo = this.psuedo
        result.value = this.value
        result.literal = this.literal
        result.fileBuilder = this.fileBuilder
        return result
    }

    next(): Token {
        let start = this.start
        let offset = this.offset
        let src = this.src
        let line = this.line
        let result = Token.Invalid
        this.psuedo = PseudoToken.None
        this.literal = Literal.None
        this.end = offset
        this.value = undefined
        this.newline = -1
        loop: while(true) {
            const b = src[offset]
            start = offset
            offset++
            switch(b) {
                case 0:
                    result = Token.EOF
                    offset--
                    break loop

                // Whitespace
                case Code.space:
                case Code.tab:
                    continue
                case Code.return:
                    if (src[offset] == Code.linefeed) {
                        offset++
                    }
                    // falls through
                case Code.linefeed:
                    line++
                    const nl = offset - 1
                    this.newline = nl
                    const fb = this.fileBuilder
                    if (fb) {
                        fb.addLine(offset)
                    }
                    continue

                // Symbols
                case Code.plus:
                case Code.bar:
                case Code.dash:
                case Code.star:
                case Code.slash:
                case Code.percent:
                case Code.hat:
                case Code.bang:
                case Code.ampresand:
                case Code.gt:
                case Code.lt:
                case Code.eq:
                case Code.colon:
                case Code.question:
                    result = Token.Symbol

                    // Pseudo-symobl detection
                    switch(b) {
                        case Code.plus:
                            if (!symbolExtender(src[offset])) {
                                this.psuedo = PseudoToken.Add
                                this.value = '+'
                                break loop            
                            }
                            break
                        case Code.bar:
                            switch(src[offset]) {
                                case Code.gt:
                                    offset++
                                    result = Token.VocabEnd
                                    break loop
                                case Code.bar:
                                    if (!symbolExtender(src[offset + 1])) {
                                        offset++
                                        this.psuedo = PseudoToken.LogicalOr
                                        this.value = "||"
                                        break loop
                                    }
                                    break
                            }
                            if (!symbolExtender(src[offset])) {
                                this.psuedo = PseudoToken.Bar
                                this.value = "|"
                                break loop
                            }
                            break
                        case Code.dash:
                            if (src[offset] == Code.gt && !symbolExtender(src[offset + 1])) {
                                offset++
                                this.psuedo = PseudoToken.Arrow
                                this.value = "->"
                                break loop
                            }
                            if (!symbolExtender(src[offset])) {
                                this.psuedo = PseudoToken.Sub
                                this.value = "-"
                                break loop
                            }
                            break
                        case Code.star:
                            if (src[offset] == Code.gt && !symbolExtender(src[offset])) {
                                offset++
                                result = Token.ConstraintEnd
                                this.value = "*>"
                                break loop
                            }
                            if (!symbolExtender(src[offset])) {
                                this.psuedo = PseudoToken.Mult
                                this.value = "*"
                                break loop
                            }
                            break
                        case Code.slash:
                            if (src[offset] == Code.slash) {
                                commentLoop: while(true) {
                                    switch (src[offset++]) {
                                        case 0:
                                        case Code.linefeed:
                                        case Code.return:
                                            offset--
                                            break commentLoop                                            

                                    }
                                }
                                continue loop
                            }
                            if (!symbolExtender(src[offset])) {
                                this.psuedo = PseudoToken.Div
                                this.value = "/"
                                break loop
                            }
                            break
                        case Code.percent:
                            if (!symbolExtender(src[offset])) {
                                this.psuedo = PseudoToken.Rem
                                this.value = "%"
                                break loop
                            }
                            break
                        case Code.bang:
                            switch(src[offset]) {
                                case Code.eq:
                                    if (!symbolExtender(src[offset + 1])) {
                                        offset++
                                        this.psuedo = PseudoToken.NotEqual
                                        this.value = "!="
                                        break loop
                                    }
                                    break
                                case Code.rbrack:
                                    offset++
                                    result = Token.BangRBrack
                                    this.value = "!]"
                                    break loop
                                case Code.rbrace:
                                    offset++
                                    result = Token.BangRBrace
                                    this.value = "!}"
                                    break loop
                                case Code.gt:
                                    if (!symbolExtender(src[offset + 1])) {
                                        offset++
                                        this.psuedo = PseudoToken.BangGreaterThan
                                        this.value = "!>"
                                        break loop
                                    }
                                    break
                            }
                            if (!symbolExtender(src[offset])) {
                                this.psuedo = PseudoToken.Not
                                this.value = "!"
                                break loop
                            }
                            break
                        case Code.ampresand:
                            if (src[offset] == Code.ampresand && !symbolExtender(src[offset + 1])) {
                                offset++
                                this.psuedo = PseudoToken.LogicalAnd
                                this.value = "&&"
                                break loop
                            }
                            if (!symbolExtender(src[offset])) {
                                this.psuedo = PseudoToken.And
                                this.value = "&"
                                break loop
                            }
                            break
                        case Code.lt:
                            switch (src[offset]) {
                                case Code.eq:
                                    if (!symbolExtender(src[offset + 1])) {
                                        offset++
                                        this.psuedo = PseudoToken.LessThanEqual
                                        this.value = "<="
                                        break loop
                                    }
                                    break
                                case Code.bang:
                                    if (!symbolExtender(src[offset + 1])) {
                                        offset++
                                        this.psuedo = PseudoToken.LessThanBang
                                        this.value = "<!"
                                        break loop
                                    }
                                case Code.bar:
                                    offset++
                                    result = Token.VocabStart
                                    this.value = "<|"
                                    break loop
                                case Code.star:
                                    offset++
                                    result = Token.ConstraintStart
                                    this.value = "<*"
                                    break loop
                            }
                            if (!symbolExtender(src[offset])) {
                                this.psuedo = PseudoToken.LessThan
                                this.value = "<"
                                break loop
                            }
                            break
                        case Code.gt:
                            if (src[offset] == Code.eq && !symbolExtender(src[offset + 1])) {
                                offset++
                                this.psuedo = PseudoToken.GreaterThanEqual
                                this.value = ">="
                                break loop
                            }
                            if (!symbolExtender(src[offset])) {
                                this.psuedo = PseudoToken.GreaterThan
                                this.value = ">"
                                break loop
                            }
                            break
                        case Code.eq:
                            if (src[offset] == Code.eq && !symbolExtender(src[offset + 1])) {
                                offset++
                                this.psuedo = PseudoToken.DoubleEqual
                                this.value = "=="
                                break loop
                            }
                            if (!symbolExtender(src[offset])) {
                                this.psuedo = PseudoToken.Equal
                                this.value = "="
                                break loop
                            }
                            break
                        case Code.colon:
                            if (src[offset] == Code.colon && !symbolExtender(src[offset + 1])) {
                                offset++
                                result = Token.Scope
                                this.value = "::"
                                break loop
                            }
                            if (!symbolExtender(src[offset])) {
                                result = Token.Colon
                                this.value = ":"
                                break loop
                            }
                            break
                        case Code.question:
                            if (!symbolExtender(src[offset])) {
                                this.psuedo = PseudoToken.Question
                                this.value = "?"
                                break loop
                            }
                            break
                    }
                    // intentional fall-through to symbol loop
                    
                    case Code.dash:
                    case Code.at:
                    case Code.sharp:
                    case Code.dollar:
                    case Code.hat:
                        symbolLoop: while(true) {
                            const last = offset
                            let b = src[offset++]
                            switch(b) {
                                default:
                                    offset = last
                                    break symbolLoop
                                case Code.tilde:
                                case Code.bang:
                                case Code.at:
                                case Code.dollar:
                                case Code.percent:
                                case Code.hat:
                                case Code.ampresand:
                                case Code.dash:
                                case Code.under:
                                case Code.plus:
                                case Code.eq:
                                case Code.slash:
                                case Code.question:
                                case Code.bar:
                                case Code.colon:
                                case Code.sharp:
                                    continue
                            }
                            break
                            /* c8 ignore next */
                        }
                        result = Token.Symbol
                        this.value = this.decoder.decode(src.slice(start, offset))
                        break loop
                    case Code.comma:
                        result = Token.Comma
                        this.value = ","
                        break loop
                    case Code.semicolon:
                        result = Token.Semi
                        this.value = ":"
                        break loop
                    case Code.lbrace:
                        if (src[offset] == Code.bang) {
                            offset++
                            result = Token.LBraceBang
                            this.value = "{!"
                            break loop
                        }
                        result = Token.LBrace
                        this.value = "{"
                        break loop
                    case Code.rbrace:
                        result = Token.RBrace
                        this.value = "}"
                        break loop
                    case Code.lbrack:
                        if (src[offset] == Code.bang) {
                            offset++
                            result = Token.LBrackBang
                            this.value = "!]"
                            break loop
                        }
                        result = Token.LBrack
                        this.value = "["
                        break loop
                    case Code.rbrack:
                        result = Token.RBrack
                        this.value = "]"
                        break loop
                    case Code.lparen:
                        result = Token.LParen
                        this.value = "("
                        break loop
                    case Code.rparen:
                        result = Token.RParen
                        this.value = ")"
                        break loop
                    case Code.dot:
                        if (src[offset] == Code.dot) {
                            if (src[offset + 1] == Code.dot) {
                                offset += 2
                                result = Token.Symbol
                                this.psuedo = PseudoToken.Spread
                                this.value = "..."
                                break loop
                            }
                            offset++
                            result = Token.Symbol
                            this.psuedo = PseudoToken.Range
                            this.value = ".."
                            break loop
                        }
                        result = Token.Dot
                        this.value = "."
                        break loop
                    
                    // Reserved words, psuedo-reserved words and identifiers
                    case Code.a:
                    case Code.b:
                    case Code.c:
                    case Code.e:
                    case Code.f:
                    case Code.i:
                    case Code.l:
                    case Code.o:
                    case Code.p:
                    case Code.t:
                    case Code.r:
                    case Code.v:
                    case Code.w:
                    case Code.T:
                        result = Token.Identifier
                        switch(b) {
                            case Code.a:
                                // after
                                if (src[offset + 0] == Code.f && 
                                    src[offset + 1] == Code.t &&
                                    src[offset + 2] == Code.e &&
                                    src[offset + 3] == Code.r &&
                                    !identExtender(src[offset + 4])) {
                                    offset += 4
                                    this.psuedo = PseudoToken.After
                                    this.value = "after"
                                    break loop
                                }
                                break
                            case Code.b:
                                switch (src[offset]) {
                                    case Code.e:
                                        // before
                                        if (src[offset + 1] == Code.f &&
                                            src[offset + 2] == Code.o &&
                                            src[offset + 3] == Code.r &&
                                            src[offset + 4] == Code.e &&
                                            !identExtender(src[offset + 5])) {
                                            offset += 5
                                            this.psuedo = PseudoToken.Before
                                            this.value = "before"
                                            break loop
                                        }
                                        break
                                    case Code.r:
                                        // break
                                        if (src[offset + 1] == Code.e &&
                                            src[offset + 2] == Code.a &&
                                            src[offset + 3] == Code.k &&
                                            !identExtender(src[offset + 4])) {
                                            offset += 4
                                            this.psuedo = PseudoToken.Break
                                            this.value = "break"
                                            break loop
                                        }
                                        break
                                }
                                break
                            case Code.c:
                                // continue
                                if (src[offset + 0] == Code.o && 
                                    src[offset + 1] == Code.n &&
                                    src[offset + 2] == Code.t &&
                                    src[offset + 3] == Code.i &&
                                    src[offset + 4] == Code.n &&
                                    src[offset + 5] == Code.u &&
                                    src[offset + 6] == Code.e &&
                                    !identExtender(src[offset + 7])) {
                                    offset += 7
                                    this.psuedo = PseudoToken.Continue
                                    this.value = "continue"
                                    break loop
                                }
                                break
                            case Code.e:
                                // else
                                if (src[offset + 0] == Code.l &&
                                    src[offset + 1] == Code.s &&
                                    src[offset + 2] == Code.e &&
                                    !identExtender(src[offset + 3])) {
                                    offset += 3
                                    this.psuedo = PseudoToken.Else
                                    this.value = "else"
                                    break loop
                                }
                                break
                            case Code.f:
                                // false
                                if (src[offset + 0] == Code.a &&
                                    src[offset + 1] == Code.l &&
                                    src[offset + 2] == Code.s &&
                                    src[offset + 3] == Code.e &&
                                    !identExtender(src[offset + 4])) {
                                    offset += 4
                                    result = Token.False
                                    this.value = "false"
                                    break loop
                                }
                                break
                            case Code.i:
                                switch(src[offset]) {
                                    case Code.d:
                                        // identifiers
                                        if (src[offset + 1] == Code.e &&
                                            src[offset + 2] == Code.n &&
                                            src[offset + 3] == Code.t &&
                                            src[offset + 4] == Code.i &&
                                            src[offset + 5] == Code.f &&
                                            src[offset + 6] == Code.i &&
                                            src[offset + 7] == Code.e &&
                                            src[offset + 8] == Code.r &&
                                            src[offset + 9] == Code.s &&
                                            !identExtender(src[offset + 10])) {
                                            offset += 10
                                            this.psuedo = PseudoToken.Identifiers
                                            this.value = "identifiers"
                                            break loop
                                        }
                                        break
                                    case Code.f:
                                        // if
                                        if (!identExtender(src[offset + 1])) {
                                            offset++
                                            this.psuedo = PseudoToken.If
                                            this.value = "if"
                                            break loop
                                        }
                                        break
                                    case Code.n:
                                        // infix
                                        if (src[offset + 1] == Code.f &&
                                            src[offset + 2] == Code.i &&
                                            src[offset + 3] == Code.x &&
                                            !identExtender(src[offset + 4])) {
                                            offset += 4
                                            this.psuedo = PseudoToken.Infix
                                            this.value = "infix"
                                            break loop
                                        }
                                        break
                                }
                                break
                            case Code.l:
                                switch(src[offset]) {
                                    case Code.e:
                                        switch(src[offset + 1]) {
                                            case Code.f:
                                                // left
                                                if (src[offset + 2] == Code.t &&
                                                    !identExtender(src[offset + 3])) {
                                                    offset += 3
                                                    this.psuedo = PseudoToken.Left
                                                    this.value = "left"
                                                    break loop
                                                }
                                                break
                                            case Code.t:
                                                // let
                                                if (!identExtender(src[offset + 2])) {
                                                    offset += 2
                                                    result = Token.Let
                                                    this.value = "let"
                                                    break loop
                                                }
                                                break
                                        }
                                        break
                                    case Code.o:
                                        // loop
                                        if (src[offset + 1] == Code.o &&
                                            src[offset + 2] == Code.p &&
                                            !identExtender(src[offset + 3])) {
                                            offset += 3
                                            this.psuedo = PseudoToken.Loop
                                            this.value = "loop"
                                            break loop
                                        }
                                        break
                                }
                                break
                            case Code.o:
                                // operator
                                if (src[offset + 0] == Code.p &&
                                    src[offset + 1] == Code.e &&
                                    src[offset + 2] == Code.r &&
                                    src[offset + 3] == Code.a &&
                                    src[offset + 4] == Code.t &&
                                    src[offset + 5] == Code.o &&
                                    src[offset + 6] == Code.r &&
                                    !identExtender(src[offset + 7])) {
                                    offset += 7
                                    this.psuedo = PseudoToken.Operator
                                    this.value = "operator"
                                    break loop
                                }
                                break
                            case Code.p:
                                switch (src[offset]) {
                                    case Code.o:
                                        // postfix
                                        if (src[offset + 1] == Code.s &&
                                            src[offset + 2] == Code.t &&
                                            src[offset + 3] == Code.f &&
                                            src[offset + 4] == Code.i &&
                                            src[offset + 5] == Code.x &&
                                            !identExtender(src[offset + 6])) {
                                            offset += 6
                                            this.psuedo = PseudoToken.Postfix
                                            this.value = "postfix"
                                            break loop
                                        }
                                        break
                                    case Code.r:
                                        // prefix
                                        if (src[offset + 1] == Code.e &&
                                            src[offset + 2] == Code.f &&
                                            src[offset + 3] == Code.i &&
                                            src[offset + 4] == Code.x &&
                                            !identExtender(src[offset + 5])) {
                                            offset += 5
                                            this.psuedo = PseudoToken.Prefix
                                            this.value = "prefix"
                                            break loop
                                        }
                                        break
                                }
                                break
                            case Code.t:
                                switch(src[offset]) {
                                    case Code.h:
                                        // this
                                        if (src[offset + 1] == Code.i &&
                                            src[offset + 2] == Code.s &&
                                            !identExtender(src[offset + 3])) {
                                            offset += 3
                                            this.psuedo = PseudoToken.This
                                            this.value = "this"
                                            break loop
                                        }
                                        break
                                    case Code.r:
                                    // true
                                        if (src[offset + 1] == Code.u &&
                                            src[offset + 2] == Code.e &&
                                            !identExtender(src[offset + 3])) {
                                            offset += 3
                                            result = Token.True
                                            this.value = "true"
                                            break loop
                                        }
                                        break
                                }
                                break
                            case Code.r:
                                switch (src[offset]) {
                                    case Code.e:
                                        // return
                                        if (src[offset + 1] == Code.t &&
                                            src[offset + 2] == Code.u &&
                                            src[offset + 3] == Code.r &&
                                            src[offset + 4] == Code.n &&
                                            !identExtender(src[offset + 5])) {
                                            offset += 5
                                            result = Token.Return
                                            this.value = "return"
                                            break loop
                                        }
                                        break
                                    case Code.i:
                                        // right
                                        if (src[offset + 1] == Code.g &&
                                            src[offset + 2] == Code.h &&
                                            src[offset + 3] == Code.t &&
                                            !identExtender(src[offset + 4])) {
                                            offset += 4
                                            this.psuedo = PseudoToken.Right
                                            this.value = "right"
                                            break loop
                                        }
                                        break
                                }
                                break
                            case Code.v:
                                switch (src[offset]) {
                                    case Code.a:
                                        switch(src[offset + 1]) {
                                            case Code.r:
                                                // var
                                                if (!identExtender(src[offset + 2])) {
                                                    offset += 2
                                                    result = Token.Var
                                                    this.value = "var"
                                                    break loop
                                                }
                                                break
                                            case Code.l:
                                                // val
                                                if (!identExtender(src[offset + 2])) {
                                                    offset += 2
                                                    result = Token.Val
                                                    this.value = "val"
                                                    break loop
                                                }
                                                break
                                        }
                                        break
                                }
                                break
                            case Code.w:
                                switch (src[offset]) {
                                    case Code.h:
                                        switch (src[offset + 1]) {
                                            case Code.e:
                                                switch (src[offset + 2]) {
                                                    case Code.n:
                                                        // when
                                                        if (!identExtender(src[offset + 3])) {
                                                            offset += 3
                                                            this.psuedo = PseudoToken.When
                                                            this.value = "when"
                                                            break loop
                                                        }
                                                        break
                                                    case Code.r:
                                                        // where
                                                        if (src[offset + 3] == Code.e &&
                                                            !identExtender(src[offset + 4])) {
                                                            offset += 4
                                                            this.psuedo = PseudoToken.Where
                                                            this.value = "where"
                                                            break loop
                                                        }
                                                        break
                                                }
                                                break
                                            case Code.i:
                                                // while
                                                if (src[offset + 2] == Code.l &&
                                                    src[offset + 3] == Code.e &&
                                                    !identExtender(src[offset + 4])) {
                                                    offset += 4
                                                    this.psuedo = PseudoToken.While
                                                    this.value = "while"
                                                    break loop
                                                }
                                                break
                                        }
                                        break
                                }
                                break
                            case Code.T:
                                // This
                                if (src[offset + 0] == Code.h &&
                                    src[offset + 1] == Code.i &&
                                    src[offset + 2] == Code.s &&
                                    !identExtender(src[offset + 3])) {
                                    offset += 3
                                    this.psuedo = PseudoToken.ThisType
                                    this.value = "This"
                                    break loop
                                }
                                break
                        }
                        // falls throught

                    // Identifiers
                    case Code.d:
                    case Code.g:
                    case Code.h:
                    case Code.j:
                    case Code.k:
                    case Code.m:
                    case Code.n:
                    case Code.q:
                    case Code.s:
                    case Code.u:
                    case Code.x:
                    case Code.y:
                    case Code.z:
                    case Code.A:
                    case Code.B:
                    case Code.C:
                    case Code.D:
                    case Code.E:
                    case Code.F:
                    case Code.G:
                    case Code.H:
                    case Code.I:
                    case Code.J:
                    case Code.K:
                    case Code.L:
                    case Code.M:
                    case Code.N:
                    case Code.O:
                    case Code.P:
                    case Code.Q:
                    case Code.R:
                    case Code.S:
                    case Code.T:
                    case Code.U:
                    case Code.V:
                    case Code.W:
                    case Code.X:
                    case Code.Y:
                    case Code.Z:
                    case Code.under:
                        // identifier
                        identifierLoop: while (true) {
                            const last = offset
                            const b = src[offset]
                            offset++
                            switch (b) {
                                default:
                                    offset = last
                                    break identifierLoop
                                case Code.a:
                                case Code.b:
                                case Code.c:
                                case Code.d:
                                case Code.e:
                                case Code.f:
                                case Code.g:
                                case Code.h:
                                case Code.i:
                                case Code.j:
                                case Code.k:
                                case Code.l:
                                case Code.m:
                                case Code.n:
                                case Code.o:
                                case Code.p:
                                case Code.q:
                                case Code.r:
                                case Code.s:
                                case Code.t:
                                case Code.u:
                                case Code.v:
                                case Code.w:
                                case Code.x:
                                case Code.y:
                                case Code.z:
                                case Code.A:
                                case Code.B:
                                case Code.C:
                                case Code.D:
                                case Code.E:
                                case Code.F:
                                case Code.G:
                                case Code.H:
                                case Code.I:
                                case Code.J:
                                case Code.K:
                                case Code.L:
                                case Code.M:
                                case Code.N:
                                case Code.O:
                                case Code.P:
                                case Code.Q:
                                case Code.R:
                                case Code.S:
                                case Code.T:
                                case Code.U:
                                case Code.V:
                                case Code.W:
                                case Code.X:
                                case Code.Y:
                                case Code.Z:
                                case Code.under:
                                case Code.digit_0:
                                case Code.digit_1:
                                case Code.digit_2:
                                case Code.digit_3:
                                case Code.digit_4:
                                case Code.digit_5:
                                case Code.digit_6:
                                case Code.digit_7:
                                case Code.digit_8:
                                case Code.digit_9:
                                    continue
                            }
                        }
                        result = Token.Identifier
                        this.value = this.decoder.decode(src.slice(start, offset))
                        break loop

                    // numbers
                    case Code.digit_0:
                        if (src[offset] == Code.x) {
                            // Hex
                            offset++
                            const first = offset
                            let value = BigInt(0)
                            hexLoop: while (true) {
                                const last = offset
                                const b = src[offset++]
                                switch (b) {
                                    default:
                                        offset = last
                                        break hexLoop
                                    case Code.digit_0:
                                    case Code.digit_1:
                                    case Code.digit_2:
                                    case Code.digit_3:
                                    case Code.digit_4:
                                    case Code.digit_5:
                                    case Code.digit_6:
                                    case Code.digit_7:
                                    case Code.digit_8:
                                    case Code.digit_9:
                                        value = value * 16n + BigInt(b - Code.digit_0)
                                        continue
                                    case Code.a:
                                    case Code.b:
                                    case Code.c:
                                    case Code.d:
                                    case Code.e:
                                    case Code.f:
                                        value = value * 16n + BigInt(b - Code.a + 10)
                                        continue
                                    case Code.A:
                                    case Code.B:
                                    case Code.C:
                                    case Code.D:
                                    case Code.E:
                                    case Code.F:
                                        value = value * 16n + BigInt(b - Code.A + 10)
                                        continue
                                }
                            }
                            if (offset == first) {
                                this.msg = "Invalid hex format"
                                result = Token.Invalid
                                break loop
                            }
                            result = Token.Literal
                            let clamp = 32
                            let unsigned = false
                            switch(src[offset]) {
                                default:
                                    this.literal = Literal.Int32
                                    break
                                case Code.u:
                                    offset++
                                    unsigned = true
                                    switch (src[offset]) {
                                        default:
                                            this.literal = Literal.UInt32
                                            break
                                        case Code.t:
                                            offset++
                                            this.literal = Literal.UInt8
                                            clamp = 8
                                            break
                                        case Code.s:
                                            offset++
                                            this.literal = Literal.UInt16
                                            clamp = 16
                                            break
                                        case Code.l:
                                            offset++
                                            this.literal = Literal.UInt64
                                            clamp = 64
                                            break
                                    }
                                    break
                                case Code.t:
                                    offset++
                                    this.literal = Literal.Int8
                                    clamp = 8
                                    break
                                case Code.s:
                                    offset++
                                    this.literal = Literal.Int16
                                    clamp = 16
                                    break
                                case Code.l:
                                    offset++
                                    this.literal = Literal.Int64
                                    clamp = 64
                                    break
                            }
                            if (identExtender(src[offset])) {
                                result = Token.Invalid
                                this.msg = "Extra character after hex literal"
                                break loop
                            }
                            let clampedValue: BigInt
                            if (unsigned) {
                                clampedValue = BigInt.asUintN(clamp, value)
                            } else {
                                clampedValue = BigInt.asIntN(clamp, value)
                            }
                            if (clampedValue != value) {
                                result = Token.Invalid
                                this.msg = "Hex value out of range"
                            }
                            this.value = value
                            break loop
                        }
                        // falls through
                    case Code.digit_1:
                    case Code.digit_2:
                    case Code.digit_3:
                    case Code.digit_4:
                    case Code.digit_5:
                    case Code.digit_6:
                    case Code.digit_7:
                    case Code.digit_8:
                    case Code.digit_9:
                        let value = BigInt(b - Code.digit_0)
                        let isFloat = false
                        numberLoop: while(true) {
                            const last = offset
                            const b = src[offset]
                            offset++
                            switch(b) {
                                default:
                                    offset = last
                                    break numberLoop
                                case Code.digit_0:
                                case Code.digit_1:
                                case Code.digit_2:
                                case Code.digit_3:
                                case Code.digit_4:
                                case Code.digit_5:
                                case Code.digit_6:
                                case Code.digit_7:
                                case Code.digit_8:
                                case Code.digit_9:
                                    if (!isFloat) {
                                        value = value * 10n  + BigInt(b - Code.digit_0)
                                    }
                                    continue
                                case Code.dot:
                                    if (src[offset] == Code.dot) {
                                        offset--
                                        break numberLoop
                                    }
                                    isFloat = true
                                    continue
                            }
                            break
                            /* c8 ignore next */
                        }
                        switch (src[offset]) {
                            case Code.f:
                            case Code.d:
                                isFloat = true
                                break
                        }
                        if (!isFloat) {
                            result = Token.Literal
                            let clamp = 32
                            let unsigned = false
                            switch(src[offset]) {
                                default:
                                    this.literal = Literal.Int32
                                    break
                                case Code.u:
                                    offset++
                                    unsigned = true
                                    switch (src[offset]) {
                                        default:
                                            this.literal = Literal.UInt32
                                            break
                                        case Code.t:
                                            offset++
                                            this.literal = Literal.UInt8
                                            clamp = 8
                                            break
                                        case Code.s:
                                            offset++
                                            this.literal = Literal.UInt16
                                            clamp = 16
                                            break
                                        case Code.l:
                                            offset++
                                            this.literal = Literal.UInt64
                                            clamp = 64
                                            break
                                    }
                                    break
                                case Code.t:
                                    offset++
                                    this.literal = Literal.Int8
                                    clamp = 8
                                    break
                                case Code.s:
                                    offset++
                                    this.literal = Literal.Int16
                                    clamp = 16
                                    break
                                case Code.l:
                                    offset++
                                    this.literal = Literal.Int64
                                    clamp = 64
                                    break
                            }
                            if (identExtender(src[offset])) {
                                result = Token.Invalid
                                this.msg = "Extra character after numeric literal"
                                break loop
                            }
                            let clampedValue: BigInt
                            if (unsigned) {
                                clampedValue = BigInt.asUintN(clamp, value)
                            } else {
                                clampedValue = BigInt.asIntN(clamp, value)
                            }
                            if (clampedValue != value) {
                                result = Token.Invalid
                                this.msg = "Integer value out of range"
                            }
                            this.value = value
                            break loop
                        }
                        const fvalue = parseFloat(this.decoder.decode(src.slice(start, offset)))
                        if (fvalue == NaN) {
                            result = Token.Invalid
                            this.msg = "Invalid floating point constant"
                            break loop
                        } 
                        switch (src[offset]) {
                            case Code.d:
                                offset++
                                // fall through
                            default:
                                this.literal = Literal.Float64
                                break
                            case Code.f:
                                offset++
                                this.literal = Literal.Flaot32
                                break
                        }
                        if (identExtender(src[offset])) {
                            result = Token.Invalid
                            this.msg = "Unexpected character after floating point literal"
                            break loop
                        }
                        this.value = fvalue
                        result = Token.Literal
                        break loop
                    case Code.singlequote: 
                        let cvalue = 0
                        const c = src[offset]
                        offset++
                        switch (c) {
                            case Code.backslash:
                                switch(src[offset++]) {
                                    case Code.digit_0:
                                        break
                                    case Code.n:
                                        cvalue = Code.linefeed
                                        break
                                    case Code.r:
                                        cvalue = Code.return
                                        break
                                    case Code.b:
                                        cvalue = Code.backspace
                                        break
                                    case Code.t:
                                        cvalue = Code.tab
                                        break
                                    case Code.singlequote:
                                        cvalue = Code.singlequote
                                        break
                                    case Code.backslash:
                                        cvalue = Code.backslash
                                        break
                                    default:
                                        result = Token.Invalid
                                        this.msg = "Invalid escape character"
                                        break loop
                                }
                                break
                            default:
                                cvalue = c
                                break
                        }
                        if (src[offset] != Code.singlequote) {
                            result = Token.Invalid
                            this.msg = "Invalid character literal"
                            break loop
                        }
                        offset++
                        result = Token.Literal
                        this.literal = Literal.Character
                        this.value = cvalue
                        break loop
                    
                    case Code.backtick:
                        const identifierCopyFrom = start + 1
                        quotedLiteralLoop: while (true) {
                            switch(src[offset++]) {
                                case Code.linefeed:
                                case Code.return:
                                case Code.backslash:
                                case 0:
                                    result = Token.Invalid
                                    this.msg = "Invalid character in quoted literal"
                                    break loop
                                case Code.backtick:
                                    break quotedLiteralLoop
                            }
                        }
                        result = Token.Identifier
                        this.value = this.decoder.decode(src.slice(identifierCopyFrom, offset - 1))
                        this.psuedo = PseudoToken.Escaped
                        break loop

                    case Code.doublequote:
                        let stringCopyFrom = start + 1
                        let stringValue = ""
                        result = Token.Literal
                        this.literal = Literal.String
                        stringLoop: while(true) {
                            const b = src[offset++]
                            switch (b) {
                                case Code.backslash:
                                    stringValue += this.decoder.decode(src.slice(stringCopyFrom, offset - 1))
                                    switch (src[offset++]) {
                                        case Code.digit_0:
                                            stringValue += "\0"
                                            break
                                        case Code.n:
                                            stringValue += "\n"
                                            break
                                        case Code.r:
                                            stringValue += "\r"
                                            break
                                        case Code.b:
                                            stringValue += "\b"
                                            break
                                        case Code.t:
                                            stringValue += "\t"
                                            break
                                        case Code.doublequote:
                                            stringValue += "\""
                                            break
                                        case Code.backslash:
                                            stringValue += "\\"
                                            break
                                        default:
                                            result = Token.Invalid
                                            this.msg = "Invalid escape character"
                                            break
                                    }
                                    stringCopyFrom = offset
                                    continue
                                case Code.doublequote:
                                    break stringLoop
                                case 0:
                                case Code.linefeed:
                                case Code.return:
                                    result = Token.Invalid
                                    this.msg = "Unterminated string"
                                    break loop
                            }                        
                        }
                        stringValue += this.decoder.decode(src.slice(stringCopyFrom, offset - 1))
                        this.value = stringValue
                        break loop

                    default:
                        result = Token.Invalid
                        this.msg = "Unknown character"
                        break loop 
            }

            /* c8 ignore next */
            break
            /* c8 ignore next */
        }

        this.offset = offset
        this.start = start
        this.line = line

        return result
    }
}

const enum Code {
    a = 97,
    b = 98,
    c = 99,
    d = 100,
    e = 101,
    f = 102,
    g = 103,
    h = 104,
    i = 105,
    j = 106,
    k = 107,
    l = 108,
    m = 109,
    n = 110,
    o = 111,
    p = 112,
    q = 113,
    r = 114,
    s = 115,
    t = 116,
    u = 117,
    v = 118,
    w = 119,
    x = 120,
    y = 121,
    z = 122,
    A = 65,
    B = 66,
    C = 67,
    D = 68,
    E = 69,
    F = 70,
    G = 71,
    H = 72,
    I = 73,
    J = 74,
    K = 75,
    L = 76,
    M = 77,
    N = 78,
    O = 79,
    P = 80,
    Q = 81,
    R = 82,
    S = 83,
    T = 84,
    U = 85,
    V = 86,
    W = 87,
    X = 88,
    Y = 89,
    Z = 90,
    digit_0 = 48,
    digit_1 = 49,
    digit_2 = 50,
    digit_3 = 51,
    digit_4 = 52,
    digit_5 = 53,
    digit_6 = 54,
    digit_7 = 55,
    digit_8 = 56,
    digit_9 = 57,
    dollar = 36,
    under = 95,
    tilde = 126,
    bang = 33,
    at = 64,
    sharp = 35,
    percent = 37,
    hat = 124,
    ampresand = 38,
    dash = 45,
    plus = 43,
    equal = 51,
    slash = 47,
    question = 63,
    bar = 124,
    colon = 58,
    space = 32,
    tab = 9,
    
    return = 13,
    linefeed = 10,
    star = 42,
    gt = 62,
    lt = 60,
    eq = 61,
    lbrack = 91,
    rbrack = 93,
    lbrace = 123,
    rbrace = 125,
    comma = 44,
    semicolon = 59,
    lparen = 40,
    rparen = 41,
    dot = 46,
    singlequote = 39,
    doublequote = 34,
    backslash = 92,
    backspace = 8,
    backtick = 96,    
}

function identExtender(n: number): Boolean {
    return (n >= Code.a && n <= Code.z) || (n >= Code.A && n <= Code.Z) || (n >= Code.digit_0 && n <= Code.digit_9) ||
        n === Code.dollar || n === Code.under
}

function symbolExtender(n: number): Boolean {
    switch (n) {
        case Code.tilde:
        case Code.bang:
        case Code.at:
        case Code.sharp:
        case Code.percent:
        case Code.hat:
        case Code.ampresand:
        case Code.dash:
        case Code.plus:
        case Code.equal:
        case Code.slash:
        case Code.question:
        case Code.bar:
        case Code.sharp:
            return true
    }
    return false
}

