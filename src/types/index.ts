import { ElementKind } from "../ast";

export const enum TypeKind {
    Value,
    Record,
    ArrayValue,
    ArrayRecord,
    Reference,
    Function
}

export interface TypeDescription {
    kind: TypeKind
}
