import { ElementBuilder, ElementKind, OperatorPlacement, OperatorPrecedenceRelation } from "./ast"
import { Literal } from "./tokens"

describe("ast", () => {
    describe("builder", () => {
        it("can create a builder", () => {
            const context = {}
            c(new ElementBuilder(context))
        })

        const builder = new ElementBuilder({})

        it("can push and pop a context", () => {
            builder.PushContext()
            builder.PopContext()
        })
        it("can create a name", () => {
            const n = builder.Name("test")
            expect(n.kind).toBe(ElementKind.Name)
            expect(n.text).toBe("test")
        })

        const t = builder.Name("test")
        const v = builder.Name("value")

        it("can create a literal", () => {
            const n = builder.Literal(1n, Literal.Int32)
            expect(n.kind).toBe(ElementKind.Literal)
            expect(n.literal).toBe(Literal.Int32)
            expect(n.value).toBe(1n)
        })
        it("can create a break", () => {
            const n = builder.Break(undefined)
            expect(n.kind).toBe(ElementKind.Break)
            expect(n.label).toBeUndefined()
        })
        it("can create a continue", () => {
            const n = builder.Continue(undefined)
            expect(n.kind).toBe(ElementKind.Continue)
            expect(n.label).toBeUndefined()
        })
        it("can create a selection", () => {
            const n = builder.Selection(t)
            expect(n.kind).toBe(ElementKind.Selection)
            expect(n.target).toBe(t)
        })
        it("can create a call", () => {
            const n = builder.Call(t, [], [])
            expect(n.kind).toBe(ElementKind.Call)
            expect(n.target).toBe(t)
            expect(n.arguments).toEqual([])
            expect(n.typeArguments).toEqual([])
        })
        it("can create a value literal", () => {
            const n = builder.ValueLiteral([])
            expect(n.kind).toBe(ElementKind.ValueLiteral)
            expect(n.members).toEqual([])
        })
        it("can create an entity literal", () => {
            const n = builder.EntityLiteral([])
            expect(n.kind).toBe(ElementKind.EntityLiteral)
            expect(n.members).toEqual([])
        })
        it("can create an value array literal", () => {
            const n = builder.ValueArrayLiteral([])
            expect(n.kind).toBe(ElementKind.ValueArrayLiteral)
            expect(n.elements).toEqual([])
        })
        it("can create an entity array literal", () => {
            const n = builder.EntityArrayLiteral([])
            expect(n.kind).toBe(ElementKind.EntityArrayLiteral)
            expect(n.elements).toEqual([])
        })
        it("can create a let declaration", () => {
            const n = builder.LetDeclaration(t, undefined, t)
            expect(n.kind).toBe(ElementKind.LetDeclaration)
            expect(n.name).toBe(t)
            expect(n.type).toBeUndefined()
            expect(n.initializer).toBe(t)
        })
        it("can create a var declaration", () => {
            const n = builder.VarDeclaration(t, undefined, t)
            expect(n.kind).toBe(ElementKind.VarDeclaration)
            expect(n.name).toBe(t)
            expect(n.type).toBeUndefined()
            expect(n.initializer).toBe(t)
        })
        it("can create a val declaration", () => {
            const n = builder.ValDeclaration(t, undefined, t)
            expect(n.kind).toBe(ElementKind.ValDeclaration)
            expect(n.name).toBe(t)
            expect(n.type).toBeUndefined()
            expect(n.initializer).toBe(t)
        })
        it("can create a lambda", () => {
            const n = builder.Lambda([t], undefined, [t, t], t)
            expect(n.kind).toBe(ElementKind.Lambda)
            expect(n.parameters).toEqual([t])
            expect(n.typeParameters).toBeUndefined()
            expect(n.body).toEqual([t, t])
            expect(n.result).toEqual(t)
        })
        it("can create a intrinsic lambda", () => {
            const n = builder.IntrinsicLambda([t], undefined, [t, t], t)
            expect(n.kind).toBe(ElementKind.IntrinsicLambda)
            expect(n.parameters).toEqual([t])
            expect(n.typeParameters).toBeUndefined()
            expect(n.body).toEqual([t, t])
            expect(n.result).toEqual(t)
        })
        it("can create a loop", () => {
            const n = builder.Loop(undefined, t)
            expect(n.kind).toBe(ElementKind.Loop)
            expect(n.body).toBe(t)
        })
        it("can create a parameter", () => {
            const n = builder.Parameter(t, t, undefined)
            expect(n.kind).toBe(ElementKind.Parameter)
            expect(n.name).toBe(t)
            expect(n.type).toBe(t)
            expect(n.default).toBeUndefined()
        })
        it("can create a return", () => {
            const n = builder.Return(t)
            expect(n.kind).toBe(ElementKind.Return)
            expect(n.value).toBe(t)
        })
        it("can create a when", () => {
            const n = builder.When(t, [])
            expect(n.kind).toBe(ElementKind.When)
            expect(n.expression).toBe(t)
            expect(n.clauses).toEqual([])
        })
        it("can create a when value clause", () => {
            const n = builder.WhenValueClause(v, t)
            expect(n.kind).toBe(ElementKind.WhenValueClause)
            expect(n.value).toBe(v)
            expect(n.body).toBe(t)
        })
        it("can create a when else clause", () => {
            const n = builder.WhenElseClause(t)
            expect(n.kind).toBe(ElementKind.WhenElseClause)
            expect(n.body).toBe(t)
        })
        it("can create a type literal", () => {
            const n = builder.TypeLiteral([])
            expect(n.kind).toBe(ElementKind.TypeLiteral)
            expect(n.members).toEqual([])
        })
        it("can create a constraint literal", () => {
            const n = builder.ConstraintLiteral([])
            expect(n.kind).toBe(ElementKind.ConstraintLiteral)
            expect(n.members).toEqual([])
        })
        it("can create a vocabulary literal", () => {
            const n = builder.VocabularyLiteral([])
            expect(n.kind).toBe(ElementKind.VocabularyLiteral)
            expect(n.members).toEqual([])
        })
        it("can create a array type", () => {
            const n = builder.ArrayType(t)
            expect(n.kind).toBe(ElementKind.ArrayType)
            expect(n.operant).toBe(t)
        })
        it("can create an optional type", () => {
            const n = builder.OptionalType(t)
            expect(n.kind).toBe(ElementKind.OptionalType)
            expect(n.operant).toBe(t)
        })
        it("can create an and type", () => {
            const n = builder.AndType(v, t)
            expect(n.kind).toBe(ElementKind.AndType)
            expect(n.left).toBe(v)
            expect(n.right).toBe(t)
        })
        it("can create an or type", () => {
            const n = builder.OrType(v, t)
            expect(n.kind).toBe(ElementKind.OrType)
            expect(n.left).toBe(v)
            expect(n.right).toBe(t)
        })
        it("can create a vocabulary dececlaraiton", () => {
            const p = builder.VocabularyOperatorPrecedence(
                t, undefined, OperatorPrecedenceRelation.After
            )
            const n = builder.VocabularyOperatorDeclaration(
                [], OperatorPlacement.Infix, p
            )
            expect(n.kind).toBe(ElementKind.VocabularyOperatorDeclaration)
            expect(n.names).toEqual([])
            expect(n.placement).toBe(OperatorPlacement.Infix)
            expect(n.precedence).toBe(p)
        })
    
        function c(v: any) {
            expect(v).not.toBeNull()
        }
    })
})