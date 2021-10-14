export interface Location {
    start: number
    end: number
}

export function isValid(loc: Location) {
    return loc.start < 0 || loc.end < 0 || loc.start < loc.end
}

export interface Position {
    fileName: string
    column: number
    line: number
    isValid: boolean
    display(): string
}

export interface File {
    fileName: string
    size: number
    position(loc: Location): Position
}

export interface FileBuilder {
    addLine(offset: number): void
    location(start: number, end: number): Location
    position(loc: Location): Position
    pos(offset: number): number
    build(): File
}

export class FileSet {
    private lastBase = 1
    private bases: number[] = []
    files: File[] = []

    buildFile(fileName: string, size: number): FileBuilder {
        const base = this.lastBase
        this.lastBase += size
        const index = this.bases.length
        this.bases.push(base)
        this.files.push(undefined as any as File)
        return new FileBuilderImpl(fileName, size, base, this, index)
    }

    file(loc: Location): File {
        const index = find(this.bases, loc.start)
        return this.files[index] 
    }

    position(loc: Location): Position {
        return this.file(loc).position(loc)
    }
}

class FileBuilderImpl implements FileBuilder {
    fileName: string
    base: number
    size: number
    lines: number[] = [0]
    fileSet: FileSet
    index: number

    constructor(fileName: string, size: number, base: number, fileSet: FileSet, index: number) {
        this.fileName = fileName
        this.size = size
        this.base = base
        this.fileSet = fileSet
        this.index = index
    }

    addLine(offset: number): void {
        if (this.lines.length == 0 || this.lines[this.lines.length-1] < offset) {
            this.lines.push(offset)
        } else {
            const index = search(this.lines, offset)
            if (index < 0) {
                this.lines.splice(-index - 1, 0, offset)
            }
        }
    }

    location(start: number, end: number): Location {
        if (start > end || start < 0 || end > this.size) {
            return new LocationImpl(-1, -1)
        } else {
            return new LocationImpl(this.base + start, this.base + end)
        }
    }

    position(loc: Location) {
        const file = this.build()
        return file.position(loc)
    }

    pos(offset: number): number {
        const size = this.size
        if (offset < 0 || offset >= size)
            return -1
        return offset + this.base
    }

    build(): File {
        const file = new FileImpl(this.fileName, this.size, this.base, this.lines)
        this.fileSet.files[this.index] = file
        return file
    }
}

class LocationImpl implements Location {
    start: number
    end: number
    get length(): number {
        return this.end - this.start
    }

    constructor(start: number, end: number) {
        this.start = start
        this.end = end
    }

    isValid(): boolean {
        return this.start >= 0
    }
}

class PositionImpl implements Position {
    fileName: string
    line: number
    column: number
    length: number
    lineStart: number
    isValid: boolean

    constructor (
        fileName: string, 
        line: number, 
        lineStart: number,
        column: number, 
        length: number
    ) {
        this.fileName = fileName
        this.line = line
        this.lineStart = lineStart
        this.column = column
        this.isValid = length >= 0
        this.length = length
    }

    display(): string {
        if (this.isValid)
            return `${this.fileName}:${this.line}:${this.column}`
        return "<invalid>"
    }
}

class FileImpl implements File {
    fileName: string 
    size: number
    private base: number
    private lines: number[]

    constructor(fileName: string, size: number, base: number, lines: number[]) {
        this.fileName = fileName
        this.size = size
        this.base = base
        this.lines = lines
    }

    position(loc: Location): Position {
        if (isValid(loc)) {
            return this.positionOf(loc.start, loc.end)
        } else {
            return new PositionImpl(this.fileName, -1, -1, -1, -1)
        }
    }

    private positionOf(start: number, end: number): Position {
        const line = this.lineOf(start)
        if (line < 0) 
            return new PositionImpl(this.fileName, line, 0, 0, -1)
        const lineStart = this.lines[line]
        const column = (start - this.base) - lineStart + 1
        return new PositionImpl(this.fileName, line + 1, lineStart, column, end - start)
    }

    private lineOf(position: number): number {
        const offset = position - this.base
        if (offset < 0 || offset >= this.size) {
            return -2
        }
        const line = find(this.lines, offset)
        const lineStart = this.lines[line]
        if (lineStart > offset) {
            if (line > 0) return line - 1
            return 0
        }
        return line
    }
}

function search(arr: number[], value: number): number {
    let start = 0
    let end = arr.length - 1
    while (start <= end) {
        const mid = (start + end) >> 1
        const v = arr[mid]
        if (value > v) {
            start = mid + 1
        } else if (value < v) {
            end = mid - 1
        } else {
            return mid
        }
    }
    return -start - 1
}

function find(arr: number[], value: number): number {
    const index = search(arr, value)
    if (index < 0) {
        const effective = -index - 1
        const len = arr.length
        if (effective >= len) {
            return len - 1
        }
        return effective
    }
    return index
}