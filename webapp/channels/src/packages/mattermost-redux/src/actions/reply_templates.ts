// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type {ServerError} from '@mattermost/types/errors';
import type {PreferenceType} from '@mattermost/types/preferences';

import {getCurrentUserId} from 'mattermost-redux/selectors/entities/users';
import type {ActionFuncAsync} from 'mattermost-redux/types/actions';
import {generateId} from 'mattermost-redux/utils/helpers';
import {REPLY_TEMPLATES_CATEGORY} from 'mattermost-redux/utils/reply_template_utils';
import type {ReplyTemplate} from 'mattermost-redux/utils/reply_template_utils';

import {logError} from './errors';
import {forceLogoutIfNecessary} from './helpers';
import {deletePreferences, savePreferences} from './preferences';

export const REPLY_TEMPLATE_ID_LENGTH = 26;

// Server-style ids are 26 characters; the RFC-4122 id without dashes has 32 hex digits.
export function generateReplyTemplateId(): string {
    return generateId().replace(/-/g, '').slice(0, REPLY_TEMPLATE_ID_LENGTH);
}

/**
 * Builds an error that carries only codes and status, never the message of the
 * original error, so that no template title or text can reach logs or the UI.
 */
function toSafeError(error: unknown, code: string): ServerError {
    const original = (error && typeof error === 'object' ? error : {}) as Partial<ServerError>;
    const safe: ServerError = {
        message: code,
        server_error_id: typeof original.server_error_id === 'string' ? original.server_error_id : code,
    };
    if (typeof original.status_code === 'number') {
        safe.status_code = original.status_code;
    }

    // The request URL holds only route and user id, never template content; it is
    // needed by forceLogoutIfNecessary.
    if (typeof original.url === 'string') {
        safe.url = original.url;
    }
    return safe;
}

export function saveReplyTemplate(input: {id?: string; title: string; text: string; createAt?: number}): ActionFuncAsync<ReplyTemplate> {
    return async (dispatch, getState) => {
        const currentUserId = getCurrentUserId(getState());
        const template: ReplyTemplate = {
            id: input.id || generateReplyTemplateId(),
            title: input.title,
            text: input.text,
            createAt: typeof input.createAt === 'number' ? input.createAt : Date.now(),
        };

        const preference: PreferenceType = {
            user_id: currentUserId,
            category: REPLY_TEMPLATES_CATEGORY,
            name: template.id,
            value: JSON.stringify({title: template.title, text: template.text, createAt: template.createAt}),
        };

        try {
            const result = await dispatch(savePreferences(currentUserId, [preference]));
            if (result && 'error' in result && result.error) {
                throw result.error;
            }
        } catch (error) {
            const safeError = toSafeError(error, 'reply_templates.save_failed');
            forceLogoutIfNecessary(safeError, dispatch, getState);
            dispatch(logError(safeError));
            return {error: safeError};
        }

        return {data: template};
    };
}

export function deleteReplyTemplate(id: string): ActionFuncAsync {
    return async (dispatch, getState) => {
        const currentUserId = getCurrentUserId(getState());
        const preference: PreferenceType = {
            user_id: currentUserId,
            category: REPLY_TEMPLATES_CATEGORY,
            name: id,
            value: '',
        };

        try {
            const result = await dispatch(deletePreferences(currentUserId, [preference]));
            if (result && 'error' in result && result.error) {
                throw result.error;
            }
        } catch (error) {
            const safeError = toSafeError(error, 'reply_templates.delete_failed');
            forceLogoutIfNecessary(safeError, dispatch, getState);
            dispatch(logError(safeError));
            return {error: safeError};
        }

        return {data: true};
    };
}
