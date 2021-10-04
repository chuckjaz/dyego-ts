import {
    Optional, Name, ElementBuilder, BreakElement, Element, ContinueElement, LoopElement, WhenElement, OperatorPrecedenceRelation, OperatorPlacement, VocabularyOperatorPrecedence, OperatorAssociativity, ElementKind, childrenOf
} from './ast'
import { Scanner } from "./scanner";
import { PseudoToken, Token, nameOfToken, nameOfPseudoToken, Literal } from "./tokens"

export function parse(scanner: Scanner) {
    let current = scanner.next()
    let pseudo = scanner.psuedo
    let excluded: boolean[] = []
    let builder = new ElementBuilder(scanner)
    const trueExp = builder.Literal(true, Literal.Boolean)

    const result = sequence()
    expect(Token.EOF)
    return result

    function sequence(): Element[] {
        return list(sequencePart)
    }

    function sequencePart(): Element | null {
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

    function breakStatement(): BreakElement {
        expectPseudo(PseudoToken.Break)
        const label = optionalName()
        return builder.Break(label)
    }

    function continueStatement(): ContinueElement {
        expectPseudo(PseudoToken.Continue)
        const label = optionalName()
        return builder.Continue(label)
    }

    function loopStatement(): LoopElement {
        expectPseudo(PseudoToken.Loop)
        const label = optionalName()
        const body = block()
        return builder.Loop(label, body)
    }

    function whileStatement(): Element {
        expectPseudo(PseudoToken.While)
        const label = optionalName()
        const exp = parenDelimited(expression)
        const body = block()
        return builder.Loop(undefined, [
            builder.When(exp, [
                builder.WhenValueClause(trueExp, builder.Break(undefined))
            ]),
            ...body
        ])
    }

    function returnStatement(): Element {
        expect(Token.Return)
        const value = optionalExpression()
        return builder.Return(value)
    }

    function sequenceSpread(): Element {
        expectPseudo(PseudoToken.Spread)
        if (current == Token.VocabStart) {
            const ref = vocabularyLiteral()
            return builder.Spread(ref)
        }
        const ref = importReference()
        return builder.Spread(ref)
    }

    function vocabularyLiteral(): Element {
        expect(Token.VocabStart)
        const members = list(vocabularyMember)
        expect(Token.VocabEnd)
        return builder.VocabularyLiteral(members)
    }

    function importReference(): Element {
        let result: Element = name()
        while (current == Token.Scope) {
            next()
            const right = name()
            result = builder.Selection(result, right)
        }
        return result
    }

    function vocabularyMember(): Element | null {
        if (current == Token.VocabEnd) return null
        if (pseudo == PseudoToken.Spread) return vocabularySpread()
        return vocabularyOperatorDeclaration()
    }

    function vocabularyOperatorDeclaration(): Element {
        let placement = OperatorPlacement.Unspecified
        switch (pseudo) {
            case PseudoToken.Prefix:
                pseudo = 0 // intentional because of over narrowing of pseudo
                next()
                placement = OperatorPlacement.Prefix
                break
            case PseudoToken.Infix:
                pseudo = 0
                next()
                placement = OperatorPlacement.Infix
                break
            case PseudoToken.Postfix:
                pseudo = 0 // intentional because of over narrowing of pseudo
                placement = OperatorPlacement.Postfix
                next()
                break
            default:
                report("Expected an operator placement (prefix, infix or postfix)")
        }
        expectPseudo(PseudoToken.Operator)
        const names = vocabularyNames()
        let precedence: Optional<VocabularyOperatorPrecedence>
        switch(pseudo) {
            case PseudoToken.Before:
            case PseudoToken.After:
                precedence = vocabularyPrecedence()
                break
        }
        let associativity = OperatorAssociativity.Unspecified
        switch (pseudo) {
            case PseudoToken.Left:
                associativity = OperatorAssociativity.Left
                next()
                break
            case PseudoToken.Right:
                associativity = OperatorAssociativity.Right
                next()
                break
        }
        return builder.VocabularyOperatorDeclaration(names, placement, precedence, associativity)
    }

    function vocabularySpread(): Element {
        expectPseudo(PseudoToken.Spread)
        const ref = vocabularyReference()
        return builder.Spread(ref)
    }

    function vocabularyReference(): Element {
        let left: Element = name()
        while (current == Token.Dot) {
            next()
            const right = name()
            left = builder.Selection(left, right)
        }
        return left
    }

    function vocabularyNames(): Name[] {
        switch (pseudo) {
        case PseudoToken.Identifiers:
            next()
            return [builder.Name("identifiers")]
        }
        switch (current) {
            case Token.Identifier:
                return [name()]
            case Token.LParen:
                return parenDelimited(() => list(name))
        }
        report("Expected name or names of the operator")
    }

    function vocabularyPrecedence(): VocabularyOperatorPrecedence {
        let relation = OperatorPrecedenceRelation.After
        switch (pseudo) {
            case PseudoToken.Before:
                relation = OperatorPrecedenceRelation.Before
                // fall-through
            case PseudoToken.After:
                pseudo = 0
                next()
                break
            // cannot be called without it being before or after
            // default:
            //     report("Expected before or after")
        }
        let placement = OperatorPlacement.Unspecified
        switch (pseudo) {
            case PseudoToken.Prefix:
                next()
                placement = OperatorPlacement.Prefix
                break
            case PseudoToken.Infix:
                next()
                placement = OperatorPlacement.Infix
                break
            case PseudoToken.Postfix:
                next()
                placement = OperatorPlacement.Postfix
                break
        }
        const nm = name()
        return builder.VocabularyOperatorPrecedence(nm, placement, relation)
    }

    function typeLiteral(): Element {
        expectPseudo(PseudoToken.LessThan)
        const typeParameters = optional(() => {
            const result = list(formalTypeParameter)
            expectPseudo(PseudoToken.Arrow)
            return result
        }) || []
        const members = list(typeLiteralMember)
        expectPseudo(PseudoToken.GreaterThan)
        return builder.TypeLiteral(typeParameters, members)
    }

    function formalTypeParameter(): Element {
        const nm = name()
        let ty: Optional<Element>
        if (current == Token.Colon) {
            next()
            ty = typeReference()
        }
        return builder.TypeParameter(nm, ty)
    }

    function typeReference(): Element {
        let result = typeOrReference()
        while (pseudo == PseudoToken.And) {
            next()
            const right = typeOrReference()
            result = builder.AndType(result, right)
        }
        return result
    }

    function typeOrReference(): Element {
        let result = simpleTypeReference()
        while (pseudo == PseudoToken.Bar) {
            next()
            let right = simpleTypeReference()
            result = builder.OrType(result, right)
        }
        return result
    }

    function simpleTypeReference(): Element {
        let result = typePrimitiveReference()
        while (current == Token.LBrack) {
            next()
            expect(Token.RBrack)
            result = builder.ArrayType(result)
        }
        if (pseudo == PseudoToken.Question) {
            next()
            result = builder.OptionalType(result)
        }
        return result
    }

    function typePrimitiveReference(): Element {
        if (pseudo == PseudoToken.ThisType) {
            next()
            return builder.Name("This")
        }
        switch (current) {
            case Token.Identifier:
                let result = reference()
                if (pseudo == PseudoToken.LessThan) {
                    const args = pseudoDelimited(
                        PseudoToken.LessThan,
                        PseudoToken.GreaterThan,
                        () => { return list(typeReference) }
                    )
                    result = builder.TypeConstructor(result, args)
                }
                return result
            case Token.LParen:
                return parenDelimited(typeReference)
        }
        report("Expected a type name")
    }

    function typeLiteralMember(): Element | null {
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

    function name(): Name {
        if (current == Token.Identifier) {
            const value = scanner.value as string
            next()
            return builder.Name(value)
        }
        report("Expected an identifier")
    }

    function optionalName(): Optional<Name> {
        if (current == Token.Identifier) {
            return name()
        }
        return undefined
    }

    function block(): Element[] {
        expect(Token.LBrace)
        const result = sequence()
        expect(Token.RBrace)
        return result
    }

    function expression(): Element {
        const result = sequenceExpression()
        if (result === null) report("Expected an expression")
        return result
    }

    function sequenceExpression(): Element | null {
        let left = simpleExpression()
        if (left === null) return null
        while (expressionStart()) {
            const right = expression()
            left = builder.Call(left, [right], undefined)
        }
        return left
    }

    function simpleExpression(): Element | null {
        let left = primitiveExpression()
        if (left === null) return null
        simpleLoop: while (true) {
            switch(current) {
                case Token.Dot:
                    const select = selector()
                    left = builder.Selection(left, select)
                    break
                case Token.LBrace:
                    const l = lambda()
                    left = builder.Call(left, [l], [])
                    break
                case Token.LParen:
                    left = call(left)
                    break
                case Token.Symbol:
                    if (pseudo == PseudoToken.LessThan) {
                        const target = left
                        const callResult = optional(() => { call(target) })
                        if (callResult !== null)
                            break
                    }
                    // fall through
                default:
                    break simpleLoop
            }
        }
        return left
    }

    function selector(): Name {
        expect(Token.Dot)
        return name()
    }

    function lambda() {
        expect(Token.LBrace)
        let typeParameters: Element[] = []
        if (pseudo == PseudoToken.LessThan) {
            next()
            typeParameters = list(formalParameter)
            expectPseudo(PseudoToken.GreaterThan)
        }
        const parameters = optional(() => {
            const result = list(formalParameter)
            expectPseudo(PseudoToken.Arrow)
            return result
        }) || []
        const body = sequence()
        expect(Token.RBrace)
        let result: Optional<Element>
        if (current == Token.Colon) {
            next()
            result = typeReference()
        }
        return builder.Lambda(parameters, typeParameters, body, result)
    }

    function formalParameter(): Element {
        const nm = name()
        let ty: Optional<Element>
        let dflt: Optional<Element>
        if (current == Token.Colon) {
            next()
            ty = typeReference()
        }
        if (pseudo == PseudoToken.Equal) {
            next()
            dflt = expression()
        }
        return builder.Parameter(nm, ty, dflt)
    }

    function call(target: Element): Element {
        let typeArguments: Element[] = []
        if (pseudo == PseudoToken.LessThan) {
            expectPseudo(PseudoToken.LessThan)
            typeArguments = list(formalTypeParameter)
            expectPseudo(PseudoToken.GreaterThan)
        }
        let args: Element[] = []
        if (current != Token.LBrace) {
            expect(Token.LParen)
            while (expressionStart() || current == Token.Colon || pseudo == PseudoToken.Spread) {
                args.push(argument())
            }
            expect(Token.RParen)
        }
        if (current == Token.LBrace) {
            args.push(lambda())
        }
        return builder.Call(target, args, typeArguments)
    }

    function argument(): Element {
        switch (current) {
            case Token.Symbol:
                expectPseudo(PseudoToken.Spread)
                const target = expression()
                return builder.Spread(target)
        }
        const nm = name()
        expect(Token.Colon)
        const value = expression()
        return builder.NamedArgument(nm, value)
    }

    function primitiveExpression(): Element | null {
        switch (current) {
            case Token.Literal:
                next()
                return builder.Literal(scanner.value, scanner.literal)
            case Token.True:
                next()
                return builder.Literal(true, Literal.Boolean)
            case Token.False:
                next()
                return builder.Literal(false, Literal.Boolean)
            case Token.LBrack: {
                return first(valueInitializer, valueArrayInitializer)
            }
            case Token.LBrackBang:
                return first(entityInitializer, entityArrayInitializer)
            case Token.LBrace:
                return lambda()
            case Token.Let:
            case Token.Val:
            case Token.Var:
                return declaration()
            case Token.Symbol:
                const n = scanner.value as string
                next()
                return builder.Name(n)
            case Token.Identifier:
                switch (pseudo) {
                    case PseudoToken.When:
                        return whenExpression()
                    case PseudoToken.If:
                        return ifExpression()
                    default:
                        return name()
                }
            case Token.LParen:
                return parenDelimited(expression)
        }
        return null
    }

    function valueInitializer(): Element {
        const members = delimited(Token.LBrack, Token.RBrack, () => { return list(memberInitializer) })
        return builder.ValueLiteral(members)
    }

    function valueArrayInitializer(): Element {
        const elements = delimited(Token.LBrack, Token.RBrack, () => { return list(expression) })
        return builder.ValueArrayLiteral(elements)
    }

    function entityInitializer(): Element {
        const members = delimited(Token.LBrackBang, Token.BangRBrack, () => {
            return list(memberInitializer)
        })
        return builder.EntityLiteral(members)
    }

    function entityArrayInitializer() {
        const elements = delimited(Token.LBrackBang, Token.BangRBrack, () => {
            return list(expression)
        })
        return builder.EntityArrayLiteral(elements)
    }

    function lastOf(element: Element): Element | null {
        let last: Element | null = null
        for (const child of childrenOf(element)) {
            last = child
        }
        return last
    }

    function rightMostNameOf(element: Element | null): Name | null {
        if (element === null) return null
        if (element.kind === ElementKind.Name)
            return element
        return rightMostNameOf(lastOf(element))
    }

    function memberInitializer(): Element | null {
        if (!expressionStart() && current != Token.Colon) return null
        switch (current) {
            case Token.Symbol:
                if (pseudo == PseudoToken.Spread) {
                    next()
                    const value = expression()
                    return builder.Spread(value)
                }
                break
            case Token.Colon:
                next()
                const value = expression()
                const n = rightMostNameOf(value)
                if (n === null) {
                    report("Expected a name as the right most symbol")
                }
                return builder.NamedMemberInitializer(n, value)
        }

        const n = name()
        expect(Token.Colon)
        const value = expression()
        return builder.NamedMemberInitializer(n, value)
    }

    function whenExpression(): WhenElement {
        expectPseudo(PseudoToken.When)
        let exp: Optional<Element>
        if (current == Token.LParen) {
            exp = parenDelimited(expression)
        }
        expect(Token.LBrace)
        const clauses = list(whenClause)
        expect(Token.RBrace)
        return builder.When(exp, clauses)
    }

    function whenClause(): Element {
        if (pseudo == PseudoToken.Else) {
            next()
            expectPseudo(PseudoToken.Arrow)
            const body = expression()
            return builder.WhenElseClause(body)
        }
        const value = exclude(PseudoToken.Arrow, () => expression())
        expectPseudo(PseudoToken.Arrow)
        const body = expression()
        return builder.WhenValueClause(value, body)
    }

    function ifExpression(): Element {
        expectPseudo(PseudoToken.If)
        const exp = parenDelimited(expression)
        const thenBody = exclude(PseudoToken.Else, () => expression())
        const clauses: Element[] = [builder.WhenValueClause(trueExp,  thenBody)]
        if (pseudo == PseudoToken.Else) {
            next()
            const elseBody = expression()
            clauses.push(builder.WhenElseClause(elseBody))
        }
        return builder.When(exp, clauses)
    }``

    function optionalExpression(): Optional<Element> {
        let result: Optional<Element>
        if (expressionStart()) {
            result = expression()
        }
        return result
    }

    function reference(): Element {
        let result: Element = name()
        while (current == Token.Dot) {
            next()
            const member = name()
            result = builder.Selection(result, member)
        }
        return result
    }

    function declaration(): Element {
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

    function letDeclaration(): Element {
        expect(Token.Let)
        const nm = name()
        const ty = optionalType()
        expectPseudo(PseudoToken.Equal)
        switch (current) {
            case Token.VocabStart:
                const initializer = vocabularyLiteral()
                return builder.LetDeclaration(nm, ty, initializer)
            case Token.Symbol:
                if (pseudo == PseudoToken.LessThan) {
                    const initializer = typeLiteral()
                    return builder.LetDeclaration(nm, ty, initializer)
                }
                break
        }
        const initializer = expression()
        return builder.LetDeclaration(nm, ty, initializer)
    }

    function valDeclaration(): Element {
        expect(Token.Val)
        const nm = name()
        const ty = optionalType()
        const initializer = optionalInitializer()
        return builder.ValDeclaration(nm, ty, initializer)
    }

    function varDeclaration() {
        expect(Token.Var)
        const nm = name()
        const ty = optionalType()
        const initializer = optionalInitializer()
        return builder.VarDeclaration(nm, ty, initializer)
    }

    function optionalType(): Optional<Element> {
        let result: Optional<Element>
        if (current == Token.Colon) {
            next()
            result = typeReference()
        }
        return result
    }

    function optionalInitializer(): Optional<Element> {
        let result: Optional<Element>
        if (pseudo == PseudoToken.Equal) {
            next()
            result = expression()
        }
        return result
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

    function yes() { return undefined }
    function optional<T>(element: () => T | null | undefined): Optional<T> {
        const result = first(element, yes)
        if (result === null) return undefined
        return result
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