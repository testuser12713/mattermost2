// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type {PreferenceType} from '@mattermost/types/preferences';
import type {GlobalState} from '@mattermost/types/store';

import {getReplyTemplates} from 'mattermost-redux/selectors/entities/reply_templates';
import {getPreferenceKey} from 'mattermost-redux/utils/preference_utils';

function makeState(preferences: PreferenceType[]): GlobalState {
    const myPreferences: Record<string, PreferenceType> = {};
    for (const pref of preferences) {
        myPreferences[getPreferenceKey(pref.category, pref.name)] = pref;
    }

    return {
        entities: {
            preferences: {myPreferences},
        },
    } as unknown as GlobalState;
}

function pref(name: string, value: string, category = 'reply_templates'): PreferenceType {
    return {user_id: 'user1', category, name, value};
}

describe('selectors/entities/reply_templates', () => {
    test('returns parsed templates sorted by createAt and ignores malformed values', () => {
        const state = makeState([
            pref('b'.repeat(26), JSON.stringify({title: 'Second', text: 'two', createAt: 200})),
            pref('a'.repeat(26), JSON.stringify({title: 'First', text: 'one', createAt: 100})),
            pref('c'.repeat(26), '{broken'),
            pref('d'.repeat(26), JSON.stringify({title: 'x', text: 1, createAt: 1})),
            pref('e'.repeat(26), JSON.stringify({title: 'x'.repeat(41), text: 'y', createAt: 1})),
            pref('f'.repeat(26), JSON.stringify({title: 'Other', text: 'z', createAt: 1}), 'other_category'),
        ]);

        expect(getReplyTemplates(state)).toEqual([
            {id: 'a'.repeat(26), title: 'First', text: 'one', createAt: 100},
            {id: 'b'.repeat(26), title: 'Second', text: 'two', createAt: 200},
        ]);
    });

    test('returns an empty list without templates', () => {
        expect(getReplyTemplates(makeState([]))).toEqual([]);
    });

    test('is memoized while preferences are unchanged', () => {
        const state = makeState([pref('a'.repeat(26), JSON.stringify({title: 'T', text: 'X', createAt: 1}))]);
        const first = getReplyTemplates(state);
        expect(getReplyTemplates(state)).toBe(first);

        const sameContent = makeState([pref('a'.repeat(26), JSON.stringify({title: 'T', text: 'X', createAt: 1}))]);
        sameContent.entities.preferences.myPreferences = {
            ...state.entities.preferences.myPreferences,
            'unrelated--name': pref('name', 'v', 'unrelated'),
        };
        expect(getReplyTemplates(sameContent)).toBe(first);

        const changed = makeState([pref('a'.repeat(26), JSON.stringify({title: 'T2', text: 'X', createAt: 1}))]);
        expect(getReplyTemplates(changed)).not.toBe(first);
        expect(getReplyTemplates(changed)[0].title).toBe('T2');
    });
});
