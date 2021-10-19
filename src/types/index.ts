import { required } from '../assert'
import { Element, Optional } from '../ast'
import { Literal } from '../tokens'
import { TypeContext } from './context'
import { Symbol, Scope, ScopeBuilder, scopeBuilder } from './symbols'

// Types

export const enum TypeKind {
    Value,
    Record,
    Reference,
    Function,
    IntrinicFunction,
    Constraint,
    Module,
    And,
    Or,
}

export interface TypeSymbol extends Symbol {
    readonly type?: Type
}

export function canonicalSymbolOf(typeSym: TypeSymbol): TypeSymbol {
    const type = typeSym.type
    return type ? type.symbol : typeSym
}

interface BoundType extends Symbol {
    readonly type: Type
}

type SimpleBound<T> = Exclude<T, BoundType> | BoundType

export type Bound<T> = SimpleBound<T> | {
    [P in keyof Exclude<T, BoundType>]: Bound<P>
}

export type Type =
    RecordType |
    ValueType |
    ReferenceType |
    FunctionType |
    TypeConstraint |
    AndType |
    OrType |
    ModuleType

export interface TypeBase {
    readonly kind: TypeKind
    readonly symbol: TypeSymbol
    readonly typeParameters: Scope<TypeParameterSymbol>
    readonly container?: TypeSymbol
}

export interface TypeWithMembers extends TypeBase {
    readonly members: Scope<MemberSymbol>
    readonly signatures: Scope<SignatureSymbol>
}

export interface ValueType extends TypeWithMembers {
    readonly kind: TypeKind.Value
}

export interface RecordType extends TypeWithMembers {
    readonly kind: TypeKind.Record
}

export interface ReferenceType extends TypeBase {
    readonly kind: TypeKind.Reference
    readonly referant: TypeSymbol
}

export interface FunctionType extends TypeWithMembers {
    readonly kind: TypeKind.Function
}

export interface IntrinsicFunctionType extends TypeWithMembers {
    readonly kind: TypeKind.IntrinicFunction
}

export interface ModuleType extends TypeWithMembers {
    readonly kind: TypeKind.Module
}

export interface TypeConstraint extends TypeBase {
    readonly kind: TypeKind.Constraint
    readonly type: TypeSymbol
}

export interface BinaryTypeOperator extends TypeBase {
    readonly left: TypeSymbol
    readonly right: TypeSymbol
}

export interface OrType extends TypeBase {
    readonly kind: TypeKind.Or
}

export interface AndType extends TypeBase {
    readonly kind: TypeKind.And
}

// TypeParameter

export interface TypeParameterSymbol extends Symbol {
    readonly typeParameter: TypeParamater
}

export interface TypeParamater {
    readonly constraints: Optional<TypeSymbol>
}

// Members

export const enum MemberKind {
    ValueField,
    MutableField,
    Definition,
    Alias,
}

export type Member =
    ValueFieldMember |
    MutableFieldMember |
    DefinitionMember |
    AliasMember

export interface MemberSymbol extends Symbol {
    readonly member: Member
}

export interface MemberBase {
    readonly kind: MemberKind
    readonly symbol: MemberSymbol
}

export interface ValueFieldMember extends MemberBase {
    readonly kind: MemberKind.ValueField
    readonly type: TypeSymbol
}

export interface MutableFieldMember extends MemberBase {
    readonly kind: MemberKind.MutableField
    readonly type: TypeSymbol
}

export interface DefinitionMember extends MemberBase {
    readonly definition: Definition
}

export interface AliasMember extends MemberBase {
    readonly kind: MemberKind.Alias
    readonly original: MemberSymbol
}

// Definition

export const enum DefinitionKind {
    Constant,
    Function,
    ValueType,
    MutableType,
    Constraint
}

export type TypeDefinitionKind = DefinitionKind.MutableType | DefinitionKind.ValueType | DefinitionKind.Constraint

export type Definition =
    FunctionDefinition |
    ConstantDefinition |
    TypeDefinition

export interface ConstantDefinition {
    readonly kind: DefinitionKind.Constant
    readonly literal: Literal
    readonly value: any
}

export interface FunctionDefinition {
    readonly kind: DefinitionKind.Function
    readonly ast: Element
}

