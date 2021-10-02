import { Literal } from './tokens'

export const enum ElementKind {
    Name,
    Literal,
    Selection,
    Spread,
    Break,
    Continue,
    Call,
    ValueLiteral,
    EntityLiteral,
    ValueArrayLiteral,
    EntityArrayLiteral,
    LetDeclaration,
    VarDeclaration,
    ValDeclaration,
    Lambda,
    IntrinsicLambda,
    Loop,
    Parameter,
    Return,
    When,
    WhenValueClause,
    WhenElseClause,
    TypeLiteral,
    ConstraintLiteral,
    VocabularyLiteral,
    ArrayType,
    OptionalType,
    OrType,
    AndType,
    VocabularyOperatorDeclaration,
}

type Optional<T> = T | undefined

export interface Element {
    kind: ElementKind
 }

export interface Name extends Element {
    kind: ElementKind.Name
    text: string
}

export interface NamedElement extends Element {
    name: Name
}

export interface TypedElement extends Element {
    type: Element
}

export interface LiteralElement extends Element {
    kind: ElementKind.Literal
    value: any
    literal: Literal
}

export interface SelectionElement extends Element {
    kind: ElementKind.Selection
    target: Element
}

export interface SpreadElement extends Element {
    kind: ElementKind.Spread
    target: Element 
}

export interface BreakElement extends Element {
    kind: ElementKind.Break
    label: Optional<Element>
}

export interface ContinueElement extends Element {
    kind: ElementKind.Continue
    label: Optional<Element>
}

export interface CallElement extends Element {
    kind: ElementKind.Call
    target: Element
    arguments: Element[]
    typeArguments: Optional<Element[]>
}

export interface InitalizerElement extends Element {
    kind: ElementKind.ValueLiteral | ElementKind.EntityLiteral
    members: Element[]
}

export interface ArrayInitalizerElement extends Element {
    kind: ElementKind.ValueArrayLiteral | ElementKind.EntityArrayLiteral
    elements: Element[]
}

export interface NamedMemberElement extends NamedElement {
    kind: ElementKind.LetDeclaration | ElementKind.VarDeclaration | ElementKind.ValDeclaration
    type: Optional<Element>
    initializer: Optional<Element>
}

export interface LambdaElement extends Element {
    kind: ElementKind.Lambda | ElementKind.IntrinsicLambda
    parameters: Element[]
    typeParameters: Optional<Element[]>
    body: Element[]
    result: Element
}

export interface LoopElement extends Element {
    kind: ElementKind.Loop
    label: Optional<Name>
    body: Element
}

export interface ParameterElement extends NamedElement, TypedElement {
    kind: ElementKind.Parameter
    default: Optional<Element>
}

export interface ReturnElement extends Element {
    kind: ElementKind.Return
    value: Optional<Element>
}

export interface WhenElement extends Element {
    kind: ElementKind.When
    expression: Optional<Element>
    clauses: Element[]
}

export interface WhenValueClauseElement extends Element {
    kind: ElementKind.WhenValueClause
    value: Element
    body: Element
}

export interface WhenElseClauseElement extends Element {
    kind: ElementKind.WhenElseClause
    body: Element
}

export interface TypeLiteralElement extends Element {
    kind: ElementKind.TypeLiteral | ElementKind.ConstraintLiteral | ElementKind.VocabularyLiteral
    members: Element[]
}

export interface TypeUnaryExpression extends Element {
    kind: ElementKind.ArrayType | ElementKind.OptionalType
    operant: Element
}

export interface TypeBinaryExpression extends Element {
    kind: ElementKind.OrType | ElementKind.AndType
    left: Element
    right: Element
}

export enum OperatorPlacement {
    Prefix,
    Infix,
    PostFix,
    Unspecified,
}

export enum OperatorAssociativity {
    Left,
    Right,
    Unspecified,
}

export enum OperatorPrecedenceRelation {
    Before,
    After,
}

export interface VocabularyOperatorDeclarationElement extends Element {
    kind: ElementKind.VocabularyOperatorDeclaration
    names: Name[]
    placement: Optional<OperatorPlacement>
    precedence: Optional<VocabularyOperatorPrecedence>
}

export interface VocabularyOperatorPrecedence {
    name: Name
    placement: Optional<OperatorPlacement>
    relation: OperatorPrecedenceRelation
}

export interface BuilderContext { }

export class ElementBuilder {
    private context: BuilderContext

    constructor(context: BuilderContext) {
        this.context = context
    }

    PushContext() {}
    PopContext() {}

    Name(text: string): Name {
        return { kind: ElementKind.Name, text }
    }

