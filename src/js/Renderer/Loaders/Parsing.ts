/**
 * splits string into array, at all whitespaces
 */
export function splitStringAtWhitespaces(string: string) {
	return string.trim().split(/\s+/);
}

/**
 * trims all elements of an array
 */
export function trimStringsInArray(array: string[]) {
	for (let i = 0; i < array.length; ++i) {
		array[i] = array[i].trim();
	}
	return array;
}

/**
 * parses all string elements and turns them into floats
 */
export function parseFloatsInArray(array: (string | number)[]) {
	const len = array.length;

	for (let i = 0; i < len; ++i) {
		array[i] = parseFloat(array[i] as string);
		if (isNaN(array[i] as number)) { return false; }
	}
	return true;
}

/**
 * splits a string into lines and has handy
 * functions to step through the lines
 */
export class LineParser {
	private lines: string[]
	private pos = 0

	constructor(sourceString: string, trimAllLines = false) {
		this.lines = sourceString.split(/\r\n|\r|\n/);

		if (trimAllLines) {
			trimStringsInArray(this.lines); // is faster than splitting at /\s*[\r\n]\s*/
		}
	}

	peekLine() {
		return this.lines[this.pos];
	}

	skipLine() {
		++this.pos;
	}

	checkLineKeyword(keyword: string, checkCase = false) {
		const line = this.peekLine().substring(0, keyword.length);

		if (checkCase) {
			return keyword === line;
		}
		else {
			return keyword.toUpperCase() === line.toUpperCase();
		}
	}

	getLine() {
		return this.lines[this.pos++];
	}

	eof() {
		return this.pos >= this.lines.length;
	}

	getLinePos() {
		return this.pos;
	}

	error(message: string) {
		throw Error("Parsing error at line " + this.getLinePos() + ": " + message);
	}
}
