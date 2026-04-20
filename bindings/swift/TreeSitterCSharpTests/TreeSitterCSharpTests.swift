import XCTest
import SwiftTreeSitter
import TreeSitterBeef

final class TreeSitterBeefTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_beef())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading C# grammar")
    }
}