export interface TypeDefinition {
    readonly kind: TypeDefinitionKind
    readonly type: TypeSymbol
}

// Signatures

export interface SignatureSymbol extends Symbol {
    readonly signature: Signature
}

export interface Signature {
    readonly parameter: Scope<ParameterSymbol>
    readonly typeParameters: Scope<TypeParameterSymbol>
    readonly result: TypeSymbol
}

export interface ParameterSymbol extends Symbol {
    readonly parameter: Parameter
}

export const enum ParameterKind {
    Named,
    Block,
    Spread,
}

type Parameter =
    NamedParameter |
    BlockParameter |
    SpreadParameter

export interface ParameterBase {
    readonly kind: ParameterKind
    readonly symbol: ParameterSymbol
    readonly type: TypeSymbol
}

export interface NamedParameter extends ParameterBase {
    readonly kind: ParameterKind.Named
}

export interface BlockParameter extends ParameterBase {
    readonly kind: ParameterKind.Block
}

export interface SpreadParameter extends ParameterBase {
    readonly kind: ParameterKind.Spread
}

export interface TypeBuilder extends  TypeBase, TypeWithMembers {
    readonly kind: TypeKind
    readonly symbol: TypeSymbol
    readonly typeParameters: Scope<TypeParameterSymbol>
    readonly container: TypeSymbol | undefined

    addTypeParameter(parameter: TypeParameterSymbol): void
    addMember(member: MemberSymbol): void
    addSignature(signature: SignatureSymbol): void
    build(): void
}

export function typeBuilder(
    context: TypeContext,
    kind: BuildableTypeKinds,
    symbol: TypeSymbol,
    container?: TypeSymbol
): TypeBuilder {
    return new TypeBuilderImpl(context, kind, symbol, container)
}

export type BuildableTypeKinds =
    TypeKind.Record |
    TypeKind.Value |
    TypeKind.Module |
    TypeKind.Function |
    TypeKind.IntrinicFunction

class TypeBuilderImpl implements TypeBuilder {
    kind: BuildableTypeKinds
    symbol: TypeSymbol
    container: TypeSymbol | undefined
    get typeParameters(): Scope<TypeParameterSymbol> { return this.typeParametersBuilder }
    get members(): Scope<MemberSymbol> { return this.membersBuilder }
    get signatures(): Scope<SignatureSymbol> { return this.signaturesBuilder }

    private context: TypeContext
    private typeParametersBuilder = scopeBuilder<TypeParameterSymbol>()
    private membersBuilder = scopeBuilder<MemberSymbol>()
    private signaturesBuilder = scopeBuilder<SignatureSymbol>()

    constructor(
        context: TypeContext,
        kind: BuildableTypeKinds,
        symbol: TypeSymbol,
        container?: TypeSymbol
    ) {
        this.context = context
        this.kind = kind
        this.symbol = symbol
        this.container = container
    }

    addTypeParameter(parameter: TypeParameterSymbol): boolean {
        return this.enterSymbol(this.typeParametersBuilder, parameter)
    }

    addMember(member: MemberSymbol): boolean {
        return this.enterSymbol(this.membersBuilder, member)
    }

    addSignature(signature: SignatureSymbol): boolean {
        return this.enterSymbol(this.signaturesBuilder, signature)
    }

    build(): Type {
        const type = {
            kind: this.kind,
            symbol: this.symbol,
            typeParameters: this.typeParametersBuilder.build(),
            members: this.membersBuilder.build(),
            signatures: this.signaturesBuilder.build()
        } as Type

        bindType(this.symbol, type)
        return type
    }

    private enterSymbol<S extends Symbol>(builder: ScopeBuilder<S>, symbol: S): boolean {
        const other =
            this.membersBuilder.find(symbol.name) ||
            this.typeParametersBuilder.find(symbol.name) ||
            this.signaturesBuilder.find(symbol.name)
        if (other) {
            this.context.reportError(symbol.location, "Duplicate symbol", other.location)
            return false
        } else {
            required(builder.enter(symbol))
        }
        return true
    }
}

function bindType(symbol: TypeSymbol, type: Type) {
    (symbol as any).type = type
}