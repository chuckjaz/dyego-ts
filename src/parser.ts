import { Scanner } from "./scanner";
import { PseudoToken, Token, nameOfToken, nameOfPseudoToken } from "./tokens"

export function parse(scanner: Scanner) {
    let current = scanner.next()
    let pseudo = scanner.psuedo
    let excluded: boolean[] = []

    const result = sequence()
    expect(Token.EOF)
    return result

    function sequence() {
        return list(sequencePart)
    }

    function sequencePart(): void | null {
        switch (current) {
            case Token.Identifier:
                switch (pseudo) {
                    case PseudoToken.Break:
                        return breakStatement()
                    case PseudoToken.Continue:
                        return continueStatement()
                    case PseudoToken.Loop:
                        return loopStatement()
                    case PseudoToken.While:
                        return whileStatement()
                }
                return expression()
            case Token.Symbol:
                switch (pseudo) {
                    case PseudoToken.Spread:
                        return sequenceSpread()
                    case PseudoToken.LessThan:
                        return typeLiteral()
                }
                return expression()
            case Token.Literal:
            case Token.True:
            case Token.False:
            case Token.LBrace:
            case Token.LParen:
            case Token.LBrack:
            case Token.LBrackBang:
            case Token.LBraceBang:
                return expression()
            case Token.Val:
            case Token.Var:
            case Token.Let:
                return declaration()
            case Token.Return:
                return returnStatement()
        }
        return null
    }

    function breakStatement() {
        expectPseudo(PseudoToken.Break)
        optionalName()
    }

    function continueStatement() {
        expectPseudo(PseudoToken.Continue)
        optionalName()
    }

    function loopStatement() {
        expectPseudo(PseudoToken.Loop)
        optionalName()
        block()
    }

    function whileStatement() {
        expectPseudo(PseudoToken.While)
        optionalName()
        parenDelimited(expression)
        block()
    }

    function returnStatement() {
        expect(Token.Return)
        optionalExpression()
    }

    function sequenceSpread() {
        expectPseudo(PseudoToken.Spread)
        if (current == Token.VocabStart) {
            return vocabularyLiteral()
        }
        return importReference()
    }

    function vocabularyLiteral() {
        expect(Token.VocabStart)
        list(vocabularyMember)
        expect(Token.VocabEnd)
    }

    function importReference() {
        name()
        while (current == Token.Scope) {
            next()
            name()
        }
    }

    function vocabularyMember() {
        if (current == Token.VocabEnd) return null
        if (pseudo == PseudoToken.Spread) return vocabularySpread()
        return vocabularyOperatorDeclaration()
    }

    function vocabularyOperatorDeclaration() {
        switch (pseudo) {
            case PseudoToken.Prefix:
            case PseudoToken.Infix:
            case PseudoToken.Postfix:
                pseudo = 0 // intentional because of over narrowing of pseudo
                next()
                break
            default:
                report("Expected an operator placement (prefix, infix or postfix)")
        }
        expectPseudo(PseudoToken.Operator)
        vocabularyNames()
        switch(pseudo) {
            case PseudoToken.Before:
            case PseudoToken.After:
                vocabularyPrecedence()
                break
        }
        switch (pseudo) {
            case PseudoToken.Left:
            case PseudoToken.Right:
                next()
                break
        }
    }

    function vocabularySpread() {
        expectPseudo(PseudoToken.Spread)
        vocabularyReference()
    }

    function vocabularyReference() {
        name()
        while (current == Token.Dot) {
            next()
            name()
        }
    }

    function vocabularyNames() {
        switch (pseudo) {
        case PseudoToken.Identifiers:
            return next()
        }
        switch (current) {
            case Token.Identifier:
                return next()
            case Token.LParen:
                return parenDelimited(() => list(name))
        }
        report("Expected name or names of the operator")
    }

    function vocabularyPrecedence() {
        switch (pseudo) {
            case PseudoToken.Before:
            case PseudoToken.After:
                pseudo = 0
                next()
                break
            // cannot be called without it being before or after
            // default:
            //     report("Expected before or after")
        }
        switch (pseudo) {
            case PseudoToken.Prefix:
            case PseudoToken.Infix:
            case PseudoToken.Postfix:
                next()
                break
        }
        name()
    }

    function typeLiteral() {
        expectPseudo(PseudoToken.LessThan)
        optional(() => {
            list(formalTypeParameter)
            expectPseudo(PseudoToken.Arrow)
        })
        list(typeLiteralMember)
        expectPseudo(PseudoToken.GreaterThan)
    }

    function formalTypeParameter() {
        name()
        expect(Token.Colon)
        typeReference()
    }

    function typeReference() {
        typeOrReference()
        while (pseudo == PseudoToken.And) {
            next()
            typeOrReference()
        }
    }

    function typeOrReference() {
        simpleTypeReference()
        while (pseudo == PseudoToken.Bar) {
            next()
            simpleTypeReference()
        }
    }

    function simpleTypeReference() {
        typePrimitiveReference()
        while (current == Token.LBrack) {
            next()
            expect(Token.RBrack)
        }
        if (pseudo == PseudoToken.Question) {
            next()
        }
    }

    function typePrimitiveReference() {
        if (pseudo == PseudoToken.ThisType) {
            return next()
        }
        switch (current) {
            case Token.Identifier:
                reference()
                if (pseudo == PseudoToken.LessThan) {
                    pseudoDelimited(PseudoToken.LessThan, PseudoToken.GreaterThan, typeReference)
                }
                return
            case Token.LParen:
                return parenDelimited(typeReference)
        }
        report("Expected a type name")
    }

    function typeLiteralMember() {
        switch (current) {
            case Token.Let:
            case Token.Var:
            case Token.Val:
                return declaration()
        }
        if (pseudo == PseudoToken.Spread) {
            next()
            return typeReference()
        }
        return null
    }

    function name() {
        expect(Token.Identifier)
    }

    function optionalName() {
        if (current == Token.Identifier) {
            name()
        }
    }

    function block() {
        expect(Token.LBrace)
        sequence()
        expect(Token.RBrace)
    }

    function delimitedExpression() {
        expect(Token.LParen)
        expression()
        expect(Token.RParen)
    }

    function expression() {
        while (expressionStart())
            simpleExpression()
    }

    function simpleExpression() {
        primitiveExpression()
        simpleLoop: while (true) {
            switch(current) {
                case Token.Dot:
                    selector()
                    break
                case Token.LBrace:
                    lambda()
                    break
                case Token.LParen:
                    call()
                    break
                case Token.Symbol:
                    if (pseudo == PseudoToken.LessThan) {
                        const callResult = optional(() => { call() })
                        if (callResult !== null)
                            break
                    }
                    // fall through
                default:
                    break simpleLoop
            }
        }
    }

    function selector() {
        expect(Token.Dot)
        name()
    }

    function lambda() {
        expect(Token.LBrace)
        optional(() => {
            list(formalParameter)
            expectPseudo(PseudoToken.Arrow)
        })
        sequence()
        expect(Token.RBrace)
    }

    function formalParameter() {
        name()
        if (current == Token.Colon) {
            next()
            typeReference()
        }
    }

    function call() {
        if (pseudo == PseudoToken.LessThan) {
            expectPseudo(PseudoToken.LessThan)
            list(formalTypeParameter)
            expectPseudo(PseudoToken.GreaterThan)
        }
        expect(Token.LParen)
        while (expressionStart() || current == Token.Colon || pseudo == PseudoToken.Spread) {
            argument()
        }
        expect(Token.RParen)
    }

    function argument() {
        switch (current) {
            case Token.Identifier:
                name()
                break
            case Token.Symbol:
                if (pseudo == PseudoToken.Spread) {
                    next()
                    return expression()
                }
                break
        }
        expect(Token.Colon)
        return expression()
    }

    function primitiveExpression() {
        switch (current) {
            case Token.Literal:
                return next()
            case Token.True:
                return next()
            case Token.False:
                return next()
            case Token.LBrack:
                return first(valueInitializer, valueArrayInitializer)
            case Token.LBrackBang:
                return first(entityInitializer, entityArrayInitializer)
            case Token.LBrace:
                return lambda()
            case Token.Let:
            case Token.Val:
            case Token.Var:
                return declaration()
            case Token.Symbol:
                return next()
            case Token.Identifier:
                switch (pseudo) {
                    case PseudoToken.When:
                        return whenExpression()
                    case PseudoToken.If:
                        return ifExpression()
                    default:
                        return next()
                }
            case Token.LParen:
                return parenDelimited(expression)
        }
    }

    function valueInitializer() {
        return delimited(Token.LBrack, Token.RBrack, () => { list(memberInitializer) })
    }

    function valueArrayInitializer() {
        return delimited(Token.LBrack, Token.RBrack, () => { list(expression) })
    }

    function entityInitializer() {
        return delimited(Token.LBrackBang, Token.BangRBrack, () => { list(memberInitializer) })
    }

    function entityArrayInitializer() {
        return delimited(Token.LBrackBang, Token.BangRBrack, () => { list(expression) })
    }

    function memberInitializer() {
        switch (current) {
            case Token.Identifier:
                name()
                break
            case Token.Symbol:
                if (pseudo == PseudoToken.Spread) {
                    next()
                    return expression()
                }
                break
        }
        expect(Token.Colon)
        return expression()
    }

    function whenExpression() {
        expectPseudo(PseudoToken.When)
        if (current == Token.LParen) {
            parenDelimited(expression)
        }
        expect(Token.LBrace)
        list(whenClause)
        expect(Token.RBrace)
    }

    function whenClause() {
        if (pseudo == PseudoToken.Else) {
            next()
            expectPseudo(PseudoToken.Arrow)
            return expression()
        }
        exclude(PseudoToken.Arrow, () => expression())
        expectPseudo(PseudoToken.Arrow)
        return expression()
    }

    function ifExpression() {
        expectPseudo(PseudoToken.If)
        parenDelimited(expression)
        exclude(PseudoToken.Else, () => expression())
        if (pseudo == PseudoToken.Else) {
            next()
            expression()
        }
    }

    function optionalExpression() {
        if (expressionStart()) {
            expression()
        }
        return null
    }

    function reference() {
        name()
        while (current == Token.Dot) {
            next()
            name()
        }
    }

    function declaration() {
        switch (current) {
            case Token.Let:
                return letDeclaration()
            case Token.Val:
                return valDeclaration()
            case Token.Var:
                return varDeclaration() 
        }
        report("Expected a declaration")
    }

    function letDeclaration() {
        expect(Token.Let)
        name()
        optionalType()
        expectPseudo(PseudoToken.Equal)
        switch (current) {
            case Token.VocabStart:
                return vocabularyLiteral()
            case Token.Symbol:
                if (pseudo == PseudoToken.LessThan) {
                    return typeLiteral()
                }
                // fall-through
            default:
                return expression()
        }
    }

    function valDeclaration() {
        expect(Token.Val)
        name()
        optionalType()
        optionalInitializer()
    }

    function varDeclaration() {
        expect(Token.Var)
        name()
        optionalType()
        optionalInitializer()
    }

    function optionalType() {
        if (current == Token.Colon) {
            next()
            typeReference()
        }
    }

    function optionalInitializer() {
        if (pseudo == PseudoToken.Equal) {
            next()
            expression()
        }
    }

    function next() {
        current = scanner.next()
        pseudo = scanner.psuedo
    }
    
    function separator(): boolean {
        if (current == Token.Comma) {
            next()
            return true
        }
        // TODO: auto detect
        return false
    }

    function delimited<T>(start: Token, end: Token, element: () => T): T {
        expect(start)
        const result = element()
        expect(end)
        return result
    }

    function parenDelimited<T>(element: () => T): T {
        return delimited(Token.LParen, Token.RParen, element)
    }

    function pseudoDelimited<T>(start: PseudoToken, end: PseudoToken, element: () => T): T {
        expectPseudo(start)
        const result = element()
        expectPseudo(end)
        return result
    }

    function list<T>(element: () => T | null): T[] {
        const result = []
        while (true) {
            const r = element()
            if (r === null) break
            result.push(r)
            if (!separator()) break    
        }
        return result
    }

    function first<T>(...elements: (() => T | null)[]): T | null {
        let err: any = undefined
        for (let element of elements) {
            const cloned = scanner.clone()
            const clonedCurrent = current
            const clonedPseudo = pseudo
            const clonedExcluded = excluded.slice()
            try {
                const result = element()
                if (result !== null) return result
            } catch (e) {
               if (!err) err = e 
            }
            scanner = cloned
            current = clonedCurrent
            pseudo = clonedPseudo
            excluded = clonedExcluded
        }
        if (err) throw err
        return null
    }

    function yes() { }
    function optional<T>(element: () => T | void | null): T | null | void {
        return first(element, yes)
    }

    function report(error: string): never {
        throw Error(`${error} on ${scanner.line}`)
    }

    function expectPseudo(expected: PseudoToken) {
        if (pseudo != expected) {
            report(`Expected ${nameOfPseudoToken(expected)}`)
        }
        next()
    }

    function expect(expected: Token) {
        if (current != expected) {
            report(`Expected ${nameOfToken(expected)}`)
        }
        next()
    }

    function exclude<T>(pseudo: PseudoToken, block: () => T): T {
        if (excluded[pseudo]) {
            return block()
        }
        excluded[pseudo] = true
        try {
            return block()
        } finally {
            excluded[pseudo] = false
        }
    }

    function expressionStart(): boolean {
        switch (current) {
            case Token.Identifier:
            case Token.Symbol:
                return !excluded[pseudo]
            case Token.Literal:
            case Token.True:
            case Token.False:
            case Token.LBrace:
            case Token.LParen:
            case Token.LBrack:
            case Token.LBrackBang:
            case Token.LBraceBang:
                return true
        }
        return false
    }
}