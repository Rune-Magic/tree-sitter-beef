package tree_sitter_beef_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_beef "github.com/tree-sitter/tree-sitter-beef/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_beef.Language())
	if language == nil {
		t.Errorf("Error loading C# grammar")
	}
}
