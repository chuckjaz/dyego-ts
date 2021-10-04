import { 
    Element, ElementKind, Name, OperatorAssociativity, OperatorPlacement, OperatorPrecedenceRelation, 
    VocabularyLiteralElement 
} from './ast'

export class PrecedenceLevel {
    higher: PrecedenceLevel | null = null
    lower: PrecedenceLevel | null = null

    makeLower(): PrecedenceLevel {
        const newLevel = new PrecedenceLevel()
        const lower = this.lower
        newLevel.lower = lower
        newLevel.higher = this
        if (lower)
            lower.higher = newLevel
        this.lower = newLevel
        return newLevel
    }

    makeHigher(): PrecedenceLevel {
        const newLevel = new PrecedenceLevel()
        const higher = this.higher
        newLevel.higher = higher
        newLevel.lower = this
        if (higher)
            higher.lower = newLevel
        this.higher = newLevel
        return newLevel
    }

    isHigherThan(other: PrecedenceLevel): boolean {
        if (this === other) {
            return false
        }
        let higher: PrecedenceLevel | null = this
        let lower: PrecedenceLevel | null  = this
        while(higher !== null || lower !== null) {
            if (higher === other) {
                return false
            }
            if (lower === other) {
                return true
            }
            higher = higher ? higher.higher : higher
            lower = lower ? lower.lower : lower
        }
        return false
    }

    level(): number {
        if (this.lower !== null) return this.lower.level() + 1
        return 0
    }
}

export class Operator {
    name: string
    levels: (PrecedenceLevel | null)[]
    associativities: OperatorAssociativity[]

    constructor(name: string, levels: (PrecedenceLevel | null)[], associativites: OperatorAssociativity[]) {
        this.name = name
        this.levels = levels
        this.associativities = associativites
    }
}

export class Vocabulary {
    members = new Map<string, Operator>()
    scope = new VocabularyScope()

    get(name: string): Operator | undefined {
        return this.members.get(name)
    }
}

export class VocabularyScope {
    members = new Map<string, Vocabulary | VocabularyScope>()

    get(name: string): Vocabulary | VocabularyScope | undefined {
        return this.members.get(name)
    }
}

class VocabularyEmbeddingContext {
    result = new Vocabulary()
    rootLevel = new PrecedenceLevel()
    lowestLevel = this.rootLevel
    precedenceMap = new Map<PrecedenceLevel, PrecedenceLevel>()

    mappedPrecedence(precedence: PrecedenceLevel | null): PrecedenceLevel {
        if (!precedence) {
            return this.rootLevel
        }
        const level = this.precedenceMap.get(precedence)
        if (level) return level

        const parent = this.mappedPrecedence(precedence.higher)
        const result = parent.makeLower()
        this.precedenceMap.set(precedence, result)
        return result
    }

    mappedPrecedences(precendences: (PrecedenceLevel | null)[]): (PrecedenceLevel | null)[] {
        const result: (PrecedenceLevel | null) [] = [null, null, null]
        let index = 0
        for (const level of precendences) {
            if (level)
                result[index] = this.mappedPrecedence(level)
            index++
        }
        return result
    }

    embedVocabulary(vocabulary: Vocabulary) {
        const members = vocabulary.members
        for (const member of members.values()) {
            this.recordOperator(member.name, this.mappedPrecedences(member.levels), member.associativities)   
        }
        let current = this.rootLevel
        while (current && current.lower) {
            current = current.lower
        }
        this.lowestLevel = current
    }

    findLowest(): PrecedenceLevel {
        let current = this.lowestLevel
        while (current.lower) {
            current = current.lower
        }
        this.lowestLevel = current
        return current
    }

