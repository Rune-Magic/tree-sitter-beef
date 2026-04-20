// swift-tools-version:5.3
import PackageDescription

let package = Package(
    name: "TreeSitterBeef",
    products: [
        .library(name: "TreeSitterBeef", targets: ["TreeSitterBeef"]),
    ],
    dependencies: [
        .package(url: "https://github.com/ChimeHQ/SwiftTreeSitter", from: "0.9.0"),
    ],
    targets: [
        .target(
            name: "TreeSitterBeef",
            dependencies: [],
            path: ".",
            sources: [
                "src/parser.c",
                "src/scanner.c",
            ],
            resources: [
                .copy("queries")
            ],
            publicHeadersPath: "bindings/swift",
            cSettings: [.headerSearchPath("src")]
        ),
        .testTarget(
            name: "TreeSitterBeefTests",
            dependencies: [
                "SwiftTreeSitter",
                "TreeSitterBeef",
            ],
            path: "bindings/swift/TreeSitterBeefTests"
        )
    ],
    cLanguageStandard: .c11
)
