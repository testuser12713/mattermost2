// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {MAX_REPLY_TEMPLATES, MAX_REPLY_TEMPLATE_TEXT_LENGTH, MAX_REPLY_TEMPLATE_TITLE_LENGTH} from 'mattermost-redux/utils/reply_template_utils';

// The storage format is defined in mattermost-redux (which is also built standalone);
// it is re-exported here so webapp code has one place to import reply template names from.
export {
    MAX_REPLY_TEMPLATES,
    MAX_REPLY_TEMPLATE_TEXT_LENGTH,
    MAX_REPLY_TEMPLATE_TITLE_LENGTH,
    REPLY_TEMPLATES_CATEGORY,
    parseReplyTemplate,
} from 'mattermost-redux/utils/reply_template_utils';
export type {ReplyTemplate} from 'mattermost-redux/utils/reply_template_utils';

export type ReplyTemplateError = 'title_empty' | 'title_too_long' | 'text_empty' | 'text_too_long' | 'limit_reached';

export const REPLY_TEMPLATES_SETTINGS_SECTION = 'reply_templates';
export const SEARCH_THRESHOLD = 5;

/**
 * Validates a template the user is about to save. `existingCount` is the number of
 * templates already stored; the limit only applies when a new template is added.
 */
export function validateReplyTemplate(input: {title: string; text: string}, existingCount: number, isNew: boolean): ReplyTemplateError[] {
    const errors: ReplyTemplateError[] = [];

    const title = (input.title ?? '').trim();
    if (!title) {
        errors.push('title_empty');
    } else if (title.length > MAX_REPLY_TEMPLATE_TITLE_LENGTH) {
        errors.push('title_too_long');
    }

    const text = input.text ?? '';
    if (!text.trim()) {
        errors.push('text_empty');
    } else if (text.length > MAX_REPLY_TEMPLATE_TEXT_LENGTH) {
        errors.push('text_too_long');
    }

    if (isNew && existingCount >= MAX_REPLY_TEMPLATES) {
        errors.push('limit_reached');
    }

    return errors;
}
