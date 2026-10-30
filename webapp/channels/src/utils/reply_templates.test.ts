// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {
    MAX_REPLY_TEMPLATES,
    MAX_REPLY_TEMPLATE_TEXT_LENGTH,
    MAX_REPLY_TEMPLATE_TITLE_LENGTH,
    parseReplyTemplate,
    validateReplyTemplate,
} from './reply_templates';

describe('utils/reply_templates', () => {
    describe('validateReplyTemplate', () => {
        test('accepts a valid template', () => {
            expect(validateReplyTemplate({title: 'Greeting', text: 'Hello there'}, 0, true)).toEqual([]);
        });

        test('rejects empty title and text', () => {
            expect(validateReplyTemplate({title: '  ', text: ''}, 0, true)).toEqual(['title_empty', 'text_empty']);
        });

        test('enforces title length limit of 40', () => {
            expect(MAX_REPLY_TEMPLATE_TITLE_LENGTH).toBe(40);
            expect(validateReplyTemplate({title: 'a'.repeat(40), text: 'x'}, 0, true)).toEqual([]);
            expect(validateReplyTemplate({title: 'a'.repeat(41), text: 'x'}, 0, true)).toEqual(['title_too_long']);
        });

        test('enforces text length limit of 1000', () => {
            expect(MAX_REPLY_TEMPLATE_TEXT_LENGTH).toBe(1000);
            expect(validateReplyTemplate({title: 't', text: 'b'.repeat(1000)}, 0, true)).toEqual([]);
            expect(validateReplyTemplate({title: 't', text: 'b'.repeat(1001)}, 0, true)).toEqual(['text_too_long']);
        });

        test('enforces limit of 20 templates for new templates only', () => {
            expect(MAX_REPLY_TEMPLATES).toBe(20);
            expect(validateReplyTemplate({title: 't', text: 'x'}, 19, true)).toEqual([]);
            expect(validateReplyTemplate({title: 't', text: 'x'}, 20, true)).toEqual(['limit_reached']);
            expect(validateReplyTemplate({title: 't', text: 'x'}, 20, false)).toEqual([]);
        });
    });

    describe('parseReplyTemplate', () => {
        test('parses a valid value', () => {
            expect(parseReplyTemplate('id1', JSON.stringify({title: 'T', text: 'X', createAt: 5}))).toEqual({id: 'id1', title: 'T', text: 'X', createAt: 5});
        });

        test.each([
            ['invalid json', '{not json'],
            ['null', 'null'],
            ['array', '[]'],
            ['number', '42'],
            ['missing title', JSON.stringify({text: 'X', createAt: 1})],
            ['title not a string', JSON.stringify({title: 1, text: 'X', createAt: 1})],
            ['text not a string', JSON.stringify({title: 'T', text: {}, createAt: 1})],
            ['createAt not a number', JSON.stringify({title: 'T', text: 'X', createAt: '1'})],
            ['title too long', JSON.stringify({title: 'a'.repeat(41), text: 'X', createAt: 1})],
            ['text too long', JSON.stringify({title: 'T', text: 'b'.repeat(1001), createAt: 1})],
            ['empty value', ''],
        ])('returns null for %s without throwing', (_, value) => {
            expect(() => parseReplyTemplate('id1', value)).not.toThrow();
            expect(parseReplyTemplate('id1', value)).toBeNull();
        });
    });
});
