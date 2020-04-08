import * as assert from 'assert';
import { getErrorMessage, TestCase } from "../common";
import { TypeSearch } from "../../../typeSearch";

suite('CodeSearch.hintOfSimilarParam', function() {

    test("finds lone param", () => {
        const expected = "str";
        const param = "test";
        let src = `def func(${param}: str):\ndef test(self, ${param}:`;
        let actual = TypeSearch.hintOfSimilarParam(param, src);
        assert.equal(actual, expected, getErrorMessage(src, expected, actual));
    });

    test("finds param with preceding parameters", () => {
        const expected = "str";
        const param = "test";

        let src = `def func(self, p1: int,${param}: str):\ndef test(self, ${param}:`;
        let actual = TypeSearch.hintOfSimilarParam(param, src);
        assert.equal(actual, expected, getErrorMessage(src, expected, actual));
    });
    
    test("finds param with trailing parameters", () => {
        const expected = "str";
        const param = "test";

        let src = `def func(self, ${param}: str,new: int):\ndef test(self, ${param}:`;
        let actual = TypeSearch.hintOfSimilarParam(param, src);
        assert.equal(actual, expected, getErrorMessage(src, expected, actual));
    });

    test("handles line breaks in function definition", () => {
        const expected = "str";
        const param = "test";

        let src = `def func(\n\t${param}: str,new: int):\ndef test(self, ${param}:`;
        let actual = TypeSearch.hintOfSimilarParam(param, src);
        assert.equal(actual, expected, getErrorMessage(src, expected, actual));
    });

    test("doesn't match param name within other text", () => {
        const expected = null;
        const param = "test";

        let src = `def func(text${param}: str,new: int):\ndef test(self, text${param}:`;
        let actual = TypeSearch.hintOfSimilarParam(param, src);
        assert.equal(actual, expected, getErrorMessage(src, expected, actual));
    });

    test("excludes default values", () => {
        const expected = "str";
        const param = "test";

        let src = `def func(${param}: str = 'exclude',new: int):\ndef test(self, text${param}:`;
        let actual = TypeSearch.hintOfSimilarParam(param, src);
        assert.equal(actual, expected, getErrorMessage(src, expected, actual));
    });
});