    Literal(value: any, literal: Literal): LiteralElement {
        return { kind: ElementKind.Literal, value, literal }
    }

    Break(label: Optional<Element>): BreakElement {
        return { kind: ElementKind.Break, label }
    }

    Continue(label: Optional<Element>): ContinueElement {
        return { kind: ElementKind.Continue, label }
    }

    Selection(target: Element): SelectionElement {
        return { kind: ElementKind.Selection, target }
    }

    Call(target: Element, args: Element[], typeArguments: Optional<Element[]>): CallElement {
        return { kind: ElementKind.Call, target, arguments: args, typeArguments }
    }

    ValueLiteral(members: Element[]): InitalizerElement {
        return { kind: ElementKind.ValueLiteral, members }
    }

    EntityLiteral(members: Element[]): InitalizerElement {
        return { kind: ElementKind.EntityLiteral, members }
    }

    ValueArrayLiteral(elements: Element[]): ArrayInitalizerElement {
        return { kind: ElementKind.ValueArrayLiteral, elements }
    }

    EntityArrayLiteral(elements: Element[]): ArrayInitalizerElement {
        return { kind: ElementKind.EntityArrayLiteral, elements }
    }

    LetDeclaration(name: Name, type: Optional<Element>, initializer: Element): NamedMemberElement {
        return { kind: ElementKind.LetDeclaration, name, type, initializer }
    }

    VarDeclaration(name: Name, type: Optional<Element>, initializer: Optional<Element>): NamedMemberElement {
        return { kind: ElementKind.VarDeclaration, name, type, initializer }
    }

    ValDeclaration(name: Name, type: Optional<Element>, initializer: Optional<Element>): NamedMemberElement {
        return { kind: ElementKind.ValDeclaration, name, type, initializer}
    }

    Lambda(parameters: Element[], typeParameters: Optional<Element[]>, body: Element[], result: Element): LambdaElement {
        return { kind: ElementKind.Lambda, parameters, typeParameters, body, result }
    }

    IntrinsicLambda(parameters: Element[], typeParameters: Optional<Element[]>, body: Element[], result: Element): LambdaElement {
        return { kind: ElementKind.IntrinsicLambda, parameters, typeParameters, body, result }
    }

    Loop(label: Optional<Name>, body: Element): LoopElement {
        return { kind: ElementKind.Loop, label, body }
    }

    Parameter(name: Name, type: Element, dflt: Optional<Element>): ParameterElement {
        return { kind: ElementKind.Parameter, name, type, default: dflt }
    }

    Return(value: Optional<Element>): ReturnElement {
        return { kind: ElementKind.Return, value }
    }

    When(expression: Optional<Element>, clauses: Element[]): WhenElement {
        return { kind: ElementKind.When, expression, clauses }
    }

    WhenValueClause(value: Element, body: Element): WhenValueClauseElement {
        return { kind: ElementKind.WhenValueClause, value, body}
    }

    WhenElseClause(body: Element): WhenElseClauseElement {
        return { kind: ElementKind.WhenElseClause, body }
    }

    TypeLiteral(members: Element[]): TypeLiteralElement {
        return { kind: ElementKind.TypeLiteral, members }
    }

    ConstraintLiteral(members: Element[]): TypeLiteralElement {
        return { kind: ElementKind.ConstraintLiteral, members }
    }

    VocabularyLiteral(members: Element[]): TypeLiteralElement {
        return { kind: ElementKind.VocabularyLiteral, members }
    }

    ArrayType(operant: Element): TypeUnaryExpression {
        return { kind: ElementKind.ArrayType, operant }
    }

    OptionalType(operant: Element): TypeUnaryExpression {
        return { kind: ElementKind.OptionalType, operant }
    }

    OrType(left: Element, right: Element): TypeBinaryExpression {
        return { kind: ElementKind.OrType, left, right }
    }

    AndType(left: Element, right: Element): TypeBinaryExpression {
        return { kind: ElementKind.AndType, left, right }
    }

    VocabularyOperatorDeclaration(
        names: Name[],
        placement: Optional<OperatorPlacement>,
        precedence: Optional<VocabularyOperatorPrecedence>   
    ): VocabularyOperatorDeclarationElement {
        return { 
            kind: ElementKind.VocabularyOperatorDeclaration,
            names,
            placement,
            precedence
        }
    }

    VocabularyOperatorPrecedence(
        name: Name,
        placement: Optional<OperatorPlacement>,
        relation: OperatorPrecedenceRelation    
    ): VocabularyOperatorPrecedence {
        return { name, placement, relation }
    }
}