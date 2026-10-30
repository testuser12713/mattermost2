// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import * as ErrorActions from 'mattermost-redux/actions/errors';
import * as PreferenceActions from 'mattermost-redux/actions/preferences';
import {deleteReplyTemplate, saveReplyTemplate} from 'mattermost-redux/actions/reply_templates';

import configureStore from '../../test/test_store';

jest.mock('mattermost-redux/actions/preferences', () => ({
    savePreferences: jest.fn(() => () => Promise.resolve({data: true})),
    deletePreferences: jest.fn(() => () => Promise.resolve({data: true})),
}));

jest.mock('mattermost-redux/actions/errors', () => ({
    logError: jest.fn(() => () => Promise.resolve({data: true})),
}));

const savePreferences = PreferenceActions.savePreferences as jest.Mock;
const deletePreferences = PreferenceActions.deletePreferences as jest.Mock;
const logError = ErrorActions.logError as jest.Mock;

const USER_ID = 'user1';
const SECRET_TITLE = 'Private title';
const SECRET_TEXT = 'Private body text';

describe('actions/reply_templates', () => {
    let store = configureStore();

    beforeEach(() => {
        jest.clearAllMocks();
        store = configureStore({
            entities: {
                users: {currentUserId: USER_ID},
            },
        });
    });

    test('saveReplyTemplate saves a new template as a reply_templates preference with a 26-character name', async () => {
        const result = await store.dispatch(saveReplyTemplate({title: 'Greeting', text: 'Hello there'}));

        expect(savePreferences).toHaveBeenCalledTimes(1);
        const [userId, preferences] = savePreferences.mock.calls[0];
        expect(userId).toBe(USER_ID);
        expect(preferences).toHaveLength(1);

        const [preference] = preferences;
        expect(preference.user_id).toBe(USER_ID);
        expect(preference.category).toBe('reply_templates');
        expect(preference.name).toMatch(/^[a-z0-9]{26}$/);

        const value = JSON.parse(preference.value);
        expect(value).toEqual({title: 'Greeting', text: 'Hello there', createAt: expect.any(Number)});

        expect(result).toEqual({data: {id: preference.name, title: 'Greeting', text: 'Hello there', createAt: value.createAt}});
    });

    test('saveReplyTemplate keeps id and createAt when editing', async () => {
        const id = 'a'.repeat(26);
        await store.dispatch(saveReplyTemplate({id, title: 'T', text: 'X', createAt: 123}));

        const [, [preference]] = savePreferences.mock.calls[0];
        expect(preference.name).toBe(id);
        expect(JSON.parse(preference.value)).toEqual({title: 'T', text: 'X', createAt: 123});
    });

    test('generated ids differ between templates', async () => {
        await store.dispatch(saveReplyTemplate({title: 'A', text: 'a'}));
        await store.dispatch(saveReplyTemplate({title: 'B', text: 'b'}));

        expect(savePreferences.mock.calls[0][1][0].name).not.toBe(savePreferences.mock.calls[1][1][0].name);
    });

    test('deleteReplyTemplate deletes the preference', async () => {
        const id = 'b'.repeat(26);
        const result = await store.dispatch(deleteReplyTemplate(id));

        expect(deletePreferences).toHaveBeenCalledWith(USER_ID, [
            expect.objectContaining({user_id: USER_ID, category: 'reply_templates', name: id}),
        ]);
        expect(result).toEqual({data: true});
    });

    test('a failing save returns an error and logs it without title or text', async () => {
        savePreferences.mockImplementationOnce(() => () => Promise.reject(new Error(`failed ${SECRET_TITLE} ${SECRET_TEXT}`)));

        const result = await store.dispatch(saveReplyTemplate({title: SECRET_TITLE, text: SECRET_TEXT}));

        expect(result.error).toBeDefined();
        expect(result.data).toBeUndefined();
        expect(logError).toHaveBeenCalledTimes(1);

        const logged = JSON.stringify(logError.mock.calls[0]);
        expect(logged).not.toContain(SECRET_TITLE);
        expect(logged).not.toContain(SECRET_TEXT);
        expect(JSON.stringify(result.error)).not.toContain(SECRET_TITLE);
        expect(JSON.stringify(result.error)).not.toContain(SECRET_TEXT);
    });

    test('a failing delete returns an error and logs it', async () => {
        deletePreferences.mockImplementationOnce(() => () => Promise.resolve({error: {message: 'boom', status_code: 500}}));

        const result = await store.dispatch(deleteReplyTemplate('c'.repeat(26)));

        expect(result.error).toEqual(expect.objectContaining({status_code: 500}));
        expect(logError).toHaveBeenCalledTimes(1);
    });
});