    recordOperator(name: string, levels: (PrecedenceLevel | null)[], associativites: OperatorAssociativity[]) {
        const member = this.result.get(name)
        if (member) {
            for (let placement = OperatorPlacement.Prefix; placement < OperatorPlacement.Unspecified; placement++) {
                if (levels[placement]) {
                    if (!member.levels[placement]) {
                        member.levels[placement] = levels[placement]
                        member.associativities[placement] = associativites[placement]
                    } else {
                        report(`Operator ${name} was already defined`)
                    }
                }
            }
        } else {
            this.result.members.set(name, new Operator(name, levels.slice(0), associativites.slice(0)))
        }
    }
}

function report(message: string): never {
    throw Error(message)
}

export function buildVocabulary(scope: VocabularyScope, literal: VocabularyLiteralElement): Vocabulary {
    const context = new VocabularyEmbeddingContext()
 
    function lookupVocabulary(element: Element): Vocabulary {
       function lookupScope(scope: VocabularyScope, element: Element): VocabularyScope {
           switch (element.kind) {
               case ElementKind.Name:
                    const result = scope.get(element.text)
                    if (result instanceof VocabularyScope) return result
                    report(`Expected ${element.text} to be a vocabulary scope.`)
                case ElementKind.Selection:
                    return lookupScope(lookupScope(scope, element.target), element.member)
                default:
                    report(`Unexpected element: ${element}`)
           }
       }
       
       let effectiveScope = scope
       let effectiveName: Name | null = null
       switch (element.kind) {
           case ElementKind.Name:
               effectiveName = element
               break
            case ElementKind.Selection:
                effectiveScope = lookupScope(scope, element.target)
                effectiveName = element.member
                break
            default:
                report(`Unexpected element: ${element}`)
       }
       if (!effectiveName) report("Internal unexpected error")
       const result = effectiveScope.get(effectiveName.text)
       if (result instanceof Vocabulary) return result
       report(`Expected ${effectiveName.text} to be a vocabulary`)
    }

    // Resolve embedded vocabularies
    const members = literal.members
    for (let member of members) {
        switch (member.kind) {
            case ElementKind.Spread:
                const embeddedVocabulary = lookupVocabulary(member.target)
                context.embedVocabulary(embeddedVocabulary)
                break
            case ElementKind.VocabularyOperatorDeclaration:
                continue
            default:
                report(`Unexpected element: ${member}`)
        }
    }

    // Declare operators
    for (let member of members) {
        switch (member.kind) {
            case ElementKind.Spread:
                continue
            case ElementKind.VocabularyOperatorDeclaration:
                const placement = member.placement
                const associativity = member.associativity
                const associativites: OperatorAssociativity[] = []
                associativites[placement] = associativity
                let level = context.findLowest()
                const precedence = member.precedence
                if (precedence) {
                    const lookup = context.result.get(precedence.name.text)
                    if (!lookup) report(`Could not find operator ${precedence.name.text}`)
                    let referencedPlacement = precedence.placement
                    if (referencedPlacement == OperatorPlacement.Unspecified) {
                        for (let p = OperatorPlacement.Prefix; p < OperatorPlacement.Unspecified; p++) {
                            if (lookup.levels[p]) {
                                if (referencedPlacement != OperatorPlacement.Unspecified) {
                                    report(`Ambigious operator reference ${precedence.name.text}`)
                                }
                                referencedPlacement = p
                            }
                        }
                    }
                    let referenceLevel = lookup.levels[referencedPlacement]
                    if (!referenceLevel) report(`Operator ${precedence.name.text} found`)
                    switch (precedence.relation) {
                        case OperatorPrecedenceRelation.After:
                            referenceLevel = referenceLevel.makeLower()
                            break
                        case OperatorPrecedenceRelation.Before:
                            referenceLevel = referenceLevel.makeHigher()
                            break     
                    }
                    level = referenceLevel
                } else {
                    level = level.makeLower()
                }
                let levels: PrecedenceLevel[] = []
                levels[placement] = level
                for (let name of member.names) {
                    context.recordOperator(name.text, levels, associativites)
                }
                break
        }
    }

    return context.result
}