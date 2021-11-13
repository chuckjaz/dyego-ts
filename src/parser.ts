import {
    Optional, Name, ElementBuilder, BreakElement, Element, ContinueElement, LoopElement, WhenElement,
    OperatorPrecedenceRelation, OperatorPlacement, VocabularyOperatorPrecedence, SpreadElement,
    OperatorAssociativity, ElementKind, childrenOf, NamedMemberElement, TypeParameterElement, CallSignatureElement, IntrinsicCallSignatureElement
} from './ast'
import {
    Scanner
} from "./scanner";
import {
    PseudoToken, Token, nameOfToken, nameOfPseudoToken, Literal
} from "./tokens"
import {
    buildVocabulary, lookupVocabulary, PrecedenceLevel, Vocabulary, VocabularyEmbeddingContext,
    VocabularyScope
} from './vocabulary';

export function parse(scanner: Scanner, scope: VocabularyScope = new VocabularyScope()): Element[] {
    let current = scanner.next()
    let pseudo = scanner.psuedo
    let excluded: boolean[] = []
    let builder = new ElementBuilder({
        startPos: () => scanner.startPos(),
        endPos: () => scanner.endPos()
    })
    let context = new VocabularyEmbeddingContext()
    let vocabulary = context.result
    let separatorState = SeparatorState.normal

    const trueExp = builder.Literal(true, Literal.Boolean)

    const result = topLevelSequence()
    expect(Token.EOF)
    return result

    function topLevelSequence(): Element[] {
        return list(topLevelSequencePart)
    }

    function topLevelSequencePart(): Element | null {
        if (pseudo == PseudoToken.Spread) {
            return rootSequenceSpread()
        }
        if (current == Token.Let) {
            return rootLetDeclaration()
        }
        return sequencePart()
    }

    function rootSequenceSpread(): SpreadElement {
        const result = sequenceSpread()
        const target = result.target
        switch (target.kind) {
            case ElementKind.VocabularyLiteral: {
                const vocabulary = buildVocabulary(scope, target)
                context.embedVocabulary(vocabulary)
                break
            }
            case ElementKind.Selection:
            case ElementKind.Name: {
                const vocabulary = lookupVocabulary(scope, target)
                context.embedVocabulary(vocabulary)
                break
            }
        }
        return result
    }

    function lookupOptionalVocabulary(scope: VocabularyScope, element: Element): Optional<Vocabulary> {
        try {
            return lookupOptionalVocabulary(scope, element)
        } catch(e) {
            return undefined
        }
    }

    function rootLetDeclaration(): Element {
        const result = letDeclaration()
        const initializer = result.initializer
        if (initializer) {
            switch (initializer.kind) {
                case ElementKind.VocabularyLiteral: {
                    const vocabulary = buildVocabulary(scope, initializer)
                    scope.members.set(result.name.text, vocabulary)
                    break
                }
                case ElementKind.Selection:
                case ElementKind.Name: {
                    const vocabulary = lookupOptionalVocabulary(scope, initializer)
                    if (vocabulary)
                        scope.members.set(result.name.text, vocabulary)
                    break
                }
            }
        }
        return result
    }

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
                        return valueTypeLiteral()
                    case PseudoToken.LessThanBang:
                        return mutableTypeLiteral()
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
            case Token.VocabStart:
                return vocabularyLiteral()
        }
        return null
    }

    function breakStatement(): BreakElement {
        return ctx(() => {
            expectPseudo(PseudoToken.Break)
            const label = optionalName()
            return builder.Break(label)
        })
    }

    function continueStatement(): ContinueElement {
        return ctx(() => {
            expectPseudo(PseudoToken.Continue)
            const label = optionalName()
            return builder.Continue(label)
        })
    }

    function loopStatement(): LoopElement {
        return ctx(() => {
            expectPseudo(PseudoToken.Loop)
            const label = optionalName()
            const body = block()
            return builder.Loop(label, body)
        })
    }

    function whileStatement(): Element {
        return ctx(() => {
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
        })
    }

    function returnStatement(): Element {
        return ctx(() => {
            expect(Token.Return)
            const value = optionalExpression()
            return builder.Return(value)
        })
    }

    function sequenceSpread(): SpreadElement {
        return ctx(() => {
            expectPseudo(PseudoToken.Spread)
            if (current == Token.VocabStart) {
                const ref = vocabularyLiteral()
                return builder.Spread(ref)
            }
            const ref = importReference()
            return builder.Spread(ref)
        })
    }

    function vocabularyLiteral(): Element {
        return ctx(() => {
            expect(Token.VocabStart)
            const members = list(vocabularyMember)
            expect(Token.VocabEnd)
            return builder.VocabularyLiteral(members)
        })
    }

    function importReference(): Element {
        return ctx(() => {
            let result: Element = name()
            while (current == Token.Dot) {
                next()
                const right = name()
                result = builder.Selection(result, right)
            }
            return result
        })
    }

    function vocabularyMember(): Element | null {
        if (current == Token.VocabEnd) return null
        if (pseudo == PseudoToken.Spread) return vocabularySpread()
        return vocabularyOperatorDeclaration()
    }

    function vocabularyOperatorDeclaration(): Element {
        return ctx(() => {
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
        })
    }

    function vocabularySpread(): Element {
        expectPseudo(PseudoToken.Spread)
        const ref = vocabularyReference()
        return builder.Spread(ref)
    }

    function vocabularyReference(): Element {
        return ctx(() => {
            let left: Element = name()
            while (current == Token.Dot) {
                next()
                const right = name()
                left = builder.Selection(left, right)
            }
            return left
        })
    }

    function vocabularyNames(): Name[] {
        return ctx(() => {
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
        })
    }

    function vocabularyPrecedence(): VocabularyOperatorPrecedence {
        return ctx(() => {
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
        })
    }

    function valueTypeLiteral(): Element {
        return exclude(PseudoToken.GreaterThan, () => {
            return ctx(() => {
                expectPseudo(PseudoToken.LessThan)
                const typeParameters = optional(() => {
                    const result = list(formalTypeParameter)
                    expectPseudo(PseudoToken.Arrow)
                    return result
                }) || []
                const members = list(typeLiteralMember)
                expectPseudo(PseudoToken.GreaterThan)
                let constraint: Optional<Element> = undefined
                if (current == Token.Colon) {
                    next()
                    constraint = typeReference()
                }
                return builder.ValueTypeLiteral(typeParameters, members, constraint)
            })
        })
    }

    function mutableTypeLiteral(): Element {
        return exclude(PseudoToken.BangGreaterThan, () => {
            return ctx(() => {
                expectPseudo(PseudoToken.LessThanBang)
                const typeParameters = optional(() => {
                    const result = list(formalTypeParameter)
                    expectPseudo(PseudoToken.Arrow)
                    return result
                }) || []
                const members = list(typeLiteralMember)
                expectPseudo(PseudoToken.BangGreaterThan)
                let constraint: Optional<Element> = undefined
                if (current == Token.Colon) {
                    next()
                    constraint = typeReference()
                }
                return builder.EntityTypeLiteral(typeParameters, members, constraint)
            })
        })
    }

    function formalTypeParameter(): TypeParameterElement | null {
        return ctx(() => {
            if (current != Token.Identifier) return null
            const nm = name()
            let ty: Optional<Element>
            if (current as any == Token.Colon) {
                next()
                ty = typeReference()
            }
            let dflt: Optional<Element>
            if (pseudo == PseudoToken.Equal) {
                next()
                dflt = longest(typeReference, expression) ?? undefined
                if (!dflt) {
                    report("Expected a type refernece")
                }
            }
            return builder.TypeParameter(nm, ty, dflt)
        })
    }

    function typeReference(): Element {
        return ctx(() => {
            let result = typeOrReference()
            while (pseudo == PseudoToken.And) {
                next()
                const right = typeOrReference()
                result = builder.AndType(result, right)
            }
            return result
        })
    }

    function typeOrReference(): Element {
        return ctx(() => {
            let result = simpleTypeReference()
            while (pseudo == PseudoToken.Bar) {
                next()
                let right = simpleTypeReference()
                result = builder.OrType(result, right)
            }
            return result
        })
    }

    function simpleTypeReference(): Element {
        return ctx(() => {
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
        })
    }

    function typePrimitiveReference(): Element {
        return ctx(() => {
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
                            () => list(typeArgument)
                        )
                        result = builder.TypeConstructor(result, args)
                    }
                    return result
                case Token.Symbol:
                    switch (pseudo) {
                        case PseudoToken.LessThan:
                            return valueTypeLiteral()
                        case PseudoToken.LessThanBang:
                            return mutableTypeLiteral()
                        case PseudoToken.LessThanDollar:
                            return symbolLiteral()
                    }
                    break
                case Token.LBrace:
                    return callSignature()
                case Token.LBraceBang:
                    return intrinsicCallSignature()
                case Token.LParen:
                    return parenDelimited(typeReference)
            }
            report("Expected a type name")
        })
    }

    function typeArgument(): Element | null {
        return ctx(() => {
            switch (current) {
                case Token.Symbol:
                    expectPseudo(PseudoToken.Spread)
                    const target = typeReference()
                    return builder.Spread(target)
                case Token.Identifier: {
                    const nm = name()
                    expect(Token.Colon)
                    const value = longest(typeReference, expression)
                    if (!value) return value
                    return builder.NamedArgument(nm, value)
                }
                case Token.Colon: {
                    next()
                    const value = longest(typeReference, expression)
                    if (!value) return value
                    const nm = rightMostNameOf(value)
                    return builder.NamedArgument(nm, value)
                    break
                }
            }
            return null
        })
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

    function callSignature(): CallSignatureElement {
        return ctx(() => {
            expect(Token.LBrace)
            const typeParameters = optional(() => {
                const result = list(formalTypeParameter)
                expectPseudo(PseudoToken.Arrow)
                return result
            }) || []
            const parameters = list(formalParameter)
            expect(Token.RBrace)
            let result: Optional<Element> = undefined
            if (current == Token.Colon) {
                next()
                result = typeReference()
            }
            return builder.CallSignature(typeParameters, parameters, result)
        })
    }

    function intrinsicCallSignature(): IntrinsicCallSignatureElement {
        return ctx(() => {
            expect(Token.LBraceBang)
            const typeParameters = optional(() => {
                const result = list(formalTypeParameter)
                expectPseudo(PseudoToken.Arrow)
                return result
            }) || []
            const parameters = list(formalIntrinsicParameter)
            expect(Token.BangRBrace)
            let result: Optional<Element> = undefined
            if (current == Token.Colon) {
                next()
                result = typeReference()
            }
            return builder.IntrinsicCallSignature(typeParameters, parameters, result)
        })
    }

    function constraintLiteral(): Element {
        return ctx(() => {
            expect(Token.ConstraintStart)
            const typeParameters = optional(() => {
                const result = list(formalTypeParameter)
                expectPseudo(PseudoToken.Arrow)
                return result
            }) || []
            const members = list(constraintLiteralMember)
            expect(Token.ConstraintEnd)
            return builder.ConstraintLiteral(typeParameters, members)
        })
    }

    function constraintLiteralMember(): Element | null {
        return ctx(() => {
            switch (current) {
                case Token.Let: {
                    next()
                    const nm = name()
                    expect(Token.Colon)
                    const ty = typeReference()
                    let initializer: Optional<Element> = undefined
                    if (pseudo == PseudoToken.Equal) {
                        next()
                        initializer = expression()
                    }
                    return builder.ConstraintLetDelaration(nm, ty, initializer)
                }
                case Token.Var: {
                    next()
                    const nm = name()
                    expect(Token.Colon)
                    const ty = typeReference()
                    return builder.VarDeclaration(nm, ty, undefined)
                }
                case Token.Val: {
                    next()
                    const nm = name()
                    expect(Token.Colon)
                    const ty = typeReference()
                    return builder.ValDeclaration(nm, ty, undefined)
                }
                case Token.Symbol: {
                    if (pseudo == PseudoToken.Spread) {
                        next()
                        const target = typeReference()
                        return builder.Spread(target)
                    }
                    break
                }
            }
            return null
        })
    }

    function symbolLiteral(): Element {
        return ctx(() => {
            expectPseudo(PseudoToken.LessThanDollar)
            const values = list(sequenceExpression)
            expectPseudo(PseudoToken.DollarGreaterThan)
            return builder.SymbolLiteral(values)
        })
    }

    function name(): Name {
        return ctx(() => {
            if (current == Token.Identifier) {
                const value = scanner.value as string
                next()
                return builder.Name(value)
            }
            report("Expected an identifier")
        })
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
        if (result === null)
            report("Expected an expression")
        return result
    }

    function sequenceExpression(): Element | null {
        return operatorExpression(context.findLowest())
    }

    function findOperator(
        placment: OperatorPlacement,
        includeIdentifiers: boolean
    ): Optional<SelectedOperator>  {
        switch (current) {
            case Token.Identifier:
                if (pseudo == PseudoToken.Escaped) {
                    break
                }
                // fallthrough
            case Token.Symbol:
                if (excluded[pseudo]) break
                let text = scanner.value as string
                let operator = vocabulary.get(text)
                if (!operator) {
                    if (
                        includeIdentifiers &&
                        placment == OperatorPlacement.Infix &&
                        pseudo == PseudoToken.Identifiers
                    ) {
                        operator = vocabulary.get("identifiers")
                    }
                }
                if (!operator) break
                const level = operator.levels[placment]
                if (!level) break
                const assoc = operator.associativities[placment]
                if (placment == OperatorPlacement.Postfix) {
                    text = `postfix ${text}`
                }
                return new SelectedOperator(text, level, assoc, placment)
        }
        return undefined
    }

    function unaryOp(target: Element, op: SelectedOperator, name: Name): Element {
        return builder.Call(builder.Selection(target, name), [], [])
    }

    function binaryOp(target: Element, op: SelectedOperator, name: Name, right: Element): Element {
        return builder.Call(builder.Selection(target, name), [right], [])
    }

    function requiredOperatorExpression(level: PrecedenceLevel): Element {
        const left = operatorExpression(level)
        if (!left) report("Expected an expression")
        return left
    }

    function infixPossible<T>(block: () => T): T {
        if (separatorState == SeparatorState.normal) {
            separatorState = SeparatorState.possibleInfix
            try {
                return block()
            } finally {
                separatorState = SeparatorState.normal
            }
        } else return block()
    }

    function opName(): Name {
        return ctx(() => {
            const text = scanner.value
            next()
            return builder.Name(text)
        })
    }

    function operatorExpression(level: PrecedenceLevel): Element | null {
        return ctx(() => {
            let op = findOperator(OperatorPlacement.Prefix, false)
            let left: Element
            if (op && op.isHigherThan(level)) {
                const nm = opName()
                left = unaryOp(requiredOperatorExpression(op.level), op, nm)
            } else {
                const l = simpleExpression()
                if (!l) return null
                left = l
            }
            op = findOperator(OperatorPlacement.Postfix, false)
            if (op && op.isHigherThan(level) && scanner.newline < 0) {
                const nm = opName()
                left = unaryOp(left, op, nm)
            }
            op = findOperator(OperatorPlacement.Infix, scanner.newline < 0)
            while (op && op.isHigherThan(level)) {
                const nm = opName()
                separatorState = SeparatorState.wasInfix
                const level = op.level
                const right = infixPossible(() => requiredOperatorExpression(level))
                left = binaryOp(left, op, nm, right)
                op = findOperator(OperatorPlacement.Infix, scanner.newline < 0)
            }
            return left
        })
    }

    function simpleExpression(): Element | null {
        return ctx(() => {
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
                        if (scanner.newline >= 0) break simpleLoop
                        left = call(left)
                        break
                    case Token.LBrack:
                        if (scanner.newline >= 0) break simpleLoop
                        left = index(left)
                        break
                    case Token.Symbol:
                        if (pseudo == PseudoToken.LessThan) {
                            const target = left
                            const callResult = optional(() => { call(target) })
                            if (callResult !== null)
                                break simpleLoop
                        }
                        // fall through
                    default:
                        break simpleLoop
                }
            }
            return left
        })
    }

    function selector(): Name {
        expect(Token.Dot)
        return name()
    }

    function lambda() {
        return ctx(() => {
            expect(Token.LBrace)
            let typeParameters: Element[] = []
            const parameters = optional(() => {
                const result = list(formalParameter)
                expectPseudo(PseudoToken.Arrow)
                return result
            }) || []
            const body = sequence()
            expect(Token.RBrace)
            let result: Optional<Element> = undefined
            if (current == Token.Colon) {
                next()
                result = typeReference()
            }
            return builder.Lambda(parameters, typeParameters, body, result)
        })
    }

    function intrinsicLambda(): Element {
        return ctx(() => {
            expect(Token.LBraceBang)
            const parameters = optional(() => {
                const result = list(formalParameter)
                expectPseudo(PseudoToken.Arrow)
            }) || []
            const body = sequence()
            expect(Token.BangRBrace)
            let result: Optional<Element> = undefined
            if (current == Token.Colon) {
                next()
                result = typeReference()
            }
            return builder.IntrinsicLambda(parameters, [], body, result)
        })
    }

    function formalParameter(): Element | null {
        if (current != Token.Identifier) return null
        return ctx(() => {
            const nm = name()
            let ty: Optional<Element>
            let dflt: Optional<Element>
            if (current as any == Token.Colon) {
                next()
                ty = typeReference()
            }
            if (pseudo == PseudoToken.Equal) {
                next()
                dflt = expression()
            }
            return builder.Parameter(nm, ty, dflt)
        })
    }

    function formalIntrinsicParameter(): Element | null {
        if (current != Token.Identifier) return null
        return ctx(() => {
            const nm = name()
            expect(Token.Colon)
            const ty = typeReference()
            return builder.Parameter(nm, ty, undefined)
        })
    }

    function call(target: Element): Element {
        // Don't use ctx here because we need to borrow the parent
        // context because that is where target is from.
        let typeArguments: Element[] = []
        if (pseudo == PseudoToken.LessThan) {
            expectPseudo(PseudoToken.LessThan)
            typeArguments = list(formalTypeParameter)
            expectPseudo(PseudoToken.GreaterThan)
        }
        let args: Element[] = []
        if (current != Token.LBrace) {
            args = delimited(Token.LParen, Token.RParen, () => list(argument))
        }
        if (current == Token.LBrace) {
            args.push(lambda())
        }
        return builder.Call(target, args, typeArguments)
    }

    function index(target: Element): Element {
        expect(Token.LBrack)
        const index = expression()
        expect(Token.RBrack)
        return builder.Index(target, index)
    }

    function argument(): Element | null {
        return ctx(() => {
            switch (current) {
                case Token.Symbol:
                    expectPseudo(PseudoToken.Spread)
                    const target = expression()
                    return builder.Spread(target)
                case Token.Identifier: {
                    const nm = name()
                    expect(Token.Colon)
                    const value = expression()
                    return builder.NamedArgument(nm, value)
                }
                case Token.Colon: {
                    next()
                    const value = expression()
                    const nm = rightMostNameOf(value)
                    return builder.NamedArgument(nm, value)
                    break
                }
            }
            return null
        })
    }

    function primitiveExpression(): Element | null {
        return ctx(() => {
            switch (current) {
                case Token.Literal:
                    const value = scanner.value
                    next()
                    return builder.Literal(value, scanner.literal)
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
                case Token.LBraceBang:
                    return intrinsicLambda()
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
        })
    }

    function valueInitializer(): Element {
        return ctx(() => {
            expect(Token.LBrack)
            const qualifier = optional(typeQualifier)
            const members = list(memberInitializer)
            expect(Token.RBrack)
            return builder.ValueLiteral(members, qualifier)
        })
    }

    function typeQualifier(): Element {
        return pseudoDelimited(PseudoToken.LessThan, PseudoToken.GreaterThan, typeReference)
    }

    function arrayInitializerElement(): Element {
        if (pseudo == PseudoToken.Spread) {
            return ctx(() => {
                next()
                const target = expression()
                return builder.Spread(target)
            })
        }
        return expression()
    }
    function valueArrayInitializer(): Element {
        return ctx(() => {
            const elements = delimited(Token.LBrack, Token.RBrack, () => {
                return list(arrayInitializerElement)
            })
            return builder.ValueArrayLiteral(elements)
        })
    }

    function entityInitializer(): Element {
        return ctx(() => {
            expect(Token.LBrackBang)
            const qualifier = optional(typeQualifier)
            const members = list(memberInitializer)
            expect(Token.BangRBrack)
            return builder.EntityLiteral(members, qualifier)
        })
    }

    function entityArrayInitializer() {
        return ctx(() => {
            const elements = delimited(Token.LBrackBang, Token.BangRBrack, () => {
                return list(expression)
            })
            return builder.EntityArrayLiteral(elements)
        })
    }

    function lastOf(element: Element): Element | null {
        let last: Element | null = null
        for (const child of childrenOf(element)) {
            last = child
        }
        return last
    }

    function rightMostNameOf(element: Element): Name {
        function findRightMostNameOf(element: Element | null): Name | null {
            if (element === null) return null
            if (element.kind === ElementKind.Name)
                return element
            return findRightMostNameOf(lastOf(element))
        }

        const result = findRightMostNameOf(element)
        if (result === null) {
            report("Expected a name as the right most symbol")
        }
        return result
    }

    function memberInitializer(): Element | null {
        return ctx(() => {
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
                    return builder.NamedMemberInitializer(n, value)
            }

            const n = name()
            expect(Token.Colon)
            const value = expression()
            return builder.NamedMemberInitializer(n, value)
        })
    }

    function whenExpression(): WhenElement {
        return ctx(() => {
            expectPseudo(PseudoToken.When)
            let exp: Optional<Element>
            if (current == Token.LParen) {
                exp = parenDelimited(expression)
            }
            expect(Token.LBrace)
            const clauses = list(whenClause)
            expect(Token.RBrace)
            return builder.When(exp, clauses)
        })
    }

    function whenClause(): Element {
        return ctx(() => {
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
        })
    }

    function ifExpression(): Element {
        return ctx(() => {
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
        })
    }

    function optionalExpression(): Optional<Element> {
        let result: Optional<Element>
        if (expressionStart()) {
            result = expression()
        }
        return result
    }

    function reference(): Element {
        return ctx(() => {
            let result: Element = name()
            while (current == Token.Dot) {
                next()
                const member = name()
                result = builder.Selection(result, member)
            }
            return result
        })
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

    function letDeclaration(): NamedMemberElement {
        return ctx(() => {
            expect(Token.Let)
            const nm = name()
            const ty = optionalType()
            expectPseudo(PseudoToken.Equal)
            switch (current) {
                case Token.VocabStart: {
                    const initializer = vocabularyLiteral()
                    return builder.LetDeclaration(nm, ty, initializer)
                }
                case Token.ConstraintStart: {
                    if (ty) {
                        report("Unexpected type for a constraint")
                    }
                    const initializer = constraintLiteral()
                    return builder.LetDeclaration(nm, undefined, initializer)
                }
                case Token.Symbol:
                    switch (pseudo) {
                        case PseudoToken.LessThan: {
                            const initializer = valueTypeLiteral()
                            return builder.LetDeclaration(nm, ty, initializer)
                        }
                        case PseudoToken.LessThanBang: {
                            const initializer = mutableTypeLiteral()
                            return builder.LetDeclaration(nm, ty, initializer)
                        }
                    }
                    break
            }
            const initializer = longest(typeReference, expression) ?? report("Expression expected")
            return builder.LetDeclaration(nm, ty, initializer)
        })
    }

    function valDeclaration(): Element {
        return ctx(() => {
            expect(Token.Val)
            const nm = name()
            const ty = optionalType()
            const initializer = optionalInitializer()
            return builder.ValDeclaration(nm, ty, initializer)
        })
    }

    function varDeclaration() {
        return ctx(() => {
            expect(Token.Var)
            const nm = name()
            const ty = optionalType()
            const initializer = optionalInitializer()
            return builder.VarDeclaration(nm, ty, initializer)
        })
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
        separatorState = SeparatorState.normal
    }

    function separator(): boolean {
        if (current == Token.Comma) {
            next()
            return true
        } else if (scanner.newline >= 0) {
            switch (separatorState) {
                case SeparatorState.wasInfix:
                case SeparatorState.implied:
                    return false
                case SeparatorState.possibleInfix:
                    if (pseudo != PseudoToken.Escaped) {
                        const op = findOperator(OperatorPlacement.Infix, false)
                        if (op) {
                            return false
                        }
                    }
                    break
            }
            separatorState = SeparatorState.implied
            return true
        }
        return false
    }

    function delimited<T>(start: Token, end: Token, element: () => T): T {
        expect(start)
        const result = element()
        expect(end)
        return result
    }

    function parenDelimited<T>(element: () => T): T {
        return noExclude(() => delimited(Token.LParen, Token.RParen, element))
    }

    function pseudoDelimited<T>(start: PseudoToken, end: PseudoToken, element: () => T): T {
        expectPseudo(start)
        const result = exclude(end, () => element())
        expectPseudo(end)
        return result
    }

    function noExclude<T>(block: () => T) {
        const savedExcluded = excluded
        try {
            excluded = []
            return block()
        } finally {
            excluded = savedExcluded
        }
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
            if (element == yes) return yes()
            const cloned = scanner.clone()
            const clonedCurrent = current
            const clonedPseudo = pseudo
            const clonedExcluded = excluded.slice()
            const clonedSeperatorState = separatorState
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
            separatorState = clonedSeperatorState
        }
        if (err) throw err
        return null
    }

    function longest<T>(...elements: (() => T | null)[]): T | null {
        let err: any = undefined
        let errorOffset = 0
        let longestSoFar: T | null = null
        let longestOffset = 0
        let longestScanner = scanner
        let longestCurrent = current
        let longestPseudo = pseudo
        let longestExcluded = excluded
        let longestSeperatorState = separatorState
        for (let element of elements) {
            if (element == yes) return yes()
            const cloned = scanner.clone()
            const clonedCurrent = current
            const clonedPseudo = pseudo
            const clonedExcluded = excluded.slice()
            const clonedSeperatorState = separatorState
            try {
                const result = element()
                const offset = scanner.offset
                if (offset > longestOffset) {
                    longestSoFar = result
                    longestOffset = offset
                    longestScanner = scanner
                    longestCurrent = current
                    longestPseudo = pseudo
                    longestExcluded = excluded
                    longestSeperatorState = separatorState
                }
            } catch (e) {
                const offset = scanner.offset
                if (offset > errorOffset) {
                    err = e
                    errorOffset = offset
                }
            }
            scanner = cloned
            current = clonedCurrent
            pseudo = clonedPseudo
            excluded = clonedExcluded
            separatorState = clonedSeperatorState
        }
        if (err && !longestSoFar) throw err
        scanner = longestScanner
        current = longestCurrent
        pseudo = longestPseudo
        excluded = longestExcluded
        separatorState = longestSeperatorState
        return longestSoFar
    }

    function yes<T>(): T { return undefined as any as T }
    function optional<T>(element: () => T | null | undefined): Optional<T> {
        const result = first(element, yes as () => undefined)
        if (result === null) return undefined
        return result
    }

    function report(error: string): never {
        const fb = scanner.fileBuilder
        if (fb) {
            const loc = fb.location(scanner.start, scanner.offset)
            const position = fb.position(loc)
            throw Error(`${position.display()}: ${error}`)
        } else {
            throw Error(`${error} on ${scanner.line}`)
        }
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

    function ctx<T>(block: () => T): T {
        try {
            builder.pushContext()
            return block()
        } finally {
            builder.popContext()
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

class SelectedOperator {
    name: string
    level: PrecedenceLevel
    associativity: OperatorAssociativity
    placement: OperatorPlacement

    constructor(
        name: string,
        level: PrecedenceLevel,
        associativity: OperatorAssociativity,
        placement: OperatorPlacement
    ) {
        this.name = name
        this.level = level
        this.associativity = associativity
        this.placement = placement
    }

    isHigherThan(level: PrecedenceLevel): boolean {
        return (level == this.level && this.associativity == OperatorAssociativity.Right) ||
            this.level.isHigherThan(level)
    }
}

const enum SeparatorState {
    normal,
    wasInfix,
    possibleInfix,
    implied
